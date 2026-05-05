'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  type EnrichedPlaceData,
  GooglePlacesError,
} from '@/lib/google-places'
import { runSourcing, type SourcingParams, type SourcingResult } from '@/lib/sourcing/run'
import { enrichedToGoogleDbFields } from '@/lib/crm/google-mapping'
import { buildScoreDbFields, toScoringInput } from '@/lib/scoring/apply'
import type { Prospect, ProspectCategorie } from '@/types'

const ALL_CATEGORIES: ProspectCategorie[] = [
  'boulangerie', 'boucherie', 'restaurant', 'pizzeria', 'primeur', 'fromager',
  'caviste', 'coiffeur', 'esthetique', 'kine', 'cabinet', 'menuisier',
  'plombier', 'electricien', 'peintre', 'paysagiste', 'photographe',
  // 'autre' volontairement exclu : pas de mapping Google
]

export type SourcingActionResult =
  | { success: true; data: SourcingResult[] }
  | { success: false; error: string }

function mapErrorToMessage(err: unknown): string {
  if (err instanceof GooglePlacesError) {
    console.error(`[sourcing-action] ${err.code}: ${err.message}`)
    switch (err.code) {
      case 'CONFIG_ERROR':
        return 'Erreur de configuration. Contactez l\'administrateur.'
      case 'QUOTA_EXCEEDED':
        return 'Limite d\'appels Google atteinte. Réessayez plus tard.'
      case 'NOT_FOUND':
        return 'Aucun résultat trouvé.'
      case 'NETWORK_ERROR':
        return 'Impossible de contacter Google. Vérifiez votre connexion.'
      case 'INVALID_RESPONSE':
        return 'Réponse Google inattendue. Réessayez.'
      case 'INVALID_URL':
        return err.message
    }
  }
  console.error('[sourcing-action]', err)
  return 'Erreur inattendue.'
}

/**
 * Lance une session de sourcing. Auth admin + validation stricte des
 * paramètres avant tout appel API. La session est éphémère : aucun
 * stockage en BDD du résultat, c'est l'UI qui garde l'array en mémoire
 * locale jusqu'à l'import explicite.
 */
export async function runSourcingAction(input: {
  categories: string[]
  radiusKm: number
  maxResults: number
  excludeAlreadyInCrm: boolean
  excludeClosed: boolean
  excludeChains: boolean
}): Promise<SourcingActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé.' }

  // Validation stricte
  const cats = (input.categories ?? []).filter((c): c is ProspectCategorie =>
    ALL_CATEGORIES.includes(c as ProspectCategorie)
  )
  if (cats.length === 0) {
    return { success: false, error: 'Sélectionnez au moins une catégorie.' }
  }

  const radiusKm = Number(input.radiusKm)
  if (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > 50) {
    return { success: false, error: 'Rayon invalide (1 à 50 km).' }
  }

  const maxResults = Number(input.maxResults)
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 50) {
    return { success: false, error: 'Limite de résultats invalide (1 à 50).' }
  }

  const params: SourcingParams = {
    categories: cats,
    radiusKm,
    maxResults,
    excludeAlreadyInCrm: !!input.excludeAlreadyInCrm,
    excludeClosed: !!input.excludeClosed,
    excludeChains: !!input.excludeChains,
  }

  try {
    const data = await runSourcing(params)
    return { success: true, data }
  } catch (err) {
    return { success: false, error: mapErrorToMessage(err) }
  }
}

// ── Import en batch ────────────────────────────────────────────────────

export interface ImportFailure {
  name: string
  reason: string
}

export type ImportBatchResult =
  | { success: true; imported: number; skipped: number; failures: ImportFailure[] }
  | { success: false; error: string }

const PLACE_ID_REGEX = /^[A-Za-z0-9_-]{5,}$/
const ALL_CATEGORIES_SET = new Set<ProspectCategorie>(ALL_CATEGORIES)

function isValidEnriched(d: unknown): d is EnrichedPlaceData {
  if (!d || typeof d !== 'object') return false
  const o = d as Record<string, unknown>
  if (typeof o.placeId !== 'string' || !PLACE_ID_REGEX.test(o.placeId)) return false
  if (typeof o.name !== 'string' || o.name.length === 0) return false
  if (typeof o.suggestedCategorie !== 'string') return false
  if (!ALL_CATEGORIES_SET.has(o.suggestedCategorie as ProspectCategorie)
      && o.suggestedCategorie !== 'autre') return false
  return true
}

/**
 * Importe en batch les prospects sélectionnés depuis une session de sourcing.
 *
 * Chaque insertion est faite individuellement pour pouvoir comptabiliser
 * succès et échecs (un doublon `google_place_id` n'arrête pas tout l'import).
 * Les données viennent du client (sourcing récent en mémoire) — on revalide
 * chaque item via `isValidEnriched` avant insertion. Les champs `google_*`
 * et le score sont reconstruits côté serveur à partir des données fournies,
 * pas envoyés par le client.
 */
export async function importSourcingBatchAction(
  items: SourcingResult[]
): Promise<ImportBatchResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé.' }

  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, error: 'Aucun prospect à importer.' }
  }
  if (items.length > 50) {
    return { success: false, error: 'Limite d\'import : 50 prospects par batch.' }
  }

  let imported = 0
  let skipped = 0
  const failures: ImportFailure[] = []

  for (const item of items) {
    const data = item?.data
    if (!isValidEnriched(data)) {
      skipped += 1
      continue
    }

    const categorie: ProspectCategorie = ALL_CATEGORIES_SET.has(data.suggestedCategorie)
      ? data.suggestedCategorie
      : 'autre'

    const googleFields = enrichedToGoogleDbFields(data)

    const scoreFields = buildScoreDbFields(
      toScoringInput({
        distance_km: data.distanceKm,
        site_existant_url: data.website,
        instagram_url: null,
        facebook_url: null,
        google_reviews_count: data.userRatingCount,
        google_business_status: data.businessStatus,
      } as Partial<Prospect>),
      null
    )

    const payload = {
      nom_commerce: data.name.slice(0, 200),
      categorie,
      adresse: data.formattedAddress,
      ville: data.city,
      code_postal: data.postalCode,
      distance_km: data.distanceKm,
      telephone: data.phoneNumber,
      email: null,
      site_existant_url: data.website,
      instagram_url: null,
      facebook_url: null,
      canal: 'a_definir',
      statut: 'a_qualifier',
      notes: null,
      date_dernier_contact: null,
      date_relance_prevue: null,
      source: 'sourcing',
      score_override_manuel: null,
      ...googleFields,
      ...scoreFields,
    }

    const { error } = await supabase.from('prospects').insert(payload)

    if (error) {
      if (error.code === '23505') {
        // Doublon google_place_id — déjà importé entre temps
        skipped += 1
      } else {
        console.error('[importSourcingBatchAction]', data.name, error)
        failures.push({ name: data.name, reason: error.message })
      }
    } else {
      imported += 1
    }
  }

  revalidatePath('/admin/crm')

  return { success: true, imported, skipped, failures }
}
