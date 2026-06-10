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

/**
 * Liste de mots-clés métier à stripper de `nom_commerce` AVANT de chercher
 * dans Sirene (Lot 2 PR B fix).
 *
 * Cas typique : Google nomme un prospect "Boulangerie Le Loup Gourmand"
 * alors que la dénomination INSEE est juste "LE LOUP GOURMAND". Si on
 * passe le nom complet à l'API Sirene, son scoring de pertinence ne
 * matche pas. En strippant "Boulangerie" en début/fin, on récupère le
 * nom distinctif et l'API renvoie le bon résultat.
 *
 * Conservateur : on strippe UNIQUEMENT les mots en début ou fin (pas en
 * milieu de chaîne, où ils sont probablement distinctifs — ex.
 * "Au Vieux Boulanger" garde "boulanger" qui fait partie du nom).
 *
 * Liste alignée sur `ProspectCategorie` mais étendue aux variantes
 * pluriel/féminin couramment utilisées sur Google.
 */
const CATEGORY_KEYWORDS = [
  // Bouche
  'boulangerie', 'boulanger', 'boulangerie patisserie', 'boulangerie pâtisserie',
  'patisserie', 'pâtisserie', 'patissier', 'pâtissier',
  'boucherie', 'boucher', 'boucherie charcuterie',
  'charcuterie', 'charcutier',
  'restaurant', 'restaurants',
  'pizzeria', 'pizza',
  'primeur', 'primeurs',
  'fromager', 'fromagerie', 'cremerie', 'crémerie',
  'caviste',
  'bar', 'café', 'cafe', 'brasserie',
  'traiteur',
  'chocolatier', 'chocolaterie',
  'epicerie', 'épicerie', 'epicerie fine', 'épicerie fine',
  // Services à la personne
  'coiffeur', 'coiffure', 'salon de coiffure', 'salon',
  'esthetique', 'esthétique', 'institut', 'institut de beaute', 'institut de beauté',
  'kine', 'kiné', 'kinesitherapeute', 'kinésithérapeute', 'cabinet',
  'osteopathe', 'ostéopathe',
  // Bâtiment & artisanat
  'menuisier', 'menuiserie',
  'plombier', 'plomberie',
  'electricien', 'électricien', 'electricite', 'électricité',
  'peintre', 'peinture',
  'paysagiste', 'paysagisme',
  'macon', 'maçon', 'maconnerie', 'maçonnerie',
  'couvreur', 'couverture',
  'carreleur', 'carrelage',
  'piscinier', 'piscines',
  // Commerces & services
  'photographe', 'studio photo', 'studio',
  'fleuriste', 'fleurs',
  'bijoutier', 'bijouterie',
  'librairie', 'libraire',
  'garagiste', 'garage',
  // Hébergement
  'gite', 'gîte', 'chambres d hotes', "chambres d'hôtes",
  'camping',
] as const

// Trié par longueur DESC pour stripper d'abord les expressions multi-mots
// (ex. "salon de coiffure" avant "salon", "boulangerie pâtisserie" avant
// "boulangerie"). Évite qu'on rate un strip à cause d'un préfixe plus court.
const CATEGORY_KEYWORDS_SORTED = [...CATEGORY_KEYWORDS].sort(
  (a, b) => b.length - a.length
)

/**
 * Retire les mots-clés métier en début et en fin de `nom` pour récupérer
 * la partie distinctive. Idempotent. Insensible à la casse.
 *
 * Exemples :
 *   "Boulangerie Le Loup Gourmand"  → "Le Loup Gourmand"
 *   "LE LOUP GOURMAND - BOULANGERIE" → "LE LOUP GOURMAND"
 *   "Salon de coiffure Audrey"      → "Audrey"
 *   "Au Vieux Boulanger"            → "Au Vieux Boulanger"  (mot interne préservé)
 *   "Le Bistrot"                    → "Le Bistrot"  (pas de mot métier)
 *
 * Renvoie la chaîne d'origine si après strip elle deviendrait vide
 * (ex. "Boulangerie") — on préfère garder le nom original que renvoyer "".
 */
export function stripCategoryWords(nom: string): string {
  let result = nom.trim()
  if (!result) return result

  // Plusieurs passes : "Boulangerie Patisserie Le Truc" → strip "Boulangerie"
  // puis "Patisserie" → "Le Truc". Plafond pour la robustesse.
  for (let pass = 0; pass < 4; pass++) {
    const before = result
    for (const kw of CATEGORY_KEYWORDS_SORTED) {
      // Préfixe : kw au début, puis espace ou séparateur. Cas typique :
      // "Boulangerie Le Loup Gourmand" → strip "Boulangerie ".
      const prefixRegex = new RegExp(
        `^${escapeRegex(kw)}\\s*[-–—:]?\\s+`,
        'i'
      )
      if (prefixRegex.test(result)) {
        result = result.replace(prefixRegex, '').trim()
        break
      }
      // Suffixe : séparateur OBLIGATOIRE (`-`, `–`, `—`, `:`, `|`) avant
      // kw. Si on permettait juste un espace, on stripperait à tort
      // "Au Vieux Boulanger" (où "Boulanger" est la fin du vrai nom).
      // Cas conservé : "Le Loup Gourmand - Boulangerie", "X | Coiffeur", etc.
      const suffixRegex = new RegExp(
        `\\s+[-–—:|]\\s*${escapeRegex(kw)}\\s*$`,
        'i'
      )
      if (suffixRegex.test(result)) {
        result = result.replace(suffixRegex, '').trim()
        break
      }
    }
    if (result === before) break  // plus rien à stripper
  }

  // Garde-fou : si on a tout vidé (ex. nom = "Boulangerie" seul), on
  // restaure l'original — on préfère avoir 0 match côté API plutôt qu'un
  // appel avec une chaîne vide.
  return result || nom.trim()
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
