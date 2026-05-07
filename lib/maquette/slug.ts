/**
 * Génère un slug "de base" à partir d'un nom de commerce, sans round-trip BDD.
 * Déterministe et sans effet de bord : à entrée équivalente, sortie identique.
 *
 * La déduplication contre la table `maquettes` se fait séparément dans la
 * server action (cf. `ensureUniqueSlug`), pour pouvoir suffixer -2, -3...
 *
 * Garanties :
 * - sortie minuscule, ASCII uniquement (accents retirés)
 * - caractères autorisés : [a-z0-9-] (aligné sur le CHECK BDD)
 * - pas de tirets en début/fin, pas de doublons consécutifs
 * - longueur max 60 (sous le plafond CHECK BDD à 80, marge pour suffixe -NN)
 * - sortie minimale "maquette" si l'entrée se vide après normalisation
 */
export function generateSlugBase(nomCommerce: string): string {
  const normalized = nomCommerce
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retirer les diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')   // remplacer tout ce qui n'est pas alphanum/espace/tiret par espace
    .replace(/[\s-]+/g, '-')         // espaces + tirets multiples → un seul tiret
    .replace(/^-+|-+$/g, '')         // pas de tiret en début/fin
    .slice(0, 60)
    .replace(/-+$/g, '')             // au cas où le slice ait coupé sur un tiret

  return normalized.length > 0 ? normalized : 'maquette'
}

/**
 * Construit un slug suffixé à partir d'un slug de base et d'un compteur.
 * Coupe la base si nécessaire pour rester sous 80 caractères (plafond CHECK BDD).
 */
export function buildSuffixedSlug(base: string, suffix: number): string {
  if (suffix <= 1) return base
  const tag = `-${suffix}`
  if (base.length + tag.length <= 80) return `${base}${tag}`
  // Coupe la base pour faire de la place au suffixe, retire un éventuel tiret final
  const trimmed = base.slice(0, 80 - tag.length).replace(/-+$/g, '')
  return `${trimmed}${tag}`
}
