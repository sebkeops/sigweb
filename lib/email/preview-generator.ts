import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ScreenshotOneProvider } from './screenshot/screenshotone'
import {
  type ScreenshotProvider,
  ScreenshotProviderError,
} from './screenshot/types'

/**
 * Génère (ou réutilise depuis le cache Storage) la preview d'une maquette
 * publiée pour insertion dans un email de prospection.
 *
 * Stratégie de cache :
 *   - Convention de nommage : `email-previews/{prospectId}/{updated_at_unix}.jpg`
 *   - À chaque modification de la maquette, `updated_at` change → nouveau
 *     nom de fichier → on régénère naturellement.
 *   - Tant que la maquette n'a pas changé, on réutilise le fichier existant.
 *   - Côté provider, on transmet aussi `cache_key=prospect-{id}-v{ts}` pour
 *     que ScreenshotOne ne re-process pas inutilement.
 *
 * Erreurs : on throw ScreenshotProviderError si le provider plante. C'est
 * au caller (Phase 5) de décider du fallback gracieux (envoyer l'email
 * sans preview, juste avec le placeholder du template).
 */

const STORAGE_BUCKET = 'maquettes-assets'
const PREVIEW_PREFIX = 'email-previews'

/** Ratio Open Graph standard 1.91:1 — bien rendu dans tous les clients
 *  mail et compatible avec le `aspect-ratio: 1.91 / 1` du template HTML. */
const VIEWPORT_WIDTH = 1200
const VIEWPORT_HEIGHT = 630

/** TTL du cache CDN après upload Storage (en secondes). 1 jour suffit :
 *  le nom de fichier change à chaque modif maquette, donc le CDN ne
 *  servira jamais une vieille preview pour une nouvelle version. */
const STORAGE_CACHE_CONTROL = '86400'

export interface MaquetteRef {
  prospectId: string
  slug: string
  /** ISO — invalide le cache à chaque modification. */
  updatedAt: string
}

export interface PreviewResult {
  /** URL publique Supabase Storage à utiliser comme `{{preview_image_url}}`. */
  url: string
  /** True si on a lancé une nouvelle capture, false si on a réutilisé Storage. */
  regenerated: boolean
}

let providerSingleton: ScreenshotProvider | null = null

function getProvider(): ScreenshotProvider {
  if (providerSingleton) return providerSingleton
  const accessKey = process.env.SCREENSHOTONE_ACCESS_KEY
  if (!accessKey) {
    throw new ScreenshotProviderError(
      'SCREENSHOTONE_ACCESS_KEY manquant dans les variables d\'environnement'
    )
  }
  providerSingleton = new ScreenshotOneProvider(accessKey)
  return providerSingleton
}

function buildStorageFilename(updatedAt: string): string {
  const unix = Math.floor(new Date(updatedAt).getTime() / 1000)
  return `${unix}.jpg`
}

function buildStoragePath(prospectId: string, filename: string): string {
  return `${PREVIEW_PREFIX}/${prospectId}/${filename}`
}

function buildPublicMaquetteUrl(slug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sigweb.fr'
  // Le param `?source=preview` permet à la page /demos/[slug] de savoir
  // qu'elle est screenshotée (utile plus tard si on veut retirer un cookie
  // banner ou un éventuel widget animé qui polluerait la capture).
  return `${baseUrl}/demos/${slug}?source=preview`
}

export async function generateMaquettePreview(
  maquette: MaquetteRef,
  supabase: SupabaseClient
): Promise<PreviewResult> {
  const filename = buildStorageFilename(maquette.updatedAt)
  const path = buildStoragePath(maquette.prospectId, filename)

  // 1. Cache Storage — fichier déjà présent pour cette version ?
  const { data: listing, error: listErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(`${PREVIEW_PREFIX}/${maquette.prospectId}`, { search: filename })

  if (listErr) {
    console.warn('[preview-generator] list error (ignored):', listErr.message)
  }

  if (listing && listing.some((f) => f.name === filename)) {
    const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    return { url: pub.publicUrl, regenerated: false }
  }

  // 2. Capture via provider
  const provider = getProvider()
  const targetUrl = buildPublicMaquetteUrl(maquette.slug)
  // ScreenshotOne refuse tout caractère non alphanumérique dans `cache_key`
  // (donc pas de tirets, ni de slashs). On compacte l'UUID + version.
  const cacheKey = `p${maquette.prospectId.replace(/-/g, '')}v${Math.floor(new Date(maquette.updatedAt).getTime() / 1000)}`

  const buffer = await provider.capture(targetUrl, {
    viewportWidth: VIEWPORT_WIDTH,
    viewportHeight: VIEWPORT_HEIGHT,
    format: 'jpg',
    imageQuality: 85,
    cacheKey,
    cacheTtlSeconds: 60 * 60 * 24 * 30,
  })

  // 3. Upload Storage (upsert: false = pas de race conflict si une autre
  //    requête a déjà uploadé entretemps — on tolère le 409 et on récupère
  //    l'URL publique du fichier qui vient d'être posé par l'autre).
  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: 'image/jpeg',
      cacheControl: STORAGE_CACHE_CONTROL,
      upsert: false,
    })

  if (uploadErr && !/already exists|duplicate/i.test(uploadErr.message)) {
    throw new ScreenshotProviderError(
      `Upload preview Storage échoué : ${uploadErr.message}`,
      uploadErr
    )
  }

  const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { url: pub.publicUrl, regenerated: true }
}

export { ScreenshotProviderError }
