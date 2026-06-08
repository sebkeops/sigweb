import type { ProspectCategorie } from '@/types'

/**
 * Mapping ProspectCategorie → liste de codes NAF rev2.
 *
 * Plusieurs codes par catégorie : une boulangerie peut être déclarée
 * sous 1071C (cuisson de produits de boulangerie) ou 4724Z (commerce
 * de détail de pain/pâtisserie). On les passe tous à l'API Sirene en
 * OR pour ne rien rater côté sourcing.
 *
 * Les codes sont au format compact sans point ('1071C', pas '10.71C'),
 * conforme au stockage DB normalisé par `normalizeNaf()`.
 *
 * Sources :
 *   - Référentiel INSEE NAF rév. 2 : https://www.insee.fr/fr/information/2406147
 *   - Vérification croisée avec les libellés data.gouv.fr
 *
 * Catégorie 'autre' : pas de NAF par défaut — l'utilisateur passe au
 * texte libre s'il veut tenter une recherche.
 */
export const NAF_BY_CATEGORIE: Record<ProspectCategorie, string[]> = {
  // V1 — Commerces de bouche
  boulangerie: ['1071C', '1071D', '4724Z'],
  boucherie: ['1013B', '4722Z'],
  restaurant: ['5610A', '5610C'],
  pizzeria: ['5610A', '5610C'],
  primeur: ['4721Z'],
  fromager: ['4729Z', '4632A'],
  caviste: ['4725Z'],

  // V1 — Services à la personne
  coiffeur: ['9602A'],
  esthetique: ['9602B'],
  kine: ['8690E'],
  cabinet: ['8621Z', '8622A', '8622B', '8622C'],

  // V1 — Bâtiment & artisanat
  menuisier: ['1623Z', '4332A', '4332B'],
  plombier: ['4322A', '4322B'],
  electricien: ['4321A'],
  peintre: ['4334Z'],
  paysagiste: ['8130Z'],

  // V1 — Commerces & services
  photographe: ['7420Z'],

  // V2 — Commerces de bouche additionnels
  bar_cafe: ['5630Z'],
  traiteur: ['5621Z', '1085Z'],
  chocolatier: ['1082Z', '4724Z'],
  epicerie_fine: ['4711B', '4729Z'],

  // V2 — Bâtiment & artisanat additionnels
  macon: ['4399C'],
  couvreur: ['4391A', '4391B'],
  carreleur: ['4333Z'],
  piscinier: ['4322B', '9329Z'],

  // V2 — Services à la personne additionnels
  osteopathe: ['8690E'],
  praticien_bien_etre: ['9604Z', '9609Z'],

  // V2 — Commerces & services additionnels
  fleuriste: ['4776Z'],
  bijoutier: ['4777Z'],
  librairie: ['4761Z'],
  garagiste: ['4520A', '4520B'],

  // V2 — Hébergement
  gite: ['5520Z', '5510Z'],
  camping: ['5530Z'],

  // Fallback
  autre: [],
}
