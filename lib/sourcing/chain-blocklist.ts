import 'server-only'

/**
 * Liste de noms de chaînes / enseignes nationales à exclure du sourcing.
 * Match insensible à la casse via `includes` sur le nom Google : si une
 * partie du nom matche, le commerce est considéré comme une chaîne.
 *
 * Cette liste est volontairement maintenue à la main, par catégorie. Elle
 * n'est pas exhaustive et peut être complétée au fil de l'eau quand tu
 * croises de nouvelles chaînes pendant ton sourcing.
 */
const CHAIN_TOKENS: string[] = [
  // Grandes surfaces alimentaires
  'carrefour',
  'intermarché',
  'intermarche',
  'leclerc',
  'super u',
  'hyper u',
  'u express',
  'casino',
  'monoprix',
  'franprix',
  'auchan',
  'cora',
  'lidl',
  'aldi',
  'picard',
  'biocoop',
  'naturalia',
  'la vie claire',
  'grand frais',
  'match',
  'spar',
  'g20',
  'colruyt',

  // Boulangeries / pâtisseries chaînes
  'marie blachère',
  'marie blachere',
  'la mie câline',
  'la mie caline',
  'brioche dorée',
  'brioche doree',
  ' paul ', // espace autour pour éviter de matcher "Paul Dupont"
  'paul boulangerie',
  'maison kayser',
  'pomme de pain',
  'columbus café',
  'columbus cafe',
  'starbucks',

  // Restauration rapide
  "mcdonald",
  'burger king',
  'kfc',
  'quick',
  'subway',
  "domino's",
  'dominos',
  'pizza hut',
  'speed rabbit',
  'tacos avenue',
  'o tacos',
  'la mie caline',
  'la pataterie',
  'buffalo grill',
  'flunch',
  'courtepaille',
  'hippopotamus',
  'léon de bruxelles',
  'leon de bruxelles',
  'la boucherie',
  'crocodile',

  // Coiffure
  'saint algue',
  'franck provost',
  'camille albane',
  'jean-louis david',
  'jean louis david',
  'coiff & co',
  'coiff and co',
  'fabio salsa',
  'tchip',

  // Bricolage / jardinerie
  'castorama',
  'leroy merlin',
  'brico dépôt',
  'brico depot',
  'mr bricolage',
  'jardiland',
  'truffaut',
  'gamm vert',
  'point vert',
  'botanic',

  // Optique / parapharmacie
  'optical center',
  'krys',
  'optic 2000',
  'générale d\'optique',
  'generale d\'optique',
  'afflelou',
  'parashop',
]

/**
 * Renvoie `true` si le nom du commerce ressemble à une enseigne nationale
 * connue. Match insensible casse + accents minimaux (la liste contient
 * déjà les variantes accentuées + non accentuées).
 */
export function isChainBusiness(name: string | null | undefined): boolean {
  if (!name) return false
  const n = name.toLowerCase()
  return CHAIN_TOKENS.some((token) => n.includes(token))
}
