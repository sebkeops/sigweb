'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  enrichBySiret,
  extractSireneAdditionalFields,
  searchSireneByNameAndCp,
  type SireneEstablishment,
} from '@/lib/sirene/sirene'
import { normalizeNomCommerce } from '@/lib/sirene/normalize-name'
import { buildScoreDbFields, toScoringInput } from '@/lib/scoring/apply'
import type { Prospect } from '@/types'

/**
 * Server action : enrichit un prospect existant avec les données Sirene
 * (Lot 2 PR B). Réutilisable telle quelle par le script de masse (PR B').
 *
 * Stratégie de matching, dans l'ordre :
 *   1. SIRET déjà présent sur le prospect → `enrichBySiret` (cas simple,
 *      idéal pour un re-enrichissement / actualisation périodique)
 *   2. Sinon, recherche `searchSireneByNameAndCp(nom, code_postal)` :
 *      - 0 résultat → 'not_found'
 *      - 1 résultat → enrichissement avec confiance
 *      - >1 résultats → 'ambiguous' : on n'écrit RIEN, on signale
 *
 * Garde-fous :
 *   - Ne touche jamais aux champs Google (google_place_id, google_rating,
 *     google_photo_refs, google_reviews, etc.).
 *   - Si la fiche avait déjà un sirene_enriched_at et que `options.force`
 *     n'est pas true, refuse pour éviter un écrasement involontaire (sauf
 *     si appelé en mode "rafraîchissement explicite").
 *   - Dirigeant : la décision diffusible vs non est calculée dans
 *     `extractSireneAdditionalFields` — on enregistre tel quel (la flag
 *     `dirigeant_nom_diffusible` filtre l'affichage côté UI).
 *   - `source` passe à 'both' si elle était 'sourcing' ou 'manuel' (vraie
 *     fusion cross-canal). Si elle était 'enrichissement' on bascule aussi
 *     en 'both'. Si déjà 'sirene' ou 'both', inchangée.
 *   - Recalcule le score (qui prend désormais etat_administratif en compte
 *     pour forcer 0 sur les fermés/cessés).
 */

export type EnrichSireneResult =
  | {
      success: true
      mode: 'by_siret' | 'by_name_cp'
      siret: string
      dirigeant_diffusible: boolean
    }
  | {
      success: false
      reason:
        | 'unauthorized'
        | 'not_found_prospect'
        | 'missing_inputs'      // ni SIRET ni (nom + CP)
        | 'sirene_not_found'    // matching n'a rien renvoyé
        | 'sirene_ambiguous'    // >1 candidats nom+CP → revue manuelle requise
        | 'sirene_unavailable'  // API HS / timeout / rate-limit
        | 'already_enriched'    // déjà enrichi, force requise
        | 'db_error'
      message: string
      /** Pour ambiguous : nombre de candidats trouvés, pour aider l'UI. */
      candidatesCount?: number
    }

export async function enrichExistingProspectFromSirene(
  prospectId: string,
  options: { force?: boolean } = {}
): Promise<EnrichSireneResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, reason: 'unauthorized', message: 'Non autorisé.' }
  }

  const { data: prospect, error: fetchErr } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .maybeSingle<Prospect>()

  if (fetchErr) {
    console.error('[sirene-enrich] fetch prospect', fetchErr)
    return { success: false, reason: 'db_error', message: 'Erreur BDD lors du chargement du prospect.' }
  }
  if (!prospect) {
    return { success: false, reason: 'not_found_prospect', message: 'Prospect introuvable.' }
  }

  // Protection contre l'écrasement involontaire : si déjà enrichi récemment
  // et qu'on n'est pas en mode "force" (= utilisateur a confirmé), on refuse.
  if (prospect.sirene_enriched_at && !options.force) {
    return {
      success: false,
      reason: 'already_enriched',
      message: 'Prospect déjà enrichi. Confirmer pour rafraîchir les données Sirene.',
    }
  }

  // Décision de la stratégie de matching
  const establishment = await resolveEstablishment(prospect)
  if (!establishment.ok) return establishment.error

  return await writeEnrichment(supabase, prospect, establishment.data, establishment.mode)
}

interface ResolveOk {
  ok: true
  data: SireneEstablishment
  mode: 'by_siret' | 'by_name_cp'
}
interface ResolveErr {
  ok: false
  error: Extract<EnrichSireneResult, { success: false }>
}

