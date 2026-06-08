'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { searchSireneSourcing, type SireneEstablishment } from '@/lib/sirene/sirene'
import { NAF_BY_CATEGORIE } from '@/lib/sirene/naf-mapping'
import { normalizeNomCommerce } from '@/lib/sirene/normalize-name'
import {
  extractCodesPostaux,
  resolveCommunesInRadius,
} from '@/lib/sirene/geo-communes'
import type { ProspectCategorie } from '@/types'

/**
 * Server Actions du sourcing Sirene (CRM v3 — chantier Sirene/PageSpeed,
 * Lot 1 étape 4).
 *
 * Distinct du sourcing Google : la structure des résultats est plus
 * légère (pas d'EnrichedPlaceData, pas de ScoringResult — la cible
 * n'a souvent ni rating ni site, donc le scoring se fait au moment de
 * l'import à partir des seuls champs disponibles).
 *
 * Auth obligatoire (créateur d'un prospect = admin connecté). Dégradation
 * gracieuse : si l'API data.gouv.fr est HS, on retourne un message
 * utilisateur friendly sans crash.
 */

/**
 * Vue normalisée d'un établissement Sirene prête à afficher dans la table
 * des résultats. Ajoute `alreadyInCrm` (le frontend cache l'option import
 * si déjà présent) par rapport à `SireneEstablishment` brut.
 */
export interface SireneSourcingRow extends SireneEstablishment {
  /** true si un prospect avec ce SIRET existe déjà en CRM (dédup). */
  alreadyInCrm: boolean
}

/**
 * Paramètres de la recherche Sirene en mode « centre + rayon + multi-catégories ».
 * Aligné sur le UX du sourcing Google pour offrir la même expérience à l'admin.
 */
export interface SireneSourcingParams {
  /** Latitude du centre de la zone de recherche (typiquement le domicile). */
  centerLat: number
  /** Longitude du centre. */
  centerLng: number
  /** Rayon de recherche en km autour du centre (1-50). */
  radiusKm: number
  /** Catégories Sigweb sélectionnées (≥ 1). Mapping interne vers les NAF. */
  categories: ProspectCategorie[]
  recentMonths?: number  // 0 = pas de filtre
  excludeAlreadyInCrm: boolean
}

export type RunSireneSourcingResult =
  | {
      success: true
      data: SireneSourcingRow[]
      /** Métadonnées de la recherche pour affichage UI (zone résolue, appels effectués). */
      meta?: { communesCount: number; codesPostauxCount: number }
      warning?: string
    }
  | { success: false; error: string }

const FRIENDLY_REASONS: Record<string, string> = {
  network: 'Service indisponible. Réessaye dans quelques minutes.',
  http: 'Service indisponible. Réessaye dans quelques minutes.',
  timeout: 'Le service met trop de temps à répondre.',
  rate_limited: 'Trop de recherches récentes. Patiente quelques minutes.',
  parse: 'Réponse inattendue du service. Réessaye.',
  not_found: 'Aucun résultat.',
}

/** Plafond CPs traités par recherche pour borner le nombre d'appels Sirene. */
const MAX_CODES_POSTAUX = 30

/** Concurrence des appels Sirene parallèles (rate limit data.gouv.fr ~7 req/s). */
const SIRENE_CONCURRENCY = 5

