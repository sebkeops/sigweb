import type { TemplateConfig } from '../types'

export const boucherie: TemplateConfig = {
  variant: 'boucherie',

  palette: {
    cream:        '#F4EFE8',
    creamLight:   '#FAF6EF',
    creamWarm:    '#E8DDC9',
    ink:          '#1C1612',
    inkSoft:      '#4A3D33',
    inkMuted:     '#7A6B5E',
    primary:      '#7A1F2B', // bordeaux
    primarySoft:  '#A33D4A',
    accent:       '#B07539', // cuivre
    accentLight:  '#CB9258',
  },

  defaults: {
    heroEyebrow: (city) =>
      city ? `Artisan boucher · ${city}` : 'Artisan boucher',
    heroTitle: 'La viande *de confiance*, au quotidien.',
    heroLead:
      'Producteurs locaux, races sélectionnées, maturation maîtrisée. Du goût et du conseil, à chaque pièce.',
    heroQuote:
      'Une bonne viande, c\'est d\'abord une histoire. Celle d\'un éleveur, d\'un terroir, et d\'un savoir-faire qu\'on transmet.',
    heroQuoteAuthor: '— Le boucher',
    histoireTitle: 'Un *vrai métier*, fait avec soin.',
    histoireLead:
      'Choisir, parer, conseiller. Notre travail commence chez l\'éleveur et finit dans votre cuisine.',
    textePresentation:
      'Nos viandes viennent d\'éleveurs que nous connaissons personnellement. Bœuf, agneau, porc fermier — chaque pièce est sélectionnée, parée et préparée à la main, dans le respect du métier et du goût.',
    universSectionTitle: 'Du bœuf, du porc, et bien *plus encore*.',
    universSectionIntro:
      'Chaque pièce est sélectionnée auprès de nos éleveurs partenaires, parée et préparée à la main.',
    ctaBannerTitle: 'Une commande *spéciale* ?',
    ctaBannerText:
      'Pour un lot BBQ, un plateau de fêtes, une pièce pour un repas familial — passez-nous un coup de fil, on prépare tout sur mesure.',
    brandTagline: 'Boucherie · Charcuterie',
  },

  universItems: [
    { cat: 'Spécialité maison', name: 'Bœuf maturé',         desc: 'Races françaises, maturées 15 à 21 jours sur place. Côtes, faux-filets, entrecôtes — tendreté et goût garantis.' },
    { cat: 'Élevage local',     name: 'Volaille fermière',   desc: 'Poulets, canards, pintades. Plein air, élevage lent.' },
    { cat: 'Préparations',      name: 'Charcuterie maison',  desc: 'Saucisses, terrines, rillettes, pâtés. Recettes familiales.' },
    { cat: 'Sur commande',      name: 'Lots & plateaux',     desc: 'Lots BBQ, plateaux apéro, pièces pour événements.' },
    { cat: 'À emporter',        name: 'Plats préparés',      desc: 'Daubes, blanquettes, lasagnes maison. Prêts à réchauffer.' },
  ],

  valeursItems: [
    { title: 'Producteurs locaux',    desc: 'Éleveurs sélectionnés, terroir de proximité.' },
    { title: 'Préparations maison',   desc: 'Saucisses, terrines, plats du jour.' },
    { title: 'Maturation maîtrisée',  desc: '15 à 21 jours pour les pièces nobles.' },
    { title: 'Conseils du boucher',   desc: 'Cuissons, accompagnements, coupes.' },
  ],
}
