import type { ProspectCategorie } from '@/types'
import { generateSlugBase } from '@/lib/maquette/slug'
import type { Prng } from './prng'

/**
 * Générateur de données "commerce fictif" pour les simulations publiques.
 *
 * Tout est déterministe via le PRNG passé en argument — réutilisable depuis
 * Phase 6 pour la régénération à seed fixe (slug) des 4 simulations
 * historiques.
 *
 * Pools volontairement français + sud-ouest (Gers / Haute-Garonne /
 * Occitanie) pour rester cohérent avec la cible SIGWEB. Les communes
 * sont de vraies communes pour donner un sentiment d'authenticité, mais
 * combinées à des numéros + rues fictifs pour qu'aucune adresse complète
 * ne corresponde à un vrai commerce.
 */

// ─── Pools de prénoms et noms ──────────────────────────────────────────

const PRENOMS = [
  'Antoine', 'Bastien', 'Benjamin', 'Bruno', 'Camille', 'Cédric', 'Chloé',
  'Christophe', 'Clément', 'Damien', 'David', 'Elsa', 'Émilie', 'Étienne',
  'Fabien', 'Florence', 'Florian', 'François', 'Gabriel', 'Guillaume',
  'Hélène', 'Hugo', 'Inès', 'Isabelle', 'Jean', 'Jérémy', 'Julien', 'Julie',
  'Karine', 'Laetitia', 'Laurent', 'Léa', 'Léo', 'Lisa', 'Louis', 'Lucas',
  'Lucie', 'Manon', 'Marc', 'Marie', 'Marion', 'Mathieu', 'Mathilde',
  'Maxime', 'Mélanie', 'Mickaël', 'Nathalie', 'Nicolas', 'Nina', 'Noé',
  'Olivier', 'Pascal', 'Pauline', 'Philippe', 'Pierre', 'Quentin', 'Raphaël',
  'Romain', 'Sandra', 'Sarah', 'Sébastien', 'Sophie', 'Stéphane', 'Sylvie',
  'Thierry', 'Thomas', 'Valentin', 'Vincent', 'Virginie', 'Xavier', 'Yann',
  'Aurélien', 'Charlotte', 'Élodie', 'Justine', 'Léna', 'Loïc', 'Margot',
  'Sébastienne', 'Émile', 'Adrien',
] as const

const NOMS = [
  'Albert', 'Allard', 'Andrieu', 'Aubert', 'Audouin', 'Barthélémy', 'Bastide',
  'Bernard', 'Bertrand', 'Bessière', 'Bonnafous', 'Bonnet', 'Boussion',
  'Cailhol', 'Capdevielle', 'Cassagne', 'Castex', 'Cazaux', 'Combes',
  'Coutaud', 'Daffis', 'Darnaud', 'Daste', 'Delpech', 'Desbiens', 'Doumic',
  'Dubois', 'Ducasse', 'Dupuy', 'Durand', 'Durieu', 'Estèbe', 'Fabre',
  'Faget', 'Farges', 'Fauré', 'Fournier', 'Gaillard', 'Garbay', 'Gardes',
  'Garrigue', 'Gascon', 'Gerbet', 'Got', 'Granet', 'Hébrard', 'Joulia',
  'Lafon', 'Lafontan', 'Lagarde', 'Lapeyre', 'Laporte', 'Laurens', 'Lavedan',
  'Leblanc', 'Loubet', 'Mariotti', 'Marsan', 'Martin', 'Maurel', 'Maury',
  'Mendiboure', 'Meunier', 'Molinier', 'Monier', 'Nogués', 'Pages', 'Pédoux',
  'Perez', 'Petit', 'Peyrat', 'Pierre', 'Quintard', 'Rabier', 'Rey', 'Rivière',
  'Roque', 'Saint-Martin', 'Sicard', 'Tournier', 'Vergne', 'Vidal',
] as const

// ─── Communes Occitanie (Gers + Haute-Garonne périphérie) ──────────────

interface Commune {
  nom: string
  code_postal: string
}

