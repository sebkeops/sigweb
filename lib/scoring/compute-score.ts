import type { ScoringInput, ScoringResult } from './types'
import {
  computeActivite,
  computeBesoinWeb,
  computeMalus,
  computeProximite,
} from './criteria'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Calcule le score total d'un prospect selon la grille v2.
 * Fonction pure : pas d'appel BDD, pas d'effet de bord.
 *
 *   total = clamp(0, 10, proximite + besoinWeb + activite + malus)
 *
 * Les sous-scores retournés sont les valeurs brutes avant plafonnage,
 * pour que l'UI puisse afficher la décomposition fidèlement.
 */
export function computeScore(input: ScoringInput): ScoringResult {
  const proximite = computeProximite(input.distanceKm)
  const besoinWeb = computeBesoinWeb(input.siteExistantUrl)
  const activite = computeActivite(input.googleReviewsCount, input.googleBusinessStatus)
  const malus = computeMalus(input.googleBusinessStatus)

  const sum = proximite.points + besoinWeb.points + activite.points + malus.points
  const total = clamp(sum, 0, 10)

  const explanations = [
    proximite.explanation,
    besoinWeb.explanation,
    activite.explanation,
    malus.explanation,
  ].filter((s) => s.length > 0)

  return {
    total,
    proximite: proximite.points,
    besoinWeb: besoinWeb.points,
    activite: activite.points,
    malus: malus.points,
    explanations,
  }
}
