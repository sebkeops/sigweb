import 'server-only'
import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { EmailSend, Prospect, WebVariant } from '@/types'
import { getProspectWebVariant } from '@/lib/web-variant'
import { getCategorieLabel } from '@/lib/affiche/categories'
import {
  generateMaquettePreview,
  ScreenshotProviderError,
} from './preview-generator'
import {
  applyHighlightFallback,
  applyPreviewBlock,
  interpolate,
} from './templating'
import { generateUnsubscribeToken } from './unsubscribe-token'

/**
 * Service d'envoi d'emails de prospection via Resend.
 *
 * API publique :
 *   - `renderEmailContent(...)` : prépare le contenu rendu (subject + bodies)
 *     SANS l'envoyer. Utilisé pour le preview dans la modale (Phase 6) et
 *     pour la route admin de visualisation.
 *
 *   - `sendProspectEmail(...)` : envoie effectivement l'email via Resend,
 *     trace l'envoi dans `email_sends`. Accepte des overrides de subject/
 *     body si l'admin a édité le contenu dans la modale.
 *
 * Les deux fonctions vérifient l'éligibilité du prospect (email présent,
 * pas désabonné, maquette publiée). Pas d'auth admin ici — c'est au caller
 * (route handler / server action) de garantir que l'utilisateur est admin.
 */

export interface RenderEmailParams {
  prospectId: string
  /** Force la variante (override scoring auto). */
  variantOverride?: WebVariant
}

export interface RenderedEmail {
  variant: WebVariant
  subject: string
  bodyHtml: string
  bodyText: string
  /** URL Storage de la preview. null si génération échouée → placeholder dans le HTML. */
  previewImageUrl: string | null
  maquetteUrl: string
  toEmail: string
  fromEmail: string
  fromName: string
  /** Adresse de réponse — peut différer de fromEmail si on envoie depuis un
   *  sous-domaine technique mais qu'on veut router les réponses ailleurs. */
  replyToEmail: string
}

export class EmailEligibilityError extends Error {
  constructor(public reason: string) {
    super(reason)
    this.name = 'EmailEligibilityError'
  }
}

// ─── Render (sans envoi) ─────────────────────────────────────────────────

