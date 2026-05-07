import 'server-only'

const PLACES_BASE = 'https://places.googleapis.com/v1'

/**
 * Récupère une photo Google Places sous forme de Buffer Node, prête à
 * être passée à `<Image src={buffer}>` de @react-pdf/renderer.
 *
 * Server-only : la clé Google ne doit JAMAIS être exposée au client.
 * Cette fonction est appelée depuis la route handler `/api/admin/affiche/[id]`
 * lors de la composition du PDF.
 *
 * Validation stricte du format de la `ref` (cohérent avec le proxy public
 * `/api/demos/photo`) : `places/X/photos/Y`.
 *
 * Renvoie `null` si :
 *   - la ref ne match pas le format attendu
 *   - la clé API est absente du `.env.local`
 *   - Google Places renvoie une erreur HTTP
 *
 * Le caller bascule alors sur le placeholder dégradé du PDF.
 */

const REF_REGEX = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/

export async function fetchGooglePhotoBuffer(
  photoRef: string,
  options: { maxHeightPx?: number } = {}
): Promise<Buffer | null> {
  if (!REF_REGEX.test(photoRef)) return null

  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) {
    console.error('[affiche/photo-fetcher] GOOGLE_PLACES_API_KEY manquante')
    return null
  }

  const maxHeightPx = Math.min(Math.max(options.maxHeightPx ?? 800, 100), 1600)
  const url = `${PLACES_BASE}/${photoRef}/media?key=${encodeURIComponent(key)}&maxHeightPx=${maxHeightPx}`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.error('[affiche/photo-fetcher] Google response not ok:', res.status)
      return null
    }
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (e) {
    console.error('[affiche/photo-fetcher] fetch failed:', e)
    return null
  }
}

/**
 * Récupère le Buffer d'une photo uploadée par l'admin (stockée dans le bucket
 * Supabase Storage `maquettes-assets`). C'est un simple fetch HTTP sur l'URL
 * publique — pas de clé API ni de validation de format à appliquer ici.
 *
 * On accepte uniquement les URLs `http(s)://...` pour fermer la porte à un
 * `file://` ou à un protocole exotique (défense en profondeur, même si la
 * source de l'URL est `available_photos[].reference` qu'on contrôle).
 */
export async function fetchUploadPhotoBuffer(
  publicUrl: string
): Promise<Buffer | null> {
  if (!/^https?:\/\//i.test(publicUrl)) return null
  try {
    const res = await fetch(publicUrl, { cache: 'no-store' })
    if (!res.ok) {
      console.error('[affiche/photo-fetcher] upload response not ok:', res.status)
      return null
    }
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (e) {
    console.error('[affiche/photo-fetcher] upload fetch failed:', e)
    return null
  }
}
