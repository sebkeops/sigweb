import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Prospect } from '@/types'
import { getCategorieLabel } from './categories'
import { getSigwebConfig, shortSiteDisplay } from './config'
import { buildContent } from './content'
import { normalizeImageBuffer } from './image-normalizer'
import { resolveAffichePhotoBuffer } from './photo-resolver'
import { generateQRCodeDataUrl } from './qr-code'
import type { AfficheData } from './types'
import { resolveQRCodeUrl } from './url-resolver'
import { getProspectWebVariant } from '@/lib/web-variant'

/**
 * Construit l'objet `AfficheData` complet à partir d'un prospect, prêt
 * pour le rendu PDF. Centralise tous les appels async (QR + photo).
 *
 * Server-only : la résolution photo touche à la clé Google Places et au
 * client Supabase admin.
 *
 * Comportement photo (cf. `photo-resolver.ts`) :
 *   1. Photo Hero de la maquette si elle existe (cohérence affiche ↔ web)
 *   2. Sinon 1ère photo Google du prospect
 *   3. Sinon `null` → le composant PDF rend un placeholder dégradé vert
 *
 * Comportement QR (cf. `url-resolver.ts`) :
 *   - Maquette publiée (`prospect.maquette_url`) prioritaire
 *   - Sinon simulation `<categorie>` si elle existe
 *   - Sinon `/simulateur` (fallback)
 */
export async function buildAfficheData(
  prospect: Prospect,
  supabase: SupabaseClient
): Promise<AfficheData> {
  const variant = getProspectWebVariant(prospect)
  const config = getSigwebConfig()

  // Récupère les slugs des simulations publiées pour cibler le QR vers
  // une simulation publique si une existe pour la catégorie du prospect
  // (cf. `resolveQRCodeUrl`). Lecture publique RLS — pas de service role
  // nécessaire ici puisque le client supabase passé peut être anon ou admin.
  const { data: simRows } = await supabase
    .from('projects')
    .select('slug')
    .eq('project_kind', 'simulation')
    .eq('published', true)
  const availableSimulationSlugs = new Set<string>(
    (simRows as { slug: string }[] | null)?.map((r) => r.slug) ?? []
  )

  const qrTargetUrl = resolveQRCodeUrl(prospect, availableSimulationSlugs)

  // En parallèle : photo + QR (les 2 opérations async indépendantes)
  const [photoBuffer, qrDataUrl] = await Promise.all([
    resolveAffichePhotoBuffer(prospect, supabase),
    generateQRCodeDataUrl(qrTargetUrl),
  ])

  const content = buildContent({ variant, prospect, qrTargetUrl })

  // Normalisation format → @react-pdf ne gère que JPEG/PNG. Les uploads
  // admin sont stockés en WebP, donc on doit reconvertir le buffer (sinon
  // <Image> échoue silencieusement et le hero rend vide).
  const normalizedPhoto = photoBuffer ? await normalizeImageBuffer(photoBuffer) : null
  const photoUrl = normalizedPhoto
    ? `data:${normalizedPhoto.mime};base64,${normalizedPhoto.data.toString('base64')}`
    : null

  return {
    variant,
    prospect: {
      nomCommerce: prospect.nom_commerce,
      categorieLabel: getCategorieLabel(prospect.categorie),
      ville: prospect.ville,
    },
    headerEyebrow: content.headerEyebrow,
    hero: {
      eyebrow: content.heroEyebrow,
      title: content.heroTitle,
      photoUrl,
    },
    pitch: {
      eyebrow: content.pitchEyebrow,
      title: content.pitchTitle,
      text: content.pitchText,
    },
    benefits: content.benefits,
    cta: {
      title: content.ctaTitle,
      description: content.ctaDescription,
      urlDisplay: content.ctaUrlDisplay,
      qrDataUrl,
      qrTargetUrl,
    },
    footer: {
      contactName: config.contactName,
      contactRole: `SIGWEB · ${config.contactLocation}`,
      phoneDisplay: config.contactPhoneDisplay,
      phoneHref: `tel:${config.contactPhoneE164}`,
      email: config.contactEmail,
      siteDisplay: shortSiteDisplay(config.siteUrl),
      logoUrl: config.logoUrl,
      avatarUrl: config.avatarUrl,
    },
  }
}
