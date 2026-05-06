import type { TemplateConfig } from '../types'

export const restaurant: TemplateConfig = {
  variant: 'restaurant',

  palette: {
    cream:        '#F3EEE5',
    creamLight:   '#FAF6EE',
    creamWarm:    '#E5DBC8',
    ink:          '#1A1A14',
    inkSoft:      '#3D3D2E',
    inkMuted:     '#6F6F5A',
    primary:      '#4A6B4A', // sauge profond
    primarySoft:  '#6B8A6B',
    accent:       '#A87C45', // bois doré
    accentLight:  '#C49C68',
  },

  defaults: {
    heroEyebrow: (city) =>
      city ? `Restaurant · ${city}` : 'Restaurant',
    heroTitle: 'Une cuisine *de saison*, simple et juste.',
    heroLead:
      'Une carte courte, des produits choisis, des assiettes pensées pour vous faire plaisir. À midi, le soir, ou en famille le dimanche.',
    heroQuote:
      'La cuisine, c\'est l\'attention portée à un produit. Un peu de feu, un peu de temps, beaucoup de patience.',
    heroQuoteAuthor: '— Le chef',
    histoireTitle: 'Une *table sincère*, à hauteur de chacun.',
    histoireLead:
      'On sert ce qu\'on aime cuisiner — sans esbroufe, avec ce qu\'on trouve de meilleur autour.',
    textePresentation:
      'Notre carte change avec les saisons. On travaille avec des producteurs et maraîchers du coin, on cuisine à la commande, on garde des prix justes. Que ce soit pour un déjeuner rapide, un dîner détendu ou un repas de famille, vous êtes les bienvenus.',
    universSectionTitle: 'Une carte *courte*, pensée chaque saison.',
    universSectionIntro:
      'Quelques entrées, quelques plats, quelques desserts. Tout ce qu\'il faut, rien de superflu.',
    ctaBannerTitle: 'Réserver une *table* ?',
    ctaBannerText:
      'Pour un repas en semaine, un dîner du week-end ou un événement familial — passez-nous un coup de fil, on garde la table.',
    brandTagline: 'Restaurant · Cuisine de saison',
  },

  universItems: [
    { cat: 'Le midi',           name: 'Menu du jour',       desc: 'Entrée, plat, dessert. Au tableau chaque matin, selon le marché.' },
    { cat: 'À la carte',        name: 'Plats de saison',    desc: 'Une dizaine de plats, renouvelés au fil des saisons.' },
    { cat: 'Pour partager',     name: 'Tables conviviales', desc: 'Plats à partager pour 2, 4 ou plus. Idéal le week-end.' },
    { cat: 'Sucré',             name: 'Desserts maison',    desc: 'Pâtisseries faites sur place. Tarte du jour, glaces artisanales.' },
    { cat: 'Sur commande',      name: 'Repas privés',       desc: 'Anniversaires, baptêmes, repas de famille. Devis sur demande.' },
  ],

  valeursItems: [
    { title: 'Produits du marché',    desc: 'Maraîchers et producteurs locaux.' },
    { title: 'Carte de saison',       desc: 'Renouvelée plusieurs fois par an.' },
    { title: 'Cuisiné à la commande', desc: 'Tout est préparé sur place.' },
    { title: 'Accueil familial',      desc: 'Une table où on prend le temps.' },
  ],
}