const COMMUNES_OCCITANIE: readonly Commune[] = [
  { nom: 'Auch',                code_postal: '32000' },
  { nom: 'L\'Isle-Jourdain',    code_postal: '32600' },
  { nom: 'Fleurance',           code_postal: '32500' },
  { nom: 'Condom',              code_postal: '32100' },
  { nom: 'Lectoure',            code_postal: '32700' },
  { nom: 'Mirande',             code_postal: '32300' },
  { nom: 'Pavie',               code_postal: '32550' },
  { nom: 'Pujaudran',           code_postal: '32600' },
  { nom: 'Gimont',              code_postal: '32200' },
  { nom: 'Eauze',               code_postal: '32800' },
  { nom: 'Samatan',             code_postal: '32130' },
  { nom: 'Vic-Fezensac',        code_postal: '32190' },
  { nom: 'Lombez',              code_postal: '32220' },
  { nom: 'Léguevin',            code_postal: '31490' },
  { nom: 'Plaisance-du-Touch',  code_postal: '31830' },
  { nom: 'Colomiers',           code_postal: '31770' },
  { nom: 'Tournefeuille',       code_postal: '31170' },
] as const

// ─── Rues fictives (génériques mais plausibles) ────────────────────────

const RUES = [
  'rue du Marché', 'place de la Halle', 'avenue de la République',
  'rue Gambetta', 'place du Foirail', 'rue Saint-Pierre', 'rue des Pyrénées',
  'avenue Foch', 'place de la Mairie', 'rue du Général-de-Gaulle',
  'rue Jean-Jaurès', 'rue des Tilleuls', 'place de la Cathédrale',
  'rue Victor-Hugo', 'avenue de la Gare', 'rue de la Poste',
  'rue des Cordeliers', 'place du Marcadet', 'rue de la Liberté',
  'cours d\'Étigny', 'rue Émile-Zola', 'place de l\'Église',
] as const

// ─── Templates de nom de commerce par catégorie ────────────────────────

interface NameTemplate {
  /** Template avec placeholders : {prenom}, {nom}, {adjectif} */
  pattern: string
}

/**
 * Templates de noms par catégorie. Le PRNG en pioche un, puis remplit
 * les placeholders avec un prénom / nom / adjectif tirés des pools.
 *
 * Convention : chaque catégorie a 4 à 6 templates pour la variété, mais
 * un set par défaut (`DEFAULT_TEMPLATES`) sert de fallback pour ne pas
 * laisser une catégorie sans templates.
 */
