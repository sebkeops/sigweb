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

  // Court-circuit prospect légalement fermé : score forcé à 0 pour le tri
  // (le badge "Fermé · Sirene" affiché en liste signale la cause).
  // On garde la décomposition des sous-scores (utilisée par l'UI explicative)
  // mais on ajoute une explanation en tête pour expliciter le forçage.
  if (input.etatAdministratif === 'F' || input.etatAdministratif === 'C') {
    return {
      total: 0,
      proximite: proximite.points,
      besoinWeb: besoinWeb.points,
      activite: activite.points,
      malus: malus.points,
      explanations: [
        `Entreprise marquée ${input.etatAdministratif === 'F' ? 'fermée' : 'cessée'} (Sirene) — score forcé à 0`,
        ...explanations,
      ],
    }
  }

  return {
    total,
    proximite: proximite.points,
    besoinWeb: besoinWeb.points,
    activite: activite.points,
    malus: malus.points,
    explanations,
  }
}
