/**
 * Mapping code INSEE « nature juridique » → libellé court humanisé.
 *
 * Référentiel officiel : https://www.insee.fr/fr/information/2028129
 *
 * On ne map QUE les formes juridiques courantes ciblées par Sigweb
 * (commerces de proximité, artisans, professions libérales). Les autres
 * retournent `null` côté code applicatif (l'admin verra alors le code
 * brut via `forme_juridique_code` s'il a besoin).
 *
 * On garde une granularité ADMIN (« SAS », « SARL », « EI ») suffisante
 * pour adapter le pitch commercial ; pas besoin de distinguer les ~50
 * sous-formes INSEE.
 */

const MAP: Record<string, string> = {
  // Entrepreneurs / artisans individuels
  '1000': 'Entrepreneur Individuel',

  // Sociétés à responsabilité limitée
  '5410': 'SARL',
  '5415': 'SARL',
  '5422': 'SARL',
  '5426': 'SARL',
  '5485': 'SARL',
  '5498': 'SARL',
  '5499': 'SARL',

  // EURL (SARL à associé unique)
  '5485x': 'EURL',  // placeholder — l'EURL est techniquement une SARL à associé unique

  // SAS / SASU
  '5710': 'SAS',
  '5720': 'SAS',
  '5730': 'SAS',
  '5800': 'SE',

  // SA
  '5505': 'SA',
  '5510': 'SA',
  '5520': 'SA',
  '5605': 'SA',
  '5610': 'SA',

  // SNC
  '5202': 'SNC',
  '5203': 'SNC',

  // SCI (Sociétés Civiles Immobilières) — surtout pour le bâti
  '6540': 'SCI',
  '6541': 'SCI',
  '6543': 'SCI',
  '6544': 'SCI',
  '6585': 'SCI',
  '6588': 'SCI',
  '6589': 'SCI',
  '6599': 'SCI',

  // Coopératives
  '5460': 'SCOP',
  '5470': 'SCOP',

  // Associations
  '9220': 'Association',
  '9230': 'Association',
  '9240': 'Association',
  '9260': 'Association',
}

/**
 * Convertit un code INSEE de nature juridique en libellé court.
 * Retourne `null` si le code n'est pas dans le mapping (catégorie non
 * ciblée par Sigweb — l'admin pourra toujours lire le code brut).
 */
export function mapNatureJuridique(code: string | null): string | null {
  if (!code) return null
  return MAP[code] ?? null
}
