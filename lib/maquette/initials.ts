/**
 * Mots à ignorer en français quand on extrait l'initiale d'un nom de commerce.
 * "Le Loup Gourmand" → "L" (pas "L" du "Le", mais "L" du "Loup").
 * "Aux Délices de Sophie" → "D" ("Délices").
 */
const IGNORED_WORDS = new Set([
  'le', 'la', 'les', 'l',
  'du', 'de', 'des', 'd',
  'au', 'aux', 'a',
  'et',
  'un', 'une',
  'chez',
])

/**
 * Première lettre majuscule du premier mot significatif d'un nom de commerce.
 * Utilisée comme fallback typographique quand aucun logo n'est uploadé.
 *
 * Déterministe et sans effet de bord. Retourne 'M' (pour "Maquette") si le
 * nom ne contient aucun mot exploitable (cas extrême d'un nom uniquement
 * composé de mots ignorés ou de caractères non-alphabétiques).
 */
export function getLogoInitial(nomCommerce: string): string {
  const normalized = nomCommerce
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

  const words = normalized
    .split(/[\s'’\-]+/)
    .filter((w) => w.length > 0 && !IGNORED_WORDS.has(w.toLowerCase()))

  for (const word of words) {
    const first = word.match(/[A-Za-z]/)?.[0]
    if (first) return first.toUpperCase()
  }

  // Fallback : première lettre alphabétique du nom brut
  const fallback = normalized.match(/[A-Za-z]/)?.[0]
  return (fallback ?? 'M').toUpperCase()
}
