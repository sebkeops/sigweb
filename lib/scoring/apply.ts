import type { Prospect } from '@/types'
import { computeScore, type ScoringInput } from './index'

/**
 * Liste des champs de prospect qui, s'ils changent, doivent déclencher
 * un recalcul du score automatique.
 */
export const SCORE_RELEVANT_FIELDS = [
  'distance_km',
  'site_existant_url',
  'instagram_url',
  'facebook_url',
  'google_reviews_count',
  'google_business_status',
] as const

/**
 * Extrait les champs pertinents d'un prospect (ou d'un payload partiel)
 * pour les passer à computeScore.
 */
export function toScoringInput(p: Partial<Prospect>): ScoringInput {
  return {
    distanceKm: p.distance_km ?? null,
    siteExistantUrl: p.site_existant_url ?? null,
    instagramUrl: p.instagram_url ?? null,
    facebookUrl: p.facebook_url ?? null,
    googleReviewsCount: p.google_reviews_count ?? null,
    googleBusinessStatus: p.google_business_status ?? null,
  }
}

/**
 * Snapshot des champs pertinents pour comparer "avant / après" et éviter
 * un UPDATE inutile si rien n'a changé sur le périmètre du score.
 */
export function relevantSnapshot(p: Partial<Prospect>): string {
  return JSON.stringify({
    d: p.distance_km ?? null,
    s: p.site_existant_url ?? null,
    i: p.instagram_url ?? null,
    f: p.facebook_url ?? null,
    r: p.google_reviews_count ?? null,
    b: p.google_business_status ?? null,
  })
}

/**
 * Champs DB dérivés du score, à merger dans un payload INSERT/UPDATE.
 * `score` (champ legacy affiché) tient compte d'un éventuel override manuel.
 */
export function buildScoreDbFields(
  input: ScoringInput,
  overrideManuel: number | null
): {
  score: number
  score_calcule: number
  score_proximite: number
  score_besoin_web: number
  score_activite: number
  score_malus: number
  score_explanations: string[]
  score_calcule_at: string
} {
  const r = computeScore(input)
  return {
    score: overrideManuel ?? r.total,
    score_calcule: r.total,
    score_proximite: r.proximite,
    score_besoin_web: r.besoinWeb,
    score_activite: r.activite,
    score_malus: r.malus,
    score_explanations: r.explanations,
    score_calcule_at: new Date().toISOString(),
  }
}
