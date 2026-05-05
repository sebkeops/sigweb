import 'server-only'
import { GooglePlacesError } from './client'

const SHORT_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl', 'g.co'])

/**
 * Suit les redirects d'une URL Google Maps courte (max 3 hops) et renvoie
 * l'URL longue finale. Utilise `redirect: 'manual'` pour pouvoir lire les
 * Location headers étape par étape, sans suivre automatiquement.
 */
async function resolveShortUrl(input: string, maxHops = 3): Promise<string> {
  let current = input
  for (let i = 0; i < maxHops; i++) {
    let host: string
    try {
      host = new URL(current).host
    } catch {
      throw new GooglePlacesError('INVALID_URL', 'URL Google Maps invalide.')
    }
    if (!SHORT_HOSTS.has(host)) return current

    let res: Response
    try {
      res = await fetch(current, { redirect: 'manual', cache: 'no-store' })
    } catch {
      throw new GooglePlacesError('NETWORK_ERROR', 'Impossible de résoudre l\'URL courte.')
    }
    const next = res.headers.get('location')
    if (!next) {
      throw new GooglePlacesError('INVALID_URL', 'URL Google Maps non résolue.')
    }
    current = next
  }
  return current
}

export interface ParsedMapsUrl {
  /** Nom du commerce extrait du segment /place/<name>/ s'il existe. */
  placeName: string | null
  /** Coordonnées extraites du fragment @lat,lon,zoom s'il existe. */
  latitude: number | null
  longitude: number | null
}

/**
 * Extrait nom et coordonnées d'une URL longue Google Maps.
 * On ne tente PAS d'extraire un place_id : le format hex `0xXXX:0xXXX`
 * dans `!1s...` n'est pas le `ChIJ...` que l'API Places (New) attend.
 * Pour récupérer le place_id propre, on fera un Text Search avec le nom.
 */
export function parseMapsUrl(longUrl: string): ParsedMapsUrl {
  let placeName: string | null = null
  let latitude: number | null = null
  let longitude: number | null = null

  try {
    const u = new URL(longUrl)
    const m = u.pathname.match(/\/place\/([^/]+)/)
    if (m && m[1]) {
      placeName = decodeURIComponent(m[1].replace(/\+/g, ' ')).trim() || null
    }
    const at = u.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (at) {
      latitude = parseFloat(at[1])
      longitude = parseFloat(at[2])
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        latitude = null
        longitude = null
      }
    }
  } catch {
    // URL malformée : on retourne tout null, l'appelant lèvera INVALID_URL.
  }

  return { placeName, latitude, longitude }
}

/**
 * Pipeline complet : résolution éventuelle de l'URL courte → parsing.
 */
export async function resolveAndParseMapsUrl(input: string): Promise<ParsedMapsUrl> {
  const longUrl = await resolveShortUrl(input.trim())
  const parsed = parseMapsUrl(longUrl)
  if (!parsed.placeName && parsed.latitude == null) {
    throw new GooglePlacesError(
      'INVALID_URL',
      'URL non reconnue. Essayez la recherche par nom + ville.'
    )
  }
  return parsed
}