/**
 * Helper simple de concurrence bornée — équivalent local de p-map (5 lignes
 * suffisent, pas besoin d'ajouter une dépendance).
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
      const i = cursor++
      if (i >= items.length) return
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}

export async function runSireneSourcingAction(
  params: SireneSourcingParams
): Promise<RunSireneSourcingResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé.' }

  if (!params.categories || params.categories.length === 0) {
    return { success: false, error: 'Sélectionne au moins une catégorie.' }
  }
  if (!Number.isFinite(params.centerLat) || !Number.isFinite(params.centerLng)) {
    return {
      success: false,
      error: 'Coordonnées du centre manquantes (SIGWEB_BASE_LATITUDE / LONGITUDE).',
    }
  }
  if (params.radiusKm < 1 || params.radiusKm > 50) {
    return { success: false, error: 'Rayon : entre 1 et 50 km.' }
  }

  // 1. Résolution de la zone : centre + rayon → liste de CPs via geo.api.gouv.fr
  const geo = await resolveCommunesInRadius(
    params.centerLat,
    params.centerLng,
    params.radiusKm
  )
  if (!geo.ok) {
    return {
      success: false,
      error: 'Impossible de résoudre la zone géographique. Réessaye.',
    }
  }
  const communes = geo.data
  if (communes.length === 0) {
    return { success: true, data: [], meta: { communesCount: 0, codesPostauxCount: 0 } }
  }
  const codesPostaux = extractCodesPostaux(communes).slice(0, MAX_CODES_POSTAUX)

  // 2. Mapping catégories → NAF distincts. Une recherche par paire (CP × NAF).
  //    On dédup les NAFs car plusieurs catégories peuvent partager un code
  //    (ex: traiteur et chocolatier touchent tous les deux 4724Z).
  const nafSet = new Set<string>()
  for (const cat of params.categories) {
    for (const naf of NAF_BY_CATEGORIE[cat] ?? []) {
      nafSet.add(naf)
    }
  }
  const nafCodes = Array.from(nafSet)
  if (nafCodes.length === 0) {
    return {
      success: false,
      error: 'Aucun code NAF associé aux catégories sélectionnées.',
    }
  }

  // 3. Produit cartésien CP × NAF
  const tasks: Array<{ codePostal: string; codeNaf: string }> = []
  for (const cp of codesPostaux) {
    for (const naf of nafCodes) {
      tasks.push({ codePostal: cp, codeNaf: naf })
    }
  }

  // 4. Exécution avec concurrence bornée (rate limit data.gouv.fr)
  const allResults: SireneEstablishment[] = []
  const seenSiret = new Set<string>()
  let hasError: string | null = null

  await pMap(
    tasks,
    async (task) => {
      const result = await searchSireneSourcing({
        codePostal: task.codePostal,
        codeNaf: task.codeNaf,
        recentMonths:
          params.recentMonths && params.recentMonths > 0
            ? params.recentMonths
            : undefined,
        perPage: 25,
        page: 1,
      })
      if (!result.ok) {
        if (!hasError) hasError = FRIENDLY_REASONS[result.reason] ?? 'Erreur inconnue.'
        return
      }
      for (const e of result.data) {
        if (seenSiret.has(e.siret)) continue
        seenSiret.add(e.siret)
        allResults.push(e)
      }
    },
    SIRENE_CONCURRENCY
  )

  // Si tous les appels ont échoué et aucun résultat → on remonte l'erreur.
  // Sinon on garde ce qu'on a (mode best-effort).
  if (hasError && allResults.length === 0) {
    return { success: false, error: hasError }
  }

  if (allResults.length === 0) {
    return {
      success: true,
      data: [],
      meta: {
        communesCount: communes.length,
        codesPostauxCount: codesPostaux.length,
      },
    }
  }

  // Dédup : check des SIRETs déjà en BDD
  const sirets = allResults.map((e) => e.siret)
  const { data: existing } = await supabase
    .from('prospects')
    .select('siret')
    .in('siret', sirets)
  const existingSet = new Set((existing ?? []).map((r: { siret: string | null }) => r.siret).filter(Boolean) as string[])

  let rows: SireneSourcingRow[] = allResults.map((e) => ({
    ...e,
    alreadyInCrm: existingSet.has(e.siret),
  }))

  if (params.excludeAlreadyInCrm) {
    rows = rows.filter((r) => !r.alreadyInCrm)
  }

  return {
    success: true,
    data: rows,
    meta: {
      communesCount: communes.length,
      codesPostauxCount: codesPostaux.length,
    },
  }
}

// ─── Import batch Sirene ──────────────────────────────────────────────

export interface SireneImportItem {
  siret: string
  nom_commerce: string
  code_naf: string | null
  libelle_naf: string | null
  date_creation: string | null
  tranche_effectif: string | null
  etat_administratif: 'A' | 'F' | 'C' | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  /** Payload brut data.gouv.fr — stocké en sirene_raw. */
  raw: unknown
  /** Catégorie devinée côté UI (par la catégorie de recherche). */
  suggestedCategorie: ProspectCategorie | null
}

export interface SireneImportFailure {
  name: string
  reason: string
}

export type SireneImportBatchResult =
  | {
      success: true
      imported: number
      skipped: number
      merged: number  // SIRET déjà présent → UPDATE des champs Sirene, source='both'
      dedupWarnings: number  // match nom+CP sans SIRET commun → signalé
      failures: SireneImportFailure[]
    }
  | { success: false; error: string }

/**
 * Importe en batch des établissements Sirene vers la table prospects.
 *
 * Logique de dédup (CRITIQUE — cf. brief Phase 2bis) :
 *   1. **Match SIRET fort** : si un prospect avec ce SIRET existe déjà
 *      → UPDATE des colonnes Sirene (sirene_raw, code_naf, etc.) et passe
 *      source de 'sourcing' ou 'enrichissement' à 'both'. Pas de duplicate.
 *   2. **Match nom+CP conservateur** : si pas de SIRET commun mais qu'un
 *      prospect avec le même nom (normalisé) et même code postal existe,
 *      INSERT comme nouveau prospect MAIS avec `dedup_warning` posé pour
 *      signalement manuel. L'admin fusionne lui-même s'il confirme. Pas
 *      de fusion automatique : éviter les faux positifs irréversibles.
 *   3. Sinon : INSERT normal avec source='sirene'.
 */
