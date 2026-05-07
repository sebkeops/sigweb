/**
 * Tokens de design de l'affiche A4 — repris à l'identique des maquettes
 * HTML de référence v4 (sans-site / avec-site).
 *
 * @react-pdf utilise des unités points (pt). L'A4 fait 595×842 pt, ce qui
 * correspond exactement aux 595×842 px des maquettes HTML → on peut
 * reprendre les valeurs en px telles quelles.
 */

export const AFFICHE_COLORS = {
  // Charte SIGWEB
  primary:       '#2F6F4F',   // vert sapin (header, footer, accents)
  primaryLight:  '#577A55',
  accent:        '#E05C0E',   // orange (eyebrow pitch, CTA border, italic CTA)
  accentLight:   '#FFB088',   // orange pâle (italique sur fond sombre)

  // Neutres
  cream:         '#FAFAF7',   // fond principal
  creamWarm:     '#FAF8F4',   // fond CTA
  ctaPeach:      '#FFF1E8',   // fin du dégradé CTA (côté droit)
  ink:           '#1A1814',   // texte principal
  inkSoft:       '#3F3D33',   // texte secondaire (pitch text, benefits)
  inkMuted:      '#6E6B5E',   // texte tertiaire
  white:         '#FFFFFF',
} as const

/**
 * Hauteurs des 6 zones — somme totale ≈ 842 pt (page A4).
 * `flex-shrink: 0` partout, sauf le CTA qui prend l'espace restant
 * via `marginTop: auto` dans la maquette HTML.
 */
export const AFFICHE_DIMENSIONS = {
  pageWidth:    595,
  pageHeight:   842,
  headerHeight: 60,    // 18px padding top + 18 bottom + ~24 contenu
  heroHeight:   270,
  footerHeight: 60,
} as const