const NAME_TEMPLATES_BY_CATEGORIE: Partial<Record<ProspectCategorie, readonly NameTemplate[]>> = {
  boulangerie: [
    { pattern: 'Boulangerie {nom}' },
    { pattern: 'Aux Délices de {prenom}' },
    { pattern: 'Le Fournil {adjectif}' },
    { pattern: 'La Mie {adjectif}' },
    { pattern: 'Boulangerie-Pâtisserie {nom}' },
  ],
  boucherie: [
    { pattern: 'Boucherie {nom}' },
    { pattern: 'Boucherie-Charcuterie {nom}' },
    { pattern: 'La Maison {nom}' },
    { pattern: 'Aux Saveurs {adjectif}s' },
  ],
  restaurant: [
    { pattern: 'Restaurant {nom}' },
    { pattern: 'Chez {prenom}' },
    { pattern: 'La Table {adjectif}' },
    { pattern: 'L\'Auberge {adjectif}' },
    { pattern: 'Le Bistrot de {prenom}' },
  ],
  pizzeria: [
    { pattern: 'Pizzeria {prenom}' },
    { pattern: 'Pizz\'{prenom}' },
    { pattern: 'Mamma Mia {prenom}' },
    { pattern: 'La Pizz\' de {prenom}' },
  ],
  primeur: [
    { pattern: 'Primeur {nom}' },
    { pattern: 'Aux Fruits & Légumes de {prenom}' },
    { pattern: 'Le Verger {adjectif}' },
  ],
  fromager: [
    { pattern: 'Fromagerie {nom}' },
    { pattern: 'La Cave aux Fromages' },
    { pattern: 'Chez {prenom} le Fromager' },
  ],
  caviste: [
    { pattern: 'Caviste {nom}' },
    { pattern: 'La Cave de {prenom}' },
    { pattern: 'Le Comptoir des Vins' },
  ],
  bar_cafe: [
    { pattern: 'Café {nom}' },
    { pattern: 'Le Bar de la Place' },
    { pattern: 'Chez {prenom}' },
    { pattern: 'Le Comptoir {adjectif}' },
  ],
  traiteur: [
    { pattern: 'Traiteur {nom}' },
    { pattern: 'Aux Saveurs de {prenom}' },
    { pattern: 'L\'Atelier du Goût' },
  ],
  chocolatier: [
    { pattern: 'Chocolaterie {nom}' },
    { pattern: 'Aux Délices Chocolatés' },
    { pattern: 'Maison {nom}, Chocolatier' },
  ],
  epicerie_fine: [
    { pattern: 'Épicerie Fine {nom}' },
    { pattern: 'Le Comptoir {adjectif}' },
    { pattern: 'Aux Saveurs d\'Antan' },
  ],
  coiffeur: [
    { pattern: 'Salon {prenom}' },
    { pattern: 'Coiffure {prenom}' },
    { pattern: 'L\'Atelier Coiffure' },
    { pattern: 'Style by {prenom}' },
  ],
  esthetique: [
    { pattern: 'Institut {prenom}' },
    { pattern: 'Beauté & Bien-être' },
    { pattern: 'L\'Écrin de {prenom}' },
  ],
  kine: [
    { pattern: 'Cabinet de Kinésithérapie {nom}' },
    { pattern: '{prenom} {nom}, Kinésithérapeute' },
  ],
  osteopathe: [
    { pattern: 'Cabinet d\'Ostéopathie {nom}' },
    { pattern: '{prenom} {nom}, Ostéopathe D.O.' },
  ],
  praticien_bien_etre: [
    { pattern: 'Cabinet {prenom} {nom}' },
    { pattern: 'L\'Espace Bien-être' },
    { pattern: 'Sérénité & Vous' },
  ],
  cabinet: [
    { pattern: 'Cabinet {nom}' },
    { pattern: 'Cabinet {prenom} {nom}' },
  ],
  menuisier: [
    { pattern: 'Menuiserie {nom}' },
    { pattern: '{nom} & Fils, Menuiserie' },
    { pattern: 'Atelier Bois {prenom}' },
  ],
  plombier: [
    { pattern: '{prenom} {nom}, Plomberie' },
    { pattern: 'Plomberie {nom}' },
    { pattern: 'SARL {nom} Plomberie-Chauffage' },
  ],
  electricien: [
    { pattern: '{prenom} {nom}, Électricien' },
    { pattern: 'Électricité {nom}' },
    { pattern: 'SARL {nom} Électricité' },
  ],
  peintre: [
    { pattern: 'Peinture {nom}' },
    { pattern: '{prenom} {nom}, Peintre en bâtiment' },
  ],
  paysagiste: [
    { pattern: 'Paysages {nom}' },
    { pattern: '{nom} Espaces Verts' },
    { pattern: 'L\'Atelier des Jardins' },
  ],
  macon: [
    { pattern: 'Maçonnerie {nom}' },
    { pattern: '{nom} & Fils, Maçonnerie' },
  ],
  couvreur: [
    { pattern: 'Couverture {nom}' },
    { pattern: '{prenom} {nom}, Couvreur' },
  ],
  carreleur: [
    { pattern: 'Carrelage {nom}' },
    { pattern: '{prenom} {nom}, Carreleur' },
  ],
  piscinier: [
    { pattern: 'Piscines {nom}' },
    { pattern: '{nom} Piscines & SPA' },
  ],
  photographe: [
    { pattern: '{prenom} {nom}, Photographe' },
    { pattern: 'Studio {prenom}' },
    { pattern: 'Photographe à {ville}' },
  ],
  fleuriste: [
    { pattern: 'Fleurs & Compagnie' },
    { pattern: 'Au Bouquet {adjectif}' },
    { pattern: 'L\'Atelier Floral' },
  ],
  bijoutier: [
    { pattern: 'Bijouterie {nom}' },
    { pattern: 'Joaillerie {nom}' },
  ],
  librairie: [
    { pattern: 'Librairie {nom}' },
    { pattern: 'La Plume {adjectif}' },
  ],
  garagiste: [
    { pattern: 'Garage {nom}' },
    { pattern: '{nom} Automobiles' },
  ],
  gite: [
    { pattern: 'Gîte de {ville}' },
    { pattern: 'Le {adjectif} Gîte' },
    { pattern: 'Maison {nom}' },
  ],
  camping: [
    { pattern: 'Camping {adjectif}' },
    { pattern: 'Camping Les {adjectif}s' },
  ],
}

