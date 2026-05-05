import 'server-only'

import { fetchPlacesApi } from './client'

const NEARBY_FIELDS =
  'places.id,places.displayName,places.location,places.types,places.primaryType,places.businessStatus,places.formattedAddress,places.rating,places.userRatingCount'

interface NearbyRawPlace {
  id: string
  displayName?: { text?: string }
  formattedAddress?: string
  location?: { latitude?: number; longitude?: number }
  types?: string[]
  primaryType?: string
  businessStatus?: string
  rating?: number
  userRatingCount?: number
}

interface NearbyResponse {
  places?: NearbyRawPlace[]
}

export interface NearbyHit {
  placeId: string
  name: string
  formattedAddress: string | null
  types: string[]
  primaryType: string | null
  businessStatus: string | null
  latitude: number | null
  longitude: number | null
  rating: number | null
  userRatingCount: number | null
}

function normalize(raw: NearbyRawPlace): NearbyHit {
  return {
    placeId: raw.id,
    name: raw.displayName?.text ?? '(sans nom)',
    formattedAddress: raw.formattedAddress ?? null,
    types: raw.types ?? [],
    primaryType: raw.primaryType ?? null,
    businessStatus: raw.businessStatus ?? null,
    latitude: raw.location?.latitude ?? null,
    longitude: raw.location?.longitude ?? null,
    rating: typeof raw.rating === 'number' ? raw.rating : null,
    userRatingCount: typeof raw.userRatingCount === 'number' ? raw.userRatingCount : null,
  }
}

/**
 * Appelle l'endpoint Nearby Search de Places API (New) pour UN type Google.
 * Limites Google :
 *   - `maxResultCount` ∈ [1, 20]
 *   - `radius` ∈ ]0, 50000] mètres
 */
export async function searchNearby(
  includedType: string,
  lat: number,
  lng: number,
  radiusM: number,
  max = 20
): Promise<NearbyHit[]> {
  const data = await fetchPlacesApi<NearbyResponse>('/places:searchNearby', {
    method: 'POST',
    fieldMask: NEARBY_FIELDS,
    body: {
      includedTypes: [includedType],
      maxResultCount: Math.min(Math.max(max, 1), 20),
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: Math.min(Math.max(radiusM, 100), 50000),
        },
      },
      regionCode: 'FR',
      languageCode: 'fr',
    },
  })
  return (data.places ?? []).map(normalize)
}

/**
 * Lance plusieurs Nearby Search en parallèle (un par type Google) puis
 * fusionne par `placeId` pour éviter qu'un commerce remonté dans plusieurs
 * types soit compté en double. Si une catégorie échoue (404, quota, etc.),
 * on log et on continue avec les autres au lieu de tout abandonner.
 *
 * Le résultat est tronqué à `maxTotal` après dédup.
 */
export async function searchNearbyMulti(
  includedTypes: string[],
  lat: number,
  lng: number,
  radiusM: number,
  maxTotal = 20
): Promise<NearbyHit[]> {
  if (includedTypes.length === 0) return []

  const lists = await Promise.all(
    includedTypes.map((t) =>
      searchNearby(t, lat, lng, radiusM, 20).catch((err) => {
        console.error(`[searchNearbyMulti] type=${t} échec`, err)
        return [] as NearbyHit[]
      })
    )
  )

  const dedup = new Map<string, NearbyHit>()
  for (const list of lists) {
    for (const hit of list) {
      if (hit.placeId && !dedup.has(hit.placeId)) {
        dedup.set(hit.placeId, hit)
      }
    }
  }
  return [...dedup.values()].slice(0, Math.min(Math.max(maxTotal, 1), 50))
}
