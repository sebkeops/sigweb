'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { searchSireneSourcing, type SireneEstablishment } from '@/lib/sirene/sirene'
import { NAF_BY_CATEGORIE } from '@/lib/sirene/naf-mapping'
import { normalizeNomCommerce } from '@/lib/sirene/normalize-name'
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

export interface SireneSourcingParams {
  categorie: ProspectCategorie | 'tous'
  codePostal?: string
  departement?: string
  recentMonths?: number  // 0 = pas de filtre
  excludeAlreadyInCrm: boolean
  perPage?: number
}

export type RunSireneSourcingResult =
  | { success: true; data: SireneSourcingRow[]; warning?: string }
  | { success: false; error: string }

const FRIENDLY_REASONS: Record<string, string> = {
  network: 'Service indisponible. Réessaye dans quelques minutes.',
  http: 'Service indisponible. Réessaye dans quelques minutes.',
  timeout: 'Le service met trop de temps à répondre.',
  rate_limited: 'Trop de recherches récentes. Patiente quelques minutes.',
  parse: 'Réponse inattendue du service. Réessaye.',
  not_found: 'Aucun résultat.',
}

export async function runSireneSourcingAction(
  params: SireneSourcingParams
): Promise<RunSireneSourcingResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé.' }

  if (!params.codePostal && !params.departement) {
    return {
      success: false,
      error: 'Code postal ou département obligatoire.',
    }
  }

  // Mapping catégorie → codes NAF. Une catégorie a 1-3 codes ; on lance
  // une recherche par code et on agrège (data.gouv.fr ne fait pas le OR
  // multi-NAF côté serveur, mais 1-3 appels reste largement sous quota).
  const nafCodes =
    params.categorie === 'tous'
      ? [undefined]
      : NAF_BY_CATEGORIE[params.categorie].length > 0
        ? NAF_BY_CATEGORIE[params.categorie]
        : [undefined]

  // Stratégie de pagination : l'API renvoie les résultats triés par
  // « score » (taille d'entreprise décroissante) sans possibilité d'inverser.
  // Pour le cas dégradé « toutes activités + département » qui ne contient
  // que des grandes entreprises en page 1 (toutes filtrées par GE), on
  // tire plusieurs pages pour atteindre les PME/TPE.
  //   - activité ciblée : 1 page (le NAF restreint déjà fortement)
  //   - 'tous' + departement (zone large) : 5 pages (125 résultats bruts)
  //   - 'tous' + code postal (zone restreinte) : 2 pages
  const maxPages =
    params.categorie === 'tous'
      ? params.departement
        ? 5
        : 2
      : 1

  const allResults: SireneEstablishment[] = []
  const seenSiret = new Set<string>()

  for (const naf of nafCodes) {
    let lastError: string | null = null
    for (let page = 1; page <= maxPages; page++) {
      const result = await searchSireneSourcing({
        codePostal: params.codePostal,
        departement: params.departement,
        codeNaf: naf,
        recentMonths: params.recentMonths && params.recentMonths > 0 ? params.recentMonths : undefined,
        perPage: params.perPage ?? 25,
        page,
      })

      if (!result.ok) {
        lastError = FRIENDLY_REASONS[result.reason] ?? 'Erreur inconnue.'
        break  // page suivante inutile si l'API tombe
      }

      // IMPORTANT : on NE break PAS si result.data est vide après filtrage.
      // L'API renvoie 25 résultats bruts par page, et il est fréquent qu'une
      // page entière soit composée de grandes entreprises (rejetées par
      // notre filtre 'GE') sans qu'on soit arrivé à la fin des résultats
      // disponibles. Ce serait un break précoce qui condamne la pagination.
      // On boucle systématiquement jusqu'à `maxPages`.
      for (const e of result.data) {
        if (seenSiret.has(e.siret)) continue
        seenSiret.add(e.siret)
        allResults.push(e)
      }
    }

    // Si on a 0 résultat sur ce NAF et qu'on n'a rien accumulé jusque-là,
    // remonter l'erreur. Sinon on continue silencieusement avec ce qu'on a.
    if (lastError && allResults.length === 0) {
      return { success: false, error: lastError }
    }
  }

  if (allResults.length === 0) {
    return { success: true, data: [] }
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

  return { success: true, data: rows }
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

