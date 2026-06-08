'use server'

import { createClient } from '@/lib/supabase/server'
import { searchSireneSourcing, type SireneEstablishment } from '@/lib/sirene/sirene'
import { NAF_BY_CATEGORIE } from '@/lib/sirene/naf-mapping'
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

  const allResults: SireneEstablishment[] = []
  const seenSiret = new Set<string>()

  for (const naf of nafCodes) {
    const result = await searchSireneSourcing({
      codePostal: params.codePostal,
      departement: params.departement,
      codeNaf: naf,
      recentMonths: params.recentMonths && params.recentMonths > 0 ? params.recentMonths : undefined,
      perPage: params.perPage ?? 25,
    })

    if (!result.ok) {
      // Une erreur sur un NAF ne doit pas tout casser. Si on a déjà eu
      // des résultats sur les NAFs précédents, on continue et on signale.
      if (allResults.length === 0) {
        return {
          success: false,
          error: FRIENDLY_REASONS[result.reason] ?? 'Erreur inconnue.',
        }
      }
      continue
    }

    for (const e of result.data) {
      if (seenSiret.has(e.siret)) continue
      seenSiret.add(e.siret)
      allResults.push(e)
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
