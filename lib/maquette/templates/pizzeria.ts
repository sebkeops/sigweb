import type { TemplateConfig } from '../types'

export const pizzeria: TemplateConfig = {
  variant: 'pizzeria',

  palette: {
    cream:        '#F5F1E8',
    creamLight:   '#FAF7EF',
    creamWarm:    '#EAE0CC',
    ink:          '#1A1612',
    inkSoft:      '#4A3F35',
    inkMuted:     '#7A6E60',
    primary:      '#A8302A', // rouge italien
    primarySoft:  '#C84B43',
    accent:       '#8A8C5A', // olive
    accentLight:  '#A6A879',
  },

  defaults: {
    heroEyebrow: (city) =>
      city ? `Pizzeria au feu de bois · ${city}` : 'Pizzeria au feu de bois',
    heroTitle: 'Pizzas *au feu de bois*, à toute heure.',
    heroLead:
      'Pâte fraîche pétrie chaque jour, mozzarella di bufala, tomates de qualité. La vraie tradition italienne, à emporter ou sur place.',
    heroQuote:
      'La pizza, c\'est une question de patience. Une bonne pâte qui repose, un feu qui chauffe, et le geste qui vient avec le temps.',
    heroQuoteAuthor: '— Le pizzaiolo',
    histoireTitle: 'L\'*Italie* à la française.',
    histoireLead:
      'Une cuisine simple, des produits choisis, et le respect de la tradition napolitaine.',
    textePresentation:
      'Notre four à bois chauffe à 450°C. La pâte repose 48h pour développer ses arômes. La mozzarella vient de Campanie, les tomates sont choisies parmi les meilleures variétés italiennes. Pas de raccourcis, juste le vrai goût d\'une pizza faite avec passion.',
    universSectionTitle: 'Des pizzas, des antipasti, et bien *plus encore*.',
    universSectionIntro:
      'Chaque pizza est faite à la main, cuite au feu de bois en 90 secondes. Découvrez nos cinq univers, à déguster sur place, à emporter ou en livraison.',
    ctaBannerTitle: 'Une commande *à emporter* ?',
    ctaBannerText:
      'Pour une pizza, une réservation ou une livraison, un coup de fil et on prépare tout.',
    brandTagline: 'Pizzeria · Cuisine italienne',
  },

  universItems: [
    { cat: 'Spécialité maison', name: 'Nos pizzas signatures', desc: 'La Margherita DOP, la Quatre Fromages, la Diavola... Cuites au feu de bois, fines et croustillantes.' },
    { cat: 'Pour commencer',    name: 'Antipasti',             desc: 'Burrata, jambon de Parme, légumes grillés. À partager.' },
    { cat: 'Sucré',             name: 'Desserts maison',       desc: 'Tiramisu, panna cotta, cannoli siciliens.' },
    { cat: 'Pratique',          name: 'À emporter',            desc: 'Toutes nos pizzas commandables au comptoir, prêtes en 15 min.' },
    { cat: 'Service',           name: 'Livraison',             desc: 'Service de livraison sur la zone, midi et soir.' },
  ],

  valeursItems: [
    { title: 'Pâte fraîche du jour', desc: 'Fermentation 48h, levure naturelle.' },
    { title: 'Four à bois',          desc: 'Cuisson à 450°C en 90 secondes.' },
    { title: 'Mozzarella di bufala', desc: 'Importée de Campanie.' },
    { title: 'Recettes italiennes',  desc: 'Authentiques, sans compromis.' },
  ],
}
