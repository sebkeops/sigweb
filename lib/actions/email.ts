'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  EmailEligibilityError,
  generateMaquettePreview,
  renderEmailContent,
  ScreenshotProviderError,
  sendProspectEmail,
} from '@/lib/email'
import type { WebVariant } from '@/types'

/**
 * Server actions du flow d'envoi d'email de prospection (Phase 6).
 *
 * Toutes les actions vérifient l'auth admin. Aucune ne fait de vérification
 * UI complexe — elles s'appuient sur la modale React (`SendEmailButton.tsx`)
 * pour pré-valider l'éligibilité.
 *
 * Format de retour : discriminated union `{ success: true, ... }` ou
 * `{ success: false, error }` — facilite le if/else dans les UI clients.
 */

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé.')
  return supabase
}

// ─── prepareEmailContent ─────────────────────────────────────────────────
//
// Appelée à l'ouverture de la modale. Génère la preview (ou réutilise le
// cache Storage), rend le HTML/text, retourne tout pour affichage initial.

export type PrepareEmailResult =
  | {
      success: true
      data: {
        variant: WebVariant
        subject: string
        bodyHtml: string
        bodyText: string
        previewImageUrl: string | null
        maquetteUrl: string
        toEmail: string
        from: string
      }
    }
  | { success: false; error: string; code: 'eligibility' | 'preview' | 'other' }

export async function prepareEmailContent(
  prospectId: string,
  variantOverride?: WebVariant
): Promise<PrepareEmailResult> {
  let supabase
  try {
    supabase = await assertAdmin()
  } catch {
    return { success: false, error: 'Non autorisé.', code: 'other' }
  }

  try {
    const rendered = await renderEmailContent(
      { prospectId, variantOverride },
      supabase
    )
    return {
      success: true,
      data: {
        variant: rendered.variant,
        subject: rendered.subject,
        bodyHtml: rendered.bodyHtml,
        bodyText: rendered.bodyText,
        previewImageUrl: rendered.previewImageUrl,
        maquetteUrl: rendered.maquetteUrl,
        toEmail: rendered.toEmail,
        from: `${rendered.fromName} <${rendered.fromEmail}>`,
      },
    }
  } catch (e) {
    if (e instanceof EmailEligibilityError) {
      return { success: false, error: e.reason, code: 'eligibility' }
    }
    if (e instanceof ScreenshotProviderError) {
      return {
        success: false,
        error: `Préparation de la preview échouée : ${e.message}`,
        code: 'preview',
      }
    }
    console.error('[prepareEmailContent]', e)
    return {
      success: false,
      error: 'Erreur lors de la préparation de l\'email.',
      code: 'other',
    }
  }
}

// ─── regenerateEmailPreview ──────────────────────────────────────────────
//
// Force la régénération du screenshot (utile si la maquette a changé OU
// si le screenshot précédent rend mal). Pour forcer ScreenshotOne à
// re-process, on utilise la même logique de cache_key — donc en pratique
// ça ne re-tire que si le `updated_at` a changé. En V1 : régénération
// = "rebuild" si la maquette a été modifiée depuis le dernier rendu.

export type RegeneratePreviewResult =
  | { success: true; previewImageUrl: string; regenerated: boolean }
  | { success: false; error: string }

export async function regenerateEmailPreview(
  prospectId: string
): Promise<RegeneratePreviewResult> {
  let supabase
  try {
    supabase = await assertAdmin()
  } catch {
    return { success: false, error: 'Non autorisé.' }
  }

  const { data: maquette } = await supabase
    .from('maquettes')
    .select('slug, updated_at, published')
    .eq('prospect_id', prospectId)
    .maybeSingle()

  if (!maquette || !maquette.published) {
    return {
      success: false,
      error: 'Maquette introuvable ou non publiée.',
    }
  }

  try {
    const result = await generateMaquettePreview(
      {
        prospectId,
        slug: maquette.slug,
        updatedAt: maquette.updated_at,
      },
      supabase
    )
    return {
      success: true,
      previewImageUrl: result.url,
      regenerated: result.regenerated,
    }
  } catch (e) {
    if (e instanceof ScreenshotProviderError) {
      return { success: false, error: e.message }
    }
    console.error('[regenerateEmailPreview]', e)
    return { success: false, error: 'Erreur de génération.' }
  }
}

// ─── sendEmail ───────────────────────────────────────────────────────────
//
// Envoi réel via Resend, avec édition manuelle possible de subject/body
// (pour quand l'admin retouche le contenu dans la modale avant envoi).

export interface SendEmailInput {
  prospectId: string
  variantOverride?: WebVariant
  customSubject?: string
  customBodyHtml?: string
  customBodyText?: string
  /** Utile pour tester sans envoyer au vrai prospect. */
  toOverride?: string
}

export type SendEmailResult =
  | {
      success: true
      sendId: string
      resendId: string | null
      to: string
      subject: string
    }
  | { success: false; error: string; code: 'eligibility' | 'send' | 'other' }

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  let supabase
  try {
    supabase = await assertAdmin()
  } catch {
    return { success: false, error: 'Non autorisé.', code: 'other' }
  }

  try {
    const sendRow = await sendProspectEmail(
      {
        prospectId: input.prospectId,
        variantOverride: input.variantOverride,
      },
      supabase,
      {
        customSubject: input.customSubject,
        customBodyHtml: input.customBodyHtml,
        customBodyText: input.customBodyText,
        toOverride: input.toOverride,
      }
    )

    // Met à jour `date_dernier_contact` du prospect (cf. brief : "Mise à jour
    // automatique de last_contact_at sur la fiche prospect").
    if (!input.toOverride) {
      await supabase
        .from('prospects')
        .update({ date_dernier_contact: new Date().toISOString() })
        .eq('id', input.prospectId)
    }

    revalidatePath(`/admin/crm/${input.prospectId}`)

    return {
      success: true,
      sendId: sendRow.id,
      resendId: sendRow.resend_id,
      to: sendRow.to_email,
      subject: sendRow.subject,
    }
  } catch (e) {
    if (e instanceof EmailEligibilityError) {
      return { success: false, error: e.reason, code: 'eligibility' }
    }
    console.error('[sendEmail]', e)
    return {
      success: false,
      error: (e as Error)?.message ?? 'Erreur lors de l\'envoi.',
      code: 'send',
    }
  }
}