export async function importSireneBatchAction(
  items: SireneImportItem[]
): Promise<SireneImportBatchResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé.' }

  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, error: 'Aucun établissement à importer.' }
  }
  if (items.length > 50) {
    return { success: false, error: 'Limite d\'import : 50 établissements par batch.' }
  }

  let imported = 0
  let skipped = 0
  let merged = 0
  let dedupWarnings = 0
  const failures: SireneImportFailure[] = []

  const nowIso = new Date().toISOString()

  for (const item of items) {
    if (!item.siret || !/^\d{14}$/.test(item.siret.replace(/\s+/g, ''))) {
      skipped += 1
      continue
    }

    const cleanSiret = item.siret.replace(/\s+/g, '')

    // 1. Cherche un prospect existant avec ce SIRET
    const { data: bySiret } = await supabase
      .from('prospects')
      .select('id, source')
      .eq('siret', cleanSiret)
      .maybeSingle<{ id: string; source: string }>()

    if (bySiret) {
      // UPDATE : merge des colonnes Sirene + source devient 'both' si
      // n'était pas déjà 'sirene'/'both' (vrai cas de fusion cross-canal).
      const newSource: string =
        bySiret.source === 'sirene' || bySiret.source === 'both'
          ? bySiret.source
          : 'both'
      const { error: updErr } = await supabase
        .from('prospects')
        .update({
          siret: cleanSiret,
          code_naf: item.code_naf,
          libelle_naf: item.libelle_naf,
          date_creation: item.date_creation,
          tranche_effectif: item.tranche_effectif,
          etat_administratif: item.etat_administratif,
          sirene_raw: item.raw,
          sirene_enriched_at: nowIso,
          source: newSource,
        })
        .eq('id', bySiret.id)

      if (updErr) {
        console.error('[importSireneBatch] update', item.nom_commerce, updErr)
        failures.push({ name: item.nom_commerce, reason: updErr.message })
      } else {
        merged += 1
      }
      continue
    }

    // 2. Pas de SIRET en commun. Match conservateur nom+CP ?
    let dedupWarning: string | null = null
    if (item.code_postal && item.nom_commerce) {
      const normalizedName = normalizeNomCommerce(item.nom_commerce)
      // ilike pour la casse + tolérance espaces. On limite à 3 candidats
      // pour ne pas perdre du temps si jamais le nom est très commun.
      const { data: nameMatches } = await supabase
        .from('prospects')
        .select('id, nom_commerce, code_postal')
        .eq('code_postal', item.code_postal)
        .ilike('nom_commerce', `%${normalizedName.slice(0, 40)}%`)
        .is('siret', null)
        .limit(3)

      const fuzzyMatch = (nameMatches ?? []).find(
        (m: { nom_commerce: string }) =>
          normalizeNomCommerce(m.nom_commerce) === normalizedName
      )

      if (fuzzyMatch) {
        dedupWarning = `Doublon potentiel : nom + CP correspondent à ${fuzzyMatch.id}. À vérifier manuellement.`
      }
    }

    // 3. INSERT du nouveau prospect Sirene
    const payload = {
      nom_commerce: item.nom_commerce.slice(0, 200),
      categorie: item.suggestedCategorie ?? 'autre',
      adresse: item.adresse,
      ville: item.ville,
      code_postal: item.code_postal,
      distance_km: null,
      telephone: null,
      email: null,
      site_existant_url: null,
      instagram_url: null,
      facebook_url: null,
      canal: 'a_definir',
      statut: 'a_qualifier',
      notes: null,
      date_dernier_contact: null,
      date_relance_prevue: null,
      source: 'sirene',
      siret: cleanSiret,
      code_naf: item.code_naf,
      libelle_naf: item.libelle_naf,
      date_creation: item.date_creation,
      tranche_effectif: item.tranche_effectif,
      etat_administratif: item.etat_administratif,
      sirene_raw: item.raw,
      sirene_enriched_at: nowIso,
      dedup_warning: dedupWarning,
    }

    const { error } = await supabase.from('prospects').insert(payload)

    if (error) {
      if (error.code === '23505') {
        // Conflit SIRET (race condition avec un autre import qui aurait
        // créé la fiche entre nos 2 queries) — on traite comme un skip.
        skipped += 1
      } else {
        console.error('[importSireneBatch]', item.nom_commerce, error)
        failures.push({ name: item.nom_commerce, reason: error.message })
      }
    } else {
      imported += 1
      if (dedupWarning) dedupWarnings += 1
    }
  }

  revalidatePath('/admin/crm')

  return { success: true, imported, skipped, merged, dedupWarnings, failures }
}