async function resolveEstablishment(p: Prospect): Promise<ResolveOk | ResolveErr> {
  // 1) SIRET prioritaire (le cas le plus fiable)
  if (p.siret) {
    const r = await enrichBySiret(p.siret)
    if (r.ok) return { ok: true, data: r.data, mode: 'by_siret' }
    if (r.reason === 'not_found') {
      return {
        ok: false,
        error: {
          success: false,
          reason: 'sirene_not_found',
          message: `Aucun établissement Sirene trouvé pour le SIRET ${p.siret}.`,
        },
      }
    }
    return { ok: false, error: sireneUnavailable(r.reason) }
  }

  // 2) Fallback nom + code postal
  if (!p.nom_commerce || !p.code_postal) {
    return {
      ok: false,
      error: {
        success: false,
        reason: 'missing_inputs',
        message: 'Renseigner un SIRET, ou un nom de commerce + code postal pour la recherche.',
      },
    }
  }

  const r = await searchSireneByNameAndCp(p.nom_commerce, p.code_postal)
  if (!r.ok) {
    if (r.reason === 'not_found') {
      return {
        ok: false,
        error: {
          success: false,
          reason: 'sirene_not_found',
          message: 'Aucun établissement Sirene trouvé pour ce nom + code postal.',
        },
      }
    }
    return { ok: false, error: sireneUnavailable(r.reason) }
  }

  const candidates = r.data
  if (candidates.length === 0) {
    return {
      ok: false,
      error: {
        success: false,
        reason: 'sirene_not_found',
        message: 'Aucun établissement Sirene trouvé pour ce nom + code postal.',
      },
    }
  }

  // Filtrage strict des homonymes : exiger un match exact du nom normalisé
  // pour ne pas enrichir aveuglément. >1 match exact → ambigu, on refuse.
  const normalizedQuery = normalizeNomCommerce(p.nom_commerce)
  const strictMatches = candidates.filter(
    (c) => normalizeNomCommerce(c.nom_commerce) === normalizedQuery
  )

  if (strictMatches.length === 0) {
    return {
      ok: false,
      error: {
        success: false,
        reason: 'sirene_not_found',
        message: `Pas de match exact pour "${p.nom_commerce}" — ${candidates.length} candidat(s) approximatif(s) ignoré(s) par prudence.`,
        candidatesCount: candidates.length,
      },
    }
  }

  if (strictMatches.length > 1) {
    return {
      ok: false,
      error: {
        success: false,
        reason: 'sirene_ambiguous',
        message: `${strictMatches.length} établissements Sirene trouvés avec le même nom + CP. Revue manuelle requise (vérifier le SIRET puis ré-essayer).`,
        candidatesCount: strictMatches.length,
      },
    }
  }

  return { ok: true, data: strictMatches[0], mode: 'by_name_cp' }
}

function sireneUnavailable(reason: string): Extract<EnrichSireneResult, { success: false }> {
  return {
    success: false,
    reason: 'sirene_unavailable',
    message: `Service Sirene indisponible (${reason}). Réessayer dans quelques minutes.`,
  }
}

async function writeEnrichment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  prospect: Prospect,
  est: SireneEstablishment,
  mode: 'by_siret' | 'by_name_cp'
): Promise<EnrichSireneResult> {
  const nowIso = new Date().toISOString()
  // Re-extraction depuis le payload brut (source de vérité unique, comme
  // dans importSireneBatchAction — cf. fix PR #41).
  const additional = extractSireneAdditionalFields(est.raw)

  // Bascule source en 'both' si la fiche venait d'un autre canal (sourcing
  // Google, manuel, enrichissement Google). Si elle était déjà 'sirene'
  // ou 'both', on ne touche pas.
  const newSource: string =
    prospect.source === 'sirene' || prospect.source === 'both'
      ? prospect.source
      : 'both'

  // Recalcule le score avec le nouvel etat_administratif (la règle "fermé →
  // score 0" de la PR #50 s'appliquera automatiquement si Sirene renvoie F/C).
  const scoreFields = buildScoreDbFields(
    toScoringInput({
      ...prospect,
      etat_administratif: est.etat_administratif,
    }),
    prospect.score_override_manuel
  )

  const { error: updErr } = await supabase
    .from('prospects')
    .update({
      // Identifiant légal — toujours mis à jour (peut être nouveau si on
      // matchait via nom+CP avant)
      siret: est.siret,
      // Données légales standard
      code_naf: est.code_naf,
      libelle_naf: est.libelle_naf,
      date_creation: est.date_creation,
      tranche_effectif: est.tranche_effectif,
      etat_administratif: est.etat_administratif,
      sirene_raw: est.raw,
      sirene_enriched_at: nowIso,
      source: newSource,
      // Champs additionnels Lot 2 (dirigeant + ancienneté + forme juridique)
      dirigeant_nom: additional.dirigeant_nom,
      dirigeant_prenom: additional.dirigeant_prenom,
      dirigeant_nom_diffusible: additional.dirigeant_nom_diffusible,
      date_creation_entreprise: additional.date_creation_entreprise,
      forme_juridique_code: additional.forme_juridique_code,
      forme_juridique_label: additional.forme_juridique_label,
      // Score recalculé (force 0 si Sirene renvoie F/C, cf. PR #50)
      ...scoreFields,
    })
    .eq('id', prospect.id)

  if (updErr) {
    console.error('[sirene-enrich] update', updErr)
    return { success: false, reason: 'db_error', message: 'Erreur BDD lors de la mise à jour.' }
  }

  revalidatePath('/admin/crm')
  revalidatePath(`/admin/crm/${prospect.id}`)

  return {
    success: true,
    mode,
    siret: est.siret,
    dirigeant_diffusible: additional.dirigeant_nom_diffusible,
  }
}
