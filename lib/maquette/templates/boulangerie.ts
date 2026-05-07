import type { TemplateConfig } from '../types'

export const boulangerie: TemplateConfig = {
  variant: 'boulangerie',

  palette: {
    cream:        '#F5EFE4',
    creamLight:   '#FAF6EE',
    creamWarm:    '#EBE0CC',
    ink:          '#1A1612',
    inkSoft:      '#4A3F35',
    inkMuted:     '#7A6E60',
    primary:      '#B5512E', // terracotta
    primarySoft:  '#D87454',
    accent:       '#B8893E', // gold
    accentLight:  '#D4A968',
  },

  defaults: {
    heroEyebrow: (city) =>
      city ? `Artisan boulanger · ${city}` : 'Artisan boulanger',
    heroTitle: 'Le pain *fait maison*, au quotidien.',
    heroLead:
      'Pétri, façonné et cuit chaque jour dans notre fournil. Une tradition vivante, des farines locales, du goût avant tout.',
    heroQuote:
      'Le bon pain, c\'est du temps respecté. Du levain, de la patience, et la même envie chaque matin.',
    heroQuoteAuthor: '— Le boulanger',
    histoireTitle: 'Une boulangerie de *quartier*, ouverte à tous.',
    histoireLead:
      'Avec une seule idée en tête : faire du bon pain, simplement.',
    textePresentation:
      'Pas de fioritures. Du levain naturel, des farines de moulins locaux, et le temps qu\'il faut pour que la pâte développe ses arômes. Notre fournil tourne dès l\'aube pour que vous trouviez chaque jour des baguettes croustillantes, des viennoiseries dorées et des pâtisseries soignées.',
    universSectionTitle: 'Du pain, des viennoiseries, et bien *plus encore*.',
    universSectionIntro:
      'Chaque produit est confectionné à la main, dans notre fournil. Découvrez nos cinq univers, à déguster sur place ou à emporter.',
    ctaBannerTitle: 'Une commande, *une question* ?',
    ctaBannerText:
      'Pour toute commande spéciale (gâteau d\'anniversaire, plateau d\'événement, baguettes en grande quantité), un coup de fil suffit.',
    brandTagline: 'Boulangerie · Pâtisserie',
  },

  universItems: [
    { cat: 'Spécialité maison', name: 'Pains au levain',       desc: 'Tradition, complet, multi-céréales, seigle. Cuits sur sole, pour une croûte épaisse et une mie souple.' },
    { cat: 'Du matin',          name: 'Viennoiseries',         desc: 'Croissants, pains au chocolat, brioches. Cuits chaque matin.' },
    { cat: 'Sucré',             name: 'Pâtisseries',           desc: 'Tartes, éclairs, mille-feuilles, opéras. Frais du jour.' },
    { cat: 'Sur commande',      name: 'Gâteaux d\'événement',  desc: 'Anniversaires, mariages, baptêmes. Pièces sur mesure.' },
    { cat: 'Pause salée',       name: 'Snacks & sandwichs',    desc: 'Quiches, pizzas, sandwichs frais. Idéal pour le déjeuner.' },
  ],

  valeursItems: [
    { title: 'Levain naturel',     desc: 'Pétrissage long, fermentation lente.' },
    { title: 'Farines locales',    desc: 'Moulins du Gers, sans additifs.' },
    { title: 'Cuit chaque jour',   desc: 'Du frais, à toute heure.' },
    { title: 'Accueil chaleureux', desc: 'On vous connaît, on vous reconnaît.' },
  ],
}
