import {
  ACTIVITE_LABELS,
  BESOIN_WEB_LABELS,
  MALUS_LABELS,
  PROXIMITE_LABELS,
} from './labels'
import type { CriteriaResult } from './types'

/**
 * Critère 1 — Proximité géographique (0 à 4 pts).
 * Conventions de bornes :
 *   - tranche 1 : d ≤ 5 km                   → 4 pts
 *   - tranche 2 : 5 < d < 25 km              → 2 pts
 *   - tranche 3 : 25 ≤ d < 60 km             → 1 pt
 *   - tranche 4 : d ≥ 60 km                  → 0 pt
 *   - distance NULL                          → 0 pt
 */
export function computeProximite(distanceKm: number | null): CriteriaResult {
  if (distanceKm == null) {
    return { points: 0, explanation: PROXIMITE_LABELS.DISTANCE_NON_RENSEIGNEE }
  }
  if (distanceKm <= 5) {
    return { points: 4, explanation: PROXIMITE_LABELS.TRES_PROCHE }
  }
  if (distanceKm < 25) {
    return { points: 2, explanation: PROXIMITE_LABELS.DISTANCE_MOYENNE }
  }
  if (distanceKm < 60) {
    return { points: 1, explanation: PROXIMITE_LABELS.DISTANCE_IMPORTANTE }
  }
  return { points: 0, explanation: PROXIMITE_LABELS.HORS_ZONE }
}

/**
 * Liste de domaines considérés comme outils low-cost / page perso.
 * Match par `includes` (insensible à la casse), donc un sous-domaine ou
 * un chemin contenant ces tokens est aussi détecté.
 */
const LOW_COST_HOSTS = [
  'eatbu.com',
  'sites.google.com',
  'site-solocal.com',
  'wixsite.com',
  'webnode',
  'jimdo',
  'pagesperso',
  'free.fr',
  'blogspot',
  'wordpress.com',
] as const

/**
 * Critère 2 — Besoin web (0 à 4 pts).
 * Logique séquentielle : premier match gagne.
 */
export function computeBesoinWeb(siteExistantUrl: string | null): CriteriaResult {
  const url = (siteExistantUrl ?? '').trim().toLowerCase()
  if (url === '') {
    return { points: 4, explanation: BESOIN_WEB_LABELS.PAS_DE_SITE }
  }
  if (url.includes('instagram.com') || url.includes('facebook.com')) {
    return { points: 4, explanation: BESOIN_WEB_LABELS.RESEAU_SOCIAL_SEUL }
  }
  if (LOW_COST_HOSTS.some((h) => url.includes(h))) {
    return { points: 3, explanation: BESOIN_WEB_LABELS.PLATEFORME_GENERIQUE }
  }
  return { points: 2, explanation: BESOIN_WEB_LABELS.VRAI_SITE }
}

const CLOSED_STATUSES = ['CLOSED_TEMPORARILY', 'CLOSED_PERMANENTLY']

/**
 * Critère 3 — Activité visible (0 à 2 pts).
 * Note : un établissement fermé annule l'activité ET déclenche un malus séparé.
 */
export function computeActivite(
  googleReviewsCount: number | null,
  googleBusinessStatus: string | null
): CriteriaResult {
  if (googleBusinessStatus && CLOSED_STATUSES.includes(googleBusinessStatus)) {
    return { points: 0, explanation: ACTIVITE_LABELS.FERMEE }
  }
  if (googleReviewsCount != null && googleReviewsCount >= 50) {
    return { points: 2, explanation: ACTIVITE_LABELS.CONFIRMEE }
  }
  return { points: 1, explanation: ACTIVITE_LABELS.LIMITEE }
}

/**
 * Malus — 0 ou négatif. Renvoie une explanation vide (filtrée par computeScore)
 * quand il n'y a pas de malus à signaler.
 */
export function computeMalus(googleBusinessStatus: string | null): CriteriaResult {
  if (googleBusinessStatus === 'CLOSED_TEMPORARILY') {
    return { points: -2, explanation: MALUS_LABELS.FERME_TEMPORAIREMENT }
  }
  if (googleBusinessStatus === 'CLOSED_PERMANENTLY') {
    return { points: -2, explanation: MALUS_LABELS.FERME_DEFINITIVEMENT }
  }
  return { points: 0, explanation: '' }
}
