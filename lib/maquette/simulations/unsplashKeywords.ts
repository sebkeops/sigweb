import type { ProspectCategorie } from '@/types'

/**
 * Mots-clés Unsplash par catégorie de prospect, pour le générateur de
 * simulations publiques (Phase 5).
 *
 * Sert à `lib/maquette/simulations/unsplash.ts` qui interroge l'API
 * `/search/photos?query=...` pour récupérer 7 visuels (hero + histoire +
 * 5 univers). Le générateur peut piocher un mot-clé différent par photo
 * pour varier visuellement, ou réutiliser le même selon le profil cible.
 *
 * Pourquoi un map dédié et pas dans le `MetierPreset` ?
 *   - Couvre uniformément les 34 catégories (incluant les 4 Famille 2 dont
 *     les templates sont hardcodés hors de `METIER_PRESETS`).
 *   - Évite de gonfler les ~1700 lignes de `metiers.ts` avec une concern
 *     qui n'est utilisée que par le générateur de simulations publiques.
 *   - Permet d'ajuster les keywords sans toucher aux presets métier (qui
 *     pilotent le rendu visuel des vraies maquettes prospects).
 *
 * Convention :
 *   - 4 à 6 mots-clés par catégorie
 *   - Anglais (couverture API Unsplash meilleure qu'en français)
 *   - Préférer du concret/visible (`bakery`, `bread`) plutôt que de
 *     l'abstrait (`artisanal`, `quality`)
 *   - Pas de marques ni de noms propres
 *   - Couvrir le métier + 1-2 attributs visuels emblématiques (outils,
 *     produits, scènes typiques)
 */
export const UNSPLASH_KEYWORDS_BY_CATEGORIE: Record<ProspectCategorie, readonly string[]> = {
  // ── Famille bouche ──
  boulangerie:   ['bakery', 'bread', 'croissant', 'french bakery', 'pastry', 'baguette'],
  boucherie:     ['butcher shop', 'meat counter', 'charcuterie', 'butcher cuts', 'sausage'],
  restaurant:    ['french restaurant', 'bistro', 'plated food', 'restaurant kitchen', 'fine dining'],
  pizzeria:      ['pizzeria', 'wood fired pizza', 'italian pizza', 'pizza oven', 'margherita'],
  primeur:       ['fruit shop', 'vegetable market', 'fresh produce', 'greengrocer', 'farmers market'],
  fromager:      ['cheese shop', 'artisan cheese', 'cheese counter', 'cheese wheel'],
  caviste:       ['wine shop', 'wine cellar', 'sommelier', 'wine bottles'],
  bar_cafe:      ['french cafe', 'espresso bar', 'cafe terrace', 'parisian cafe', 'latte art'],
  traiteur:      ['catering buffet', 'gourmet platter', 'canapes', 'food platter'],
  chocolatier:   ['chocolate shop', 'chocolatier', 'pralines', 'artisan chocolate', 'truffles'],
  epicerie_fine: ['gourmet grocery', 'delicatessen', 'fine food shop', 'gourmet products'],

  // ── Services à la personne ──
  coiffeur:            ['hair salon', 'hairdresser', 'haircut', 'salon scissors', 'styling chair'],
  esthetique:          ['beauty salon', 'facial treatment', 'skincare', 'spa lounge'],
  kine:                ['physiotherapy', 'physical therapy', 'rehabilitation', 'massage therapy'],
  osteopathe:          ['osteopathy', 'manual therapy', 'back treatment', 'holistic medicine'],
  praticien_bien_etre: ['wellness studio', 'relaxation', 'holistic health', 'meditation room'],
  cabinet:             ['medical office', 'consultation room', 'healthcare practice', 'doctor office'],

  // ── Bâtiment & artisanat ──
  menuisier:    ['carpenter', 'woodworking workshop', 'joinery', 'custom wood furniture'],
  plombier:     ['plumber', 'plumbing pipes', 'plumbing tools', 'bathroom installation'],
  electricien:  ['electrician', 'electrical wiring', 'electrical panel', 'electrical work'],
  peintre:      ['house painter', 'paint roller', 'wall painting', 'paint cans'],
  paysagiste:   ['landscape gardener', 'garden design', 'hedge trimming', 'lawn care'],
  macon:        ['stonemason', 'construction site', 'brick wall', 'masonry'],
  couvreur:     ['roofer', 'roof tiles', 'roofing work', 'slate roof'],
  carreleur:    ['tile installer', 'ceramic tiles', 'tile work', 'mosaic floor'],
  piscinier:    ['swimming pool', 'pool construction', 'backyard pool', 'pool maintenance'],

  // ── Commerces & services ──
  photographe:  ['photographer', 'photo studio', 'camera lens', 'portrait session'],
  fleuriste:    ['florist', 'flower shop', 'bouquet', 'floral arrangement'],
  bijoutier:    ['jewelry shop', 'jeweler', 'gold rings', 'gemstones'],
  librairie:    ['bookstore', 'library shelves', 'book reading', 'independent bookshop'],
  garagiste:    ['car mechanic', 'garage workshop', 'auto repair', 'mechanic tools'],

  // ── Hébergement ──
  gite:    ['rural cottage', 'country house', 'charming guesthouse', 'french countryside'],
  camping: ['campsite', 'camping pitch', 'outdoor camping', 'tent nature'],

  // ── Fallback ──
  autre:   ['small local shop', 'artisan workshop', 'french storefront', 'small business'],
}

/**
 * Pioche un mot-clé Unsplash pour une catégorie donnée. Si `index` est
 * fourni, on prend l'élément à cet index (modulo la taille du pool) pour
 * varier déterministiquement sur plusieurs photos d'une même simulation.
 */
export function getUnsplashKeyword(
  categoryId: ProspectCategorie,
  index = 0
): string {
  const pool = UNSPLASH_KEYWORDS_BY_CATEGORIE[categoryId]
  return pool[index % pool.length] as string
}
