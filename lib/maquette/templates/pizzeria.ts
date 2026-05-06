import type { TemplateConfig } from '../types'

export const pizzeria: TemplateConfig = {
  variant: 'pizzeria',

  palette: {
    cream:        '#F5EFE4',
    creamLight:   '#FAF6EE',
    creamWarm:    '#ECDFC9',
    ink:          '#1C1812',
    inkSoft:      '#4A3F33',
    inkMuted:     '#7A6E5E',
    primary:      '#B83C2A', // tomate mate
    primarySoft:  '#D4634F',
    accent:       '#7B8C4F', // vert olive
    accentLight:  '#A2B373',
  },

  defaults: {
    heroEyebrow: (city) =>
      city ? `Pizzeria artisanale · ${city}` : 'Pizzeria artisanale',
    heroTitle: 'La pizza *au feu de bois*, comme là-bas.',
    heroLead:
      'Pâte fermentée 48 heures, mozzarella di bufala, tomates San Marzano. Cuite au feu de bois, servie sans chichis.',
    heroQuote:
      'Une bonne pizza, c\'est une pâte qui a pris son temps. Tout le reste suit.',
    heroQuoteAuthor: '— Le pizzaiolo',
    histoireTitle: 'Une *vraie pizzeria*, à la napolitaine.',
    histoireLead:
      'Une pâte qui repose, un four bien chaud, des produits choisis. Rien de plus, rien de moins.',
    textePresentation:
      'On travaille la pâte chaque matin, on la laisse fermenter 48 heures pour qu\'elle soit légère et digeste. Le four monte à 450°C, la pizza cuit en 90 secondes. Mozzarella, tomates, huile d\'olive — on choisit chaque produit avec soin, et on garde la carte courte.',
    universSectionTitle: 'Pizzas, antipasti, et bien *plus encore*.',
    universSectionIntro:
      'Une carte courte, des classiques bien faits, quelques pizzas signature.',
    ctaBannerTitle: 'À emporter, *à table* ?',
    ctaBannerText:
      'Sur place ou à emporter — un coup de fil suffit pour réserver une pizza ou une table. On vous attend.',
    brandTagline: 'Pizzeria · Cuisine italienne',
  },

  universItems: [
    { cat: 'Classiques',        name: 'Pizzas tradition',     desc: 'Margherita, Reine, Quatre Saisons, Calzone. Les incontournables.' },
    { cat: 'Spécialités maison', name: 'Pizzas signature',    desc: 'Recettes de la maison, créées avec nos producteurs.' },
    { cat: 'Pour commencer',    name: 'Antipasti',             desc: 'Bruschettas, charcuteries italiennes, burrata. À partager.' },
    { cat: 'Sucré',             name: 'Desserts italiens',    desc: 'Tiramisu, panna cotta, gelati. Faits maison.' },
    { cat: 'Sur commande',      name: 'Soirées & événements', desc: 'Anniversaires, repas d\'équipe, soirées privées.' },
  ],

  valeursItems: [
    { title: 'Pâte 48 heures',      desc: 'Fermentation lente, légère et digeste.' },
    { title: 'Cuisson au feu de bois', desc: 'Four à 450°C, pizza prête en 90 secondes.' },
    { title: 'Produits choisis',    desc: 'Mozzarella, tomates et huile d\'olive sélectionnées.' },
    { title: 'Sur place ou à emporter', desc: 'Comme vous voulez, quand vous voulez.' },
  ],
}