export async function renderEmailContent(
  params: RenderEmailParams,
  supabase: SupabaseClient
): Promise<RenderedEmail> {
  // 1. Charge prospect
  const { data: prospect, error: pErr } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', params.prospectId)
    .maybeSingle<Prospect>()

  if (pErr) throw new Error(`fetch prospect: ${pErr.message}`)
  if (!prospect) throw new EmailEligibilityError('Prospect introuvable')
  if (!prospect.email) {
    throw new EmailEligibilityError('Pas d\'email renseigné pour ce prospect')
  }
  if (prospect.email_unsubscribed) {
    throw new EmailEligibilityError('Prospect désabonné — envoi interdit')
  }

  // 2. Charge maquette publiée
  const { data: maquette } = await supabase
    .from('maquettes')
    .select('slug, updated_at, published')
    .eq('prospect_id', params.prospectId)
    .maybeSingle()

  if (!maquette) {
    throw new EmailEligibilityError('Aucune maquette pour ce prospect')
  }
  if (!maquette.published) {
    throw new EmailEligibilityError(
      'La maquette doit être publiée avant d\'envoyer un email'
    )
  }

  // 3. Charge campagne par défaut
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('is_default', true)
    .maybeSingle()

  if (!campaign) {
    throw new EmailEligibilityError('Aucune campagne par défaut configurée')
  }

  // 4. Détermine la variante
  const variant = params.variantOverride ?? getProspectWebVariant(prospect)

  // 5. Génère la preview (best-effort — un échec n'empêche pas l'envoi)
  let previewImageUrl: string | null = null
  try {
    const result = await generateMaquettePreview(
      {
        prospectId: params.prospectId,
        slug: maquette.slug,
        updatedAt: maquette.updated_at,
      },
      supabase
    )
    previewImageUrl = result.url
  } catch (e) {
    if (e instanceof ScreenshotProviderError) {
      console.warn(
        '[email/sender] preview generation failed, continuing with placeholder:',
        e.message
      )
    } else {
      throw e
    }
  }

  // 6. Construit le set de variables de substitution
  const siteUrl = process.env.SIGWEB_SITE_URL ?? 'https://www.sigweb.fr'
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteUrl
  const maquetteUrl = `${baseUrl}/demos/${maquette.slug}?source=email`
  const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${encodeURIComponent(
    generateUnsubscribeToken(params.prospectId)
  )}`
  const siteDisplay = siteUrl
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '')

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'contact@sigweb.fr'
  const fromName = process.env.RESEND_FROM_NAME ?? 'Sébastien — SIGWEB'
  // Adresse de réponse — utile quand on envoie depuis un sous-domaine technique
  // (ex : `contact@updates.sigweb.fr` côté Resend) mais qu'on veut que les
  // réponses arrivent sur l'adresse principale `contact@sigweb.fr`.
  // Si non défini, fallback sur fromEmail (Resend gère naturellement).
  const replyToEmail = process.env.RESEND_REPLY_TO_EMAIL ?? fromEmail

  const hasGoogleData =
    prospect.google_rating != null && prospect.google_reviews_count != null
  const ratingFr = hasGoogleData
    ? prospect.google_rating!.toFixed(1).replace('.', ',')
    : ''
  const nbAvisStr = hasGoogleData
    ? String(prospect.google_reviews_count!)
    : ''

  const vars: Record<string, string> = {
    nom_commerce: prospect.nom_commerce,
    ville: prospect.ville ?? '',
    categorie: getCategorieLabel(prospect.categorie),
    rating: ratingFr,
    nb_avis: nbAvisStr,
    maquette_url: maquetteUrl,
    preview_image_url: previewImageUrl ?? '',
    unsubscribe_url: unsubscribeUrl,
    logo_url:
      process.env.SIGWEB_LOGO_URL ??
      'https://www.sigweb.fr/images/logo-v2.png',
    avatar_url:
      process.env.SIGWEB_AVATAR_URL ??
      'https://www.sigweb.fr/images/sebastien.siguenza.png',
    site_url: siteUrl,
    site_display: siteDisplay,
    simulateur_url:
      process.env.SIGWEB_SIMULATEUR_URL ?? `${siteUrl}/simulateur`,
    contact_phone_e164: process.env.SIGWEB_CONTACT_PHONE ?? '0651927381',
    contact_phone_display:
      process.env.SIGWEB_CONTACT_PHONE_DISPLAY ?? '06 51 92 73 81',
    contact_email: process.env.SIGWEB_CONTACT_EMAIL ?? 'contact@sigweb.fr',
  }

  // 7. Sélection des templates selon variante
  const subjectTpl =
    variant === 'sans-site'
      ? campaign.variant_sans_site_subject
      : campaign.variant_avec_site_subject
  let bodyHtmlTpl =
    variant === 'sans-site'
      ? campaign.variant_sans_site_body_html
      : campaign.variant_avec_site_body_html
  let bodyTextTpl =
    variant === 'sans-site'
      ? campaign.variant_sans_site_body_text
      : campaign.variant_avec_site_body_text

  // 8. Transformations structurelles AVANT interpolation
  if (!hasGoogleData) {
    bodyHtmlTpl = applyHighlightFallback(bodyHtmlTpl, variant, 'html')
    bodyTextTpl = applyHighlightFallback(bodyTextTpl, variant, 'text')
  }
  if (previewImageUrl) {
    bodyHtmlTpl = applyPreviewBlock(
      bodyHtmlTpl,
      previewImageUrl,
      prospect.nom_commerce
    )
  }

  // 9. Interpolation finale des {{var}}
  return {
    variant,
    subject: interpolate(subjectTpl, vars),
    bodyHtml: interpolate(bodyHtmlTpl, vars),
    bodyText: interpolate(bodyTextTpl, vars),
    previewImageUrl,
    maquetteUrl,
    toEmail: prospect.email,
    fromEmail,
    fromName,
    replyToEmail,
  }
}

// ─── Send (avec trace + overrides éventuels) ─────────────────────────────

export interface SendOptions {
  /** Override subject (pour la modale Phase 6 où l'admin peut éditer). */
  customSubject?: string
  /** Override body HTML (cf. ci-dessus). */
  customBodyHtml?: string
  /** Override body text (cf. ci-dessus). */
  customBodyText?: string
  /** Adresse de destination forcée — utile pour les tests d'envoi à soi-même
   *  sans modifier le prospect. À utiliser avec parcimonie ; trace toujours
   *  le prospect_id réel dans email_sends. */
  toOverride?: string
}

export async function sendProspectEmail(
  params: RenderEmailParams,
  supabase: SupabaseClient,
  options: SendOptions = {}
): Promise<EmailSend> {
  const rendered = await renderEmailContent(params, supabase)

  const finalSubject = options.customSubject ?? rendered.subject
  const finalHtml = options.customBodyHtml ?? rendered.bodyHtml
  const finalText = options.customBodyText ?? rendered.bodyText
  const finalTo = options.toOverride ?? rendered.toEmail

  // 1. Insert email_sends en pending — trace même si Resend foire ensuite.
  const { data: insertedRow, error: insertErr } = await supabase
    .from('email_sends')
    .insert({
      prospect_id: params.prospectId,
      variant: rendered.variant,
      to_email: finalTo,
      from_email: rendered.fromEmail,
      subject: finalSubject,
      body_html: finalHtml,
      body_text: finalText,
      preview_image_url: rendered.previewImageUrl,
      maquette_url: rendered.maquetteUrl,
      status: 'pending',
    })
    .select('*')
    .single<EmailSend>()

  if (insertErr || !insertedRow) {
    throw new Error(`Insert email_sends failed: ${insertErr?.message}`)
  }

  // 2. Récupère la campagne par défaut pour lier campaign_id (best-effort).
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('id')
    .eq('is_default', true)
    .maybeSingle()
  if (campaign?.id) {
    await supabase
      .from('email_sends')
      .update({ campaign_id: campaign.id })
      .eq('id', insertedRow.id)
  }

  // 3. Appelle Resend
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY manquant')
  }

  const resend = new Resend(apiKey)
  // Header `List-Unsubscribe` doit pointer vers l'endpoint **one-click**
  // (POST RFC 8058 sans confirmation visuelle) — distinct du lien cliquable
  // dans le body HTML qui pointe vers la page UI `/unsubscribe`.
  const unsubscribeApiUrl = `${
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sigweb.fr'
  }/api/unsubscribe?token=${encodeURIComponent(
    generateUnsubscribeToken(params.prospectId)
  )}`

  const result = await resend.emails.send({
    from: `${rendered.fromName} <${rendered.fromEmail}>`,
    to: finalTo,
    // Si le destinataire répond, sa réponse part vers `replyToEmail` même si
    // l'expéditeur technique est un sous-domaine vérifié type updates.sigweb.fr.
    replyTo: rendered.replyToEmail,
    subject: finalSubject,
    html: finalHtml,
    text: finalText,
    headers: {
      // RFC 8058 : Gmail/Outlook affichent un bouton "Désabonner" natif et
      // POSTent sur l'URL ci-dessous avec body `List-Unsubscribe=One-Click`.
      // Améliore aussi la délivrabilité (signal anti-spam).
      'List-Unsubscribe': `<${unsubscribeApiUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  })

  if (result.error) {
    // On ne reset pas le row : il reste en 'pending' avec resend_id null.
    // L'admin verra dans l'historique qu'il y a eu un échec et pourra retenter.
    throw new Error(`Resend error: ${result.error.message}`)
  }

  // 4. Met à jour le row avec resend_id + sent_at.
  const { data: updatedRow } = await supabase
    .from('email_sends')
    .update({
      resend_id: result.data?.id ?? null,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', insertedRow.id)
    .select('*')
    .single<EmailSend>()

  return updatedRow ?? insertedRow
}
