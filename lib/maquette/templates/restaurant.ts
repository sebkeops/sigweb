import type { TemplateConfig } from '../types'

export const restaurant: TemplateConfig = {
  variant: 'restaurant',

  palette: {
    cream:        '#F4EFE5',
    creamLight:   '#FAF6EC',
    creamWarm:    '#E8DECA',
    ink:          '#1A1814',
    inkSoft:      '#3F3D33',
    inkMuted:     '#6E6B5E',
    primary:      '#3D5C3A', // vert profond
    primarySoft:  '#577A55',
    accent:       '#B5904A', // ocre chaud
    accentLight:  '#D0AC6A',
  },

  defaults: {
    heroEyebrow: (city) =>
      city ? `Cuisine de saison · ${city}` : 'Cuisine de saison',
    heroTitle: 'Une cuisine *de saison*, faite ici.',
    heroLead:
      'Des produits frais choisis chaque matin, des recettes simples et soignées, et le plaisir de manger comme à la maison.',
    heroQuote:
      'Bien manger, c\'est d\'abord respecter ce qu\'on a dans l\'assiette. Le produit, le geste, et le temps qu\'il faut.',
    heroQuoteAuthor: '— Le chef',
    histoireTitle: 'Une cuisine *qui a du sens*.',
    histoireLead:
      'Des produits frais, une carte qui change avec les saisons, et l\'envie de bien faire chaque jour.',
    textePresentation:
      'Le marché du matin guide notre carte. Nos producteurs, on les connaît : maraîchers, éleveurs, fromagers, vignerons. Tout vient de la région autant que possible. Les recettes ? Simples, généreuses, soignées — celles qui rassemblent et donnent envie de revenir.',
    universSectionTitle: 'Une carte de saison, et bien *plus encore*.',
    universSectionIntro:
      'Notre cuisine évolue au rythme des produits du moment. Découvrez nos cinq univers, à déguster sur place ou à emporter.',
    ctaBannerTitle: 'Une *réservation* ?',
    ctaBannerText:
      'Pour une table, un événement ou une commande à emporter, un coup de fil et on s\'occupe de tout.',
    brandTagline: 'Restaurant · Cuisine de saison',
  },

  universItems: [
    { cat: 'Spécialité maison', name: 'Notre carte',       desc: 'Une cuisine généreuse qui change au fil des saisons. Entrées, plats du terroir, desserts maison.' },
    { cat: 'Au quotidien',      name: 'Plat du jour',      desc: 'Une suggestion différente chaque jour, à un prix doux pour le midi.' },
    { cat: 'Pratique',          name: 'Menu midi',         desc: 'Formule rapide et complète, idéale pour la pause déjeuner.' },
    { cat: 'Événements',        name: 'Soirées spéciales', desc: 'Repas à thème, soirées dégustation, événements privés.' },
    { cat: 'Service',           name: 'À emporter',        desc: 'Vos plats favoris à emporter, sur commande.' },
  ],

  valeursItems: [
    { title: 'Produits frais',   desc: 'Marché du matin, producteurs locaux.' },
    { title: 'Carte de saison',  desc: 'Ce qui pousse, ce qui se mange.' },
    { title: 'Cuisine ouverte',  desc: 'Du visible, pas de mystère.' },
    { title: 'Accueil familial', desc: 'Comme chez vous, en mieux.' },
  ],
}
