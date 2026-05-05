import 'server-only'

const PLACES_BASE = 'https://places.googleapis.com/v1'

/**
 * Construit l'URL d'une photo Google Places à partir de sa référence.
 * À appeler UNIQUEMENT côté serveur (la clé API ne doit pas atteindre le client).
 * L'URL résultante peut être passée dans `<img src>` car Google sert l'image
 * via redirect 302, mais elle inclut la clé en query string — ne pas exposer
 * cette URL telle quelle au navigateur. Préférer un endpoint proxy ou un
 * server component qui rend `<img>` avec une URL signée par Google.
 */
export function buildPhotoUrl(photoRef: string, maxWidthPx = 800): string | null {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return null
  if (!photoRef.startsWith('places/')) return null
  const safeWidth = Math.min(Math.max(Math.floor(maxWidthPx), 100), 1600)
  return `${PLACES_BASE}/${photoRef}/media?key=${encodeURIComponent(key)}&maxWidthPx=${safeWidth}`
}