const DEFAULT_TEMPLATES: readonly NameTemplate[] = [
  { pattern: 'Maison {nom}' },
  { pattern: '{prenom} {nom}' },
  { pattern: 'L\'Atelier {prenom}' },
]

const ADJECTIFS = [
  'Authentique', 'Tradition', 'Gourmand', 'Artisan', 'd\'Antan', 'du Sud',
  'd\'Ici', 'Familial', 'Convivial', 'Chaleureux', 'Doré', 'Joyeux',
] as const

// ─── Fonction principale ───────────────────────────────────────────────

export interface FakeBusiness {
  /** Nom de commerce généré, ex: "Boulangerie Durand". */
  nom_commerce: string
  /** Prénom utilisé dans la génération (réutilisable pour signature). */
  prenom: string
  /** Nom de famille utilisé. */
  nom: string
  /** Adresse complète sans CP/ville, ex: "12 rue du Marché". */
  adresse: string
  /** Code postal de la commune choisie. */
  code_postal: string
  /** Nom de la commune. */
  ville: string
  /**
   * Téléphone fictif au format `05 XX XX XX XX`. Préfixe 05 = Occitanie
   * mais les 8 chiffres suivants sont aléatoires — risque résiduel de
   * tomber sur un vrai numéro, on minimise en choisissant des plages
   * peu attribuées (lignes spéciales 05.5X et 05.7X sont moins denses).
   */
  telephone: string
  /** Email fictif basé sur le slug, ex: `contact@boulangerie-durand.fr`. */
  email: string
  /** Slug stable pour l'URL `/simulations/{slug}` et le path Storage. */
  slug: string
}

/**
 * Génère un commerce fictif déterministe pour une catégorie donnée, à
 * l'aide d'un PRNG seedable.
 */
export function generateFakeBusiness(
  categoryId: ProspectCategorie,
  prng: Prng
): FakeBusiness {
  const prenom = prng.pick(PRENOMS)
  const nom = prng.pick(NOMS)
  const adjectif = prng.pick(ADJECTIFS)
  const commune = prng.pick(COMMUNES_OCCITANIE)

  // Choix du template de nom de commerce
  const templates = NAME_TEMPLATES_BY_CATEGORIE[categoryId] ?? DEFAULT_TEMPLATES
  const template = prng.pick(templates)
  const nom_commerce = template.pattern
    .replace('{prenom}', prenom)
    .replace('{nom}', nom)
    .replace('{adjectif}', adjectif)
    .replace('{ville}', commune.nom)

  // Adresse fictive : n° entre 1 et 80 + rue + commune
  const numero = prng.intBetween(1, 80)
  const rue = prng.pick(RUES)
  const adresse = `${numero} ${rue}`

  // Téléphone : 05.XX.XX.XX.XX — préfixes "55" et "75" (peu attribués)
  const prefixesPeuAttribues = ['55', '57', '75', '77']
  const prefixe = prng.pick(prefixesPeuAttribues)
  const chiffres = `${prng.intBetween(10, 99)} ${prng.intBetween(10, 99)} ${prng.intBetween(10, 99)}`
  const telephone = `05 ${prefixe} ${chiffres}`

  // Slug stable (sans suffixe — la collision se gère côté server action
  // au moment de l'INSERT en BDD, comme pour les maquettes prospects)
  const slug = generateSlugBase(nom_commerce)

  const email = `contact@${slug}.fr`

  return {
    nom_commerce,
    prenom,
    nom,
    adresse,
    code_postal: commune.code_postal,
    ville: commune.nom,
    telephone,
    email,
    slug,
  }
}
