import 'server-only'

import {
  categorieToGoogleTypes,
  type EnrichedPlaceData,
  getPlaceDetails,
  GooglePlacesError,
  searchNearbyMulti,
} from '@/lib/google-places'
import { computeScore, type ScoringResult } from '@/lib/scoring'
import { createClient } from '@/lib/supabase/server'
import type { ProspectCategorie } from '@/types'
import { isChainBusiness } from './chain-blocklist'

export interface SourcingParams {
  categories: ProspectCategorie[]
  radiusKm: number
  maxResults: number
  excludeAlreadyInCrm: boolean
  excludeClosed: boolean
  excludeChains: boolean
}

export interface SourcingResult {
  placeId: string
  data: EnrichedPlaceData
  score: ScoringResult
  /** true si une fiche prospect avec ce google_place_id existe déjà en BDD */
  alreadyInCrm: boolean
}

/**
 * Limite de concurrence pour les appels Place Details. Voir CLAUDE.md du
 * scoring : on reste défensif sur le rate limiting Google.
 */
const PLACE_DETAILS_CONCURRENCY = 5

/**
 * Exécute N tâches en parallèle avec une concurrence bornée. Petit helper
 * maison pour éviter d'ajouter `p-map` en dépendance pour 10 lignes.
 */
async function pMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  async function worker() {
    while (true) {
      const idx = cursor++
      if (idx >= items.length) return
      results[idx] = await fn(items[idx])
    }
  }
  const n = Math.min(Math.max(concurrency, 1), items.length || 1)
  await Promise.all(Array.from({ length: n }, worker))
  return results
}

function getBaseCoordinates(): { lat: number; lng: number } {
  const lat = parseFloat(process.env.SIGWEB_BASE_LATITUDE ?? '')
  const lng = parseFloat(process.env.SIGWEB_BASE_LONGITUDE ?? '')
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new GooglePlacesError(
      'CONFIG_ERROR',
      'SIGWEB_BASE_LATITUDE / SIGWEB_BASE_LONGITUDE manquantes ou invalides.'
    )
  }
  return { lat, lng }
}

/**
 * Pipeline complet d'une session de sourcing :
 *  1. Mapping catégories CRM → types Google.
 *  2. searchNearby multi-types + dédup par placeId.
 *  3. Filtre commerces fermés (avant Place Details, pour économiser des appels).
 *  4. Lookup BDD des google_place_id déjà connus → annoter ou exclure.
 *  5. Place Details en parallèle (concurrence 5) + scoring.
 *  6. Renvoie un tableau de SourcingResult prêt à afficher.
 */
export async function runSourcing(params: SourcingParams): Promise<SourcingResult[]> {
  // 1. Catégories → types Google
  const types = Array.from(
    new Set(params.categories.flatMap((c) => categorieToGoogleTypes(c)))
  )
  if (types.length === 0) return []

  // 2. Coords + searchNearby
  const { lat, lng } = getBaseCoordinates()
  const radiusM = Math.min(Math.max(Math.round(params.radiusKm * 1000), 100), 50000)
  const maxTotal = Math.min(Math.max(params.maxResults, 1), 50)

  const hits = await searchNearbyMulti(types, lat, lng, radiusM, maxTotal)
  if (hits.length === 0) return []

  // 3. Filtres pré-Place Details (économise des appels API ensuite)
  let candidates = hits
  if (params.excludeClosed) {
    candidates = candidates.filter(
      (h) =>
        h.businessStatus !== 'CLOSED_TEMPORARILY' &&
        h.businessStatus !== 'CLOSED_PERMANENTLY'
    )
  }
  if (params.excludeChains) {
    candidates = candidates.filter((h) => !isChainBusiness(h.name))
  }

  // 4. Lookup BDD pour annotation et/ou exclusion
  const supabase = await createClient()
  const placeIds = candidates.map((h) => h.placeId)
  const existingSet = new Set<string>()
  if (placeIds.length > 0) {
    const { data: existing } = await supabase
      .from('prospects')
      .select('google_place_id')
      .in('google_place_id', placeIds)
    for (const row of existing ?? []) {
      const pid = (row as { google_place_id: string | null }).google_place_id
      if (pid) existingSet.add(pid)
    }
  }
  if (params.excludeAlreadyInCrm) {
    candidates = candidates.filter((h) => !existingSet.has(h.placeId))
  }

  if (candidates.length === 0) return []

  // 5. Place Details + scoring en parallèle (concurrence 5)
  const enriched = await pMap(
    candidates,
    async (hit) => {
      try {
        const details = await getPlaceDetails(hit.placeId)
        const score = computeScore({
          distanceKm: details.distanceKm,
          siteExistantUrl: details.website,
          instagramUrl: null,
          facebookUrl: null,
          googleReviewsCount: details.userRatingCount,
          googleBusinessStatus: details.businessStatus,
        })
        const result: SourcingResult = {
          placeId: hit.placeId,
          data: details,
          score,
          alreadyInCrm: existingSet.has(hit.placeId),
        }
        return result
      } catch (err) {
        // On log mais on n'interrompt pas tout le sourcing pour une fiche cassée
        console.error(`[runSourcing] place_details failed for ${hit.placeId}`, err)
        return null
      }
    },
    PLACE_DETAILS_CONCURRENCY
  )

  return enriched.filter((r): r is SourcingResult => r !== null)
}
