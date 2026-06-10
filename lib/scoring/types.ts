/**
 * Données nécessaires pour calculer le score d'un prospect.
 * Volontairement découplé du type Prospect pour rester pur et testable
 * sans dépendre de la BDD ni de l'enrichissement Google.
 */
export interface ScoringInput {
  distanceKm: number | null
  siteExistantUrl: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  googleReviewsCount: number | null
  googleBusinessStatus: string | null
  /**
   * État administratif Sirene : 'A' (Active), 'F' (Fermée), 'C' (Cessée), null.
   * Si F ou C, `computeScore` force le total à 0 — un commerce légalement
   * fermé n'a aucune valeur de prospection, peu importe les autres critères.
   * Cf. CONTEXT.md (Lot 1) : "Sirene : etat_administratif != 'A' → exclu".
   */
  etatAdministratif: 'A' | 'F' | 'C' | null
}

/** Résultat d'un sous-critère. */
export interface CriteriaResult {
  points: number
  /** Vide si la règle n'a rien à dire (ex: malus = 0). */
  explanation: string
}

/**
 * Résultat global du calcul. `total` est plafonné [0, 10].
 * Les sous-scores sont les valeurs brutes avant plafonnage.
 */
export interface ScoringResult {
  total: number
  proximite: number
  besoinWeb: number
  activite: number
  malus: number
  explanations: string[]
}
