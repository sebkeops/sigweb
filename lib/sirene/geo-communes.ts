import 'server-only'

/**
 * Résolution des codes postaux dans un rayon autour d'un point (CRM v3
 * — sourcing Sirene v2 « comme Google »).
 *
 * data.gouv.fr Sirene ne supporte pas la recherche par coordonnées
 * (lat/lng + rayon) ; on contourne en convertissant le rayon utilisateur
 * en liste de communes proches via l'API `geo.api.gouv.fr` (officielle,
 * gratuite, sans clé), puis on récupère leurs codes postaux.
 *
 * Endpoint :
 *   https://geo.api.gouv.fr/communes?lat=Y&lon=X&fields=code,nom,codesPostaux,centre&limit=N
 *
 * Retourne les N communes les plus proches du point, ordre croissant
 * de distance. On filtre côté JS par distance haversine pour respecter
 * le rayon demandé.
 *
 * Dégradation gracieuse : tous les chemins retournent un Result. Jamais
 * de throw.
 */

const API_BASE = 'https://geo.api.gouv.fr/communes'
const REQUEST_TIMEOUT_MS = 5_000

/** Plafond communes retournées par l'API geo (pratique courante). */
const MAX_COMMUNES_FETCHED = 100

export interface CommuneProche {
  code: string  // code INSEE de la commune (5 chiffres)
  nom: string
  /** Tous les CPs associés à cette commune (en général 1, parfois 2-3). */
  codesPostaux: string[]
  /** Distance en km par rapport au centre demandé. */
  distanceKm: number
}

export type GeoResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'network' | 'http' | 'timeout' | 'parse' }

/**
 * Récupère les communes situées dans un rayon (km) autour d'un point.
 *
 * Algorithme :
 *   1. Récupère les 100 communes les plus proches via geo.api.gouv.fr
 *   2. Calcule la distance haversine pour chacune
 *   3. Filtre celles dont la distance <= rayon
 *   4. Trie par distance croissante (le plus proche en 1er)
 */
export async function resolveCommunesInRadius(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): Promise<GeoResult<CommuneProche[]>> {
  const url = new URL(API_BASE)
  url.searchParams.set('lat', String(centerLat))
  url.searchParams.set('lon', String(centerLng))
  url.searchParams.set('fields', 'code,nom,codesPostaux,centre')
  url.searchParams.set('format', 'json')
  url.searchParams.set('geometry', 'centre')
  url.searchParams.set('limit', String(MAX_COMMUNES_FETCHED))

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      console.warn(`[geo-communes] http ${res.status}`)
      return { ok: false, reason: 'http' }
    }

    const json = (await res.json()) as unknown
    if (!Array.isArray(json)) {
      return { ok: false, reason: 'parse' }
    }

    const communes: CommuneProche[] = []
    for (const raw of json) {
      if (!raw || typeof raw !== 'object') continue
      const obj = raw as Record<string, unknown>
      const code = typeof obj.code === 'string' ? obj.code : null
      const nom = typeof obj.nom === 'string' ? obj.nom : null
      const codesPostaux = Array.isArray(obj.codesPostaux)
        ? obj.codesPostaux.filter((cp): cp is string => typeof cp === 'string')
        : []
      const centre = obj.centre as { coordinates?: unknown } | undefined
      const coords = centre?.coordinates
      if (!code || !nom || !Array.isArray(coords) || coords.length < 2) continue
      const [lng, lat] = coords as [number, number]
      if (typeof lat !== 'number' || typeof lng !== 'number') continue

      const distanceKm = haversineKm(centerLat, centerLng, lat, lng)
      if (distanceKm <= radiusKm) {
        communes.push({ code, nom, codesPostaux, distanceKm })
      }
    }

    communes.sort((a, b) => a.distanceKm - b.distanceKm)
    return { ok: true, data: communes }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[geo-communes] timeout')
      return { ok: false, reason: 'timeout' }
    }
    console.warn('[geo-communes] network', err)
    return { ok: false, reason: 'network' }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Extrait la liste des codes postaux uniques depuis une liste de communes
 * (utile pour ensuite paginer les appels Sirene CP par CP).
 *
 * Note : on dédup et on conserve l'ordre de proximité (CP des communes
 * les plus proches en 1er) pour que les recherches Sirene tapent en
 * priorité les zones les plus pertinentes.
 */
export function extractCodesPostaux(communes: CommuneProche[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const c of communes) {
    for (const cp of c.codesPostaux) {
      if (!seen.has(cp)) {
        seen.add(cp)
        result.push(cp)
      }
    }
  }
  return result
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Distance haversine entre 2 points sur la Terre, en km.
 *
 * Approximation sphérique standard (rayon Terre = 6371 km). Précision
 * largement suffisante pour notre cas d'usage (< 0,5 % d'erreur).
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
