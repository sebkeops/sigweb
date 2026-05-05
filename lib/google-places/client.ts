import 'server-only'

export type GooglePlacesErrorCode =
  | 'CONFIG_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'INVALID_URL'
  | 'INVALID_RESPONSE'

export class GooglePlacesError extends Error {
  code: GooglePlacesErrorCode
  constructor(code: GooglePlacesErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'GooglePlacesError'
  }
}

const PLACES_BASE = 'https://places.googleapis.com/v1'

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) throw new GooglePlacesError('CONFIG_ERROR', 'GOOGLE_PLACES_API_KEY manquante.')
  return key
}

interface FetchOptions {
  fieldMask: string
  method?: 'GET' | 'POST'
  body?: unknown
}

export async function fetchPlacesApi<T>(path: string, opts: FetchOptions): Promise<T> {
  const key = getApiKey()
  const url = `${PLACES_BASE}${path}`

  let res: Response
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': opts.fieldMask,
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',
    })
  } catch (err) {
    throw new GooglePlacesError('NETWORK_ERROR', `Erreur réseau Google Places: ${(err as Error).message}`)
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new GooglePlacesError('CONFIG_ERROR', `Clé Google invalide ou non autorisée (${res.status}).`)
    }
    if (res.status === 429) {
      throw new GooglePlacesError('QUOTA_EXCEEDED', 'Quota Google Places dépassé.')
    }
    if (res.status === 404) {
      throw new GooglePlacesError('NOT_FOUND', 'Lieu introuvable.')
    }
    const text = await res.text().catch(() => '')
    throw new GooglePlacesError(
      'INVALID_RESPONSE',
      `Réponse Google inattendue (${res.status}): ${text.slice(0, 200)}`
    )
  }

  try {
    return (await res.json()) as T
  } catch {
    throw new GooglePlacesError('INVALID_RESPONSE', 'Réponse Google non-JSON.')
  }
}

export const PLACE_FIELDS_DETAILS =
  'id,displayName,formattedAddress,addressComponents,location,types,primaryType,primaryTypeDisplayName,businessStatus,rating,userRatingCount,regularOpeningHours,internationalPhoneNumber,nationalPhoneNumber,websiteUri,googleMapsUri,photos'

export const PLACE_FIELDS_SEARCH =
  'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location,places.types,places.primaryType,places.primaryTypeDisplayName,places.businessStatus,places.rating,places.userRatingCount,places.regularOpeningHours,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.photos'
