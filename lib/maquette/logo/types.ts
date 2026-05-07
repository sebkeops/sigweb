/**
 * Couleur extraite, normalisée pour le rendu UI + persistance BDD.
 */
export interface ExtractedColor {
  /** Hex `#RRGGBB`. */
  hex: string
  /** Score de dominance 0–1 (somme = 1 sur l'ensemble retourné). */
  weight: number
}

export interface ExtractedPalette {
  /** Couleur principale recommandée (ex: `#B5512E`). */
  primary: string
  /** Couleur d'accent recommandée (ou primary à 70% lightness si une seule trouvée). */
  accent: string
  /** 3 à 5 couleurs candidates pour le UI de swap rapide. Inclut primary + accent. */
  candidates: ExtractedColor[]
}
