/**
 * Normalisation conservatrice du nom de commerce pour la dédup nom+CP
 * dans l'import Sirene (CRM v3 — chantier Sirene/PageSpeed Lot 1 étape 5).
 *
 * Pourquoi conservateur : on veut éviter les faux positifs ("Boucherie
 * Dupont" et "Boucherie Dupond" doivent être considérés différents) ET
 * les faux négatifs sur des variantes triviales (apostrophes, espaces
 * multiples, forme juridique). En cas de doute, le pipeline d'import
 * pose un `dedup_warning` plutôt que de fusionner — l'admin tranche.
 *
 * Logique :
 *   1. Trim + lowercase
 *   2. Supprime les formes juridiques courantes (SARL, SAS, etc.) en
 *      tant que mots entiers — pas en milieu de mot
 *   3. Remplace apostrophes / tirets / virgules / points par des espaces
 *   4. Compresse les espaces multiples
 *
 * Pas de stemming, pas de Levenshtein : la dédup conservatrice est
 * volontaire. On rate plutôt que de fusionner par erreur.
 */
export function normalizeNomCommerce(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\b(sarl|sas|sa|eurl|sci|snc|scop|scs|sasu)\b/g, '')
    .replace(/['’\-,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
