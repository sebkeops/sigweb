/**
 * Presets métier — source de vérité pour les variations sectorielles
 * appliquées aux maquettes générées.
 *
 * Un preset capture ce qui *varie* d'un métier à l'autre dans la maquette :
 *   - palette (primary + accent, plus un fond crème dérivé)
 *   - 4 atouts (titre + sous-titre)
 *   - 3 champs de la section "Nos créations" (suptitle / titre / paragraphe)
 *   - brandTagline (sous-titre du nom dans header + footer)
 *   - lexique global (6 libellés transverses : nav, hero CTA, suptitle
 *     Histoire, titre Avis, label colonne Footer)
 *
 * Le système couvre désormais l'ensemble des contenus textuels résiduels
 * qui sont conditionnés par catégorie. Les éléments restés hardcodés
 * (labels Adresse/Téléphone/Email/Horaires, mention "Maquette de
 * démonstration · Sigweb", aria-labels mobile) sont génériques par
 * nature et ne dépendent pas du métier.
 *
 * ⚠️ Zéro régression sur Famille 2 : pour `boulangerie`, `boucherie`,
 * `restaurant` et `pizzeria`, les valeurs sont strictement identiques à
 * celles précédemment hardcodées dans les composants ou templates. Toute
 * évolution de ces 4 presets impacte directement le rendu des maquettes
 * Famille 2 existantes.
 *
 * Le champ `icon` des atouts reste documentaire en V1 : le rendu utilise
 * un cycle unicode décoratif (◐◑◒◓) appliqué par position dans le
 * composant `Histoire.tsx`. Les noms Lucide sont conservés pour anticiper
 * une éventuelle migration ultérieure vers un système d'icônes par atout.
 */

import type { MaquetteUniversItem, ProspectCategorie } from '@/types'
import type { TemplatePalette } from '../types'

/** Trois couleurs hex #RRGGBB d'un preset métier. */
export interface PresetCouleurs {
  /** Couleur principale : titres, accents forts. */
  primary: string
  /** Couleur secondaire : partie italique des titres, éléments décoratifs. */
  accent: string
  /** Fond crème/neutre clair dérivé du preset. */
  background: string
}

/** Un atout (sous le Hero) : icône Lucide (documentaire), titre, sous-titre. */
export interface PresetAtout {
  /** Nom Lucide — non rendu en V1, conservé pour future migration icônes. */
  icon: string
  /** 2 à 4 mots, ex: "Levain naturel". */
  titre: string
  /** 4 à 7 mots, ex: "Pétrissage long, fermentation lente.". */
  sousTitre: string
}

/** Les 3 champs de la section "Nos créations". */
export interface PresetNosCreations {
  /** Texte court (souvent en capitales), ex: "Nos créations". */
  suptitle: string
  /**
   * Titre principal. Syntaxe markdown italique `*mot*` pour la partie
   * mise en valeur (rendu via `parseItalicMarkers`).
   */
  titrePrincipal: string
  /** Paragraphe descriptif court (1-2 phrases). */
  paragraphe: string
}

/**
 * Lexique global — 6 libellés transverses conditionnés par catégorie.
 *
 * Champs volontairement distincts même quand ils portent la même valeur
 * sémantique (ex : "La maison" pour Famille 2 sur `navHistoireLabel`,
 * `histoireSuptitle` et `footerColonneLabel`) : ça laisse la marge à un
 * commerçant de différencier ces emplacements via l'éditeur sans devoir
 * faire un refacto du type.
 */
export interface LexiquePreset {
  /** Header + Footer nav, lien #histoire. Ex: "La maison", "Le cabinet". */
  navHistoireLabel: string
  /** Header + Footer nav, lien #univers. Ex: "Nos créations", "Nos prestations". */
  navUniversLabel: string
  /** Bouton Hero primaire. Ex: "Voir nos créations →", "Découvrir le cabinet →". */
  heroCtaPrimaire: string
  /** Suptitle de la section Histoire. Ex: "La maison", "L'atelier". */
  histoireSuptitle: string
  /**
   * Titre de la section Avis. Syntaxe markdown italique `*mot*` pour la
   * partie en couleur (cohérent avec `nosCreations.titrePrincipal`).
   */
  avisSectionTitre: string
  /** H4 colonne Footer. Ex: "Le commerce", "L'entreprise". */
  footerColonneLabel: string
}

/**
 * Défauts narratifs Hero / Histoire / CTA + 5 cartes Univers.
 *
 * Tous les champs sont éditables côté admin (cf. EDITABLE_FIELDS). Ces
 * valeurs sont uniquement les valeurs **initiales** injectées à la
 * génération d'une maquette pour un prospect de cette catégorie.
 *
 * Conventions :
 *   - markdown italique `*mot*` autorisé sur `heroTitle`, `histoireTitle`,
 *     `ctaBannerTitle` (rendu via `parseItalicMarkers`).
 *   - `heroEyebrowQualifier` ne contient que le qualificatif (ex: "Artisan
 *     boulanger") ; la composition `${qualifier} · ${ville}` ou
 *     `${qualifier}` seul est calculée par la factory `buildTemplate`.
 */
export interface PresetDefaults {
  /** Qualificatif du suptitle Hero, sans ville. Ex: "Artisan boulanger". */
  heroEyebrowQualifier: string
  heroTitle: string
  heroLead: string
  heroQuote: string
  heroQuoteAuthor: string
  histoireTitle: string
  histoireLead: string
  textePresentation: string
  ctaBannerTitle: string
  ctaBannerText: string
  /** Exactement 5 cartes "Nos créations". */
  universItems: readonly [
    MaquetteUniversItem, MaquetteUniversItem, MaquetteUniversItem,
    MaquetteUniversItem, MaquetteUniversItem,
  ]
}

/**
 * Surcharges de palette historiques — utilisées pour les 4 templates Famille 2
 * afin de préserver les neutres (cream/ink/etc.) exacts d'avant le refacto
 * (garantie zéro régression visuelle). Pour les autres catégories, ces
 * neutres sont dérivés algorithmiquement par la factory.
 */
export interface PresetPaletteOverrides {
  palette?: Partial<Omit<TemplatePalette, 'primary' | 'accent'>>
  /** Override de `primarySoft`. Sinon dérivé par `lighten(primary, 0.25)`. */
  primarySoft?: string
  /** Override de `accentLight`. Sinon dérivé par `lighten(accent, 0.25)`. */
  accentLight?: string
}

/** Un preset métier complet. */
export interface MetierPreset {
  /** Slug du métier, aligné sur `ProspectCategorie`. */
  id: ProspectCategorie
  /** Label affiché (debug / admin). */
  nom: string
  couleurs: PresetCouleurs
  /** Exactement 4 atouts. */
  atouts: readonly [PresetAtout, PresetAtout, PresetAtout, PresetAtout]
  nosCreations: PresetNosCreations
  /**
   * Sous-titre affiché sous le nom du commerce dans le header + footer.
   * Convention V1 : pattern `Métier · Spécialité`, casse normale (le CSS
   * applique `text-transform: uppercase` au rendu).
   */
  brandTagline: string
  lexique: LexiquePreset
  defaults: PresetDefaults
  /**
   * Présent uniquement pour les 4 presets Famille 2 (boulangerie, boucherie,
   * restaurant, pizzeria) pour préserver les neutres de palette historiques.
   */
  paletteOverrides?: PresetPaletteOverrides
}

// L'ancienne constante `NEUTRAL_DEFAULTS` (placeholder mutualisé pour les
// V1 non-F2 et les stubs V2 en attente d'annexe) a été retirée — toutes
// les annexes A → F ont été intégrées et chaque preset porte désormais ses
// valeurs spécifiques. Le preset `autre` (fallback) reste lui-même un
// preset complet avec ses propres `defaults`, plus génériques mais conçus
// comme tels (cf. Annexe F).

// ──────────────────────────────────────────────────────────────────────────
// FAMILLE 2 (commerces de bouche) — valeurs alignées à l'identique sur les
// 4 templates historiques. NE PAS MODIFIER sans relecture régression.
// ──────────────────────────────────────────────────────────────────────────

const FAMILLE_2_LEXIQUE: LexiquePreset = {
  navHistoireLabel: 'La maison',
  navUniversLabel: 'Nos créations',
  heroCtaPrimaire: 'Voir nos créations →',
  histoireSuptitle: 'La maison',
  avisSectionTitre: 'Ce qu\'en pensent nos *habitués*.',
  footerColonneLabel: 'Le commerce',
}

const boulangerie: MetierPreset = {
  id: 'boulangerie',
  nom: 'Boulangerie',
  couleurs: {
    primary: '#B5512E',
    accent: '#B8893E',
    background: '#F5EFE4',
  },
  atouts: [
    { icon: 'wheat',          titre: 'Levain naturel',     sousTitre: 'Pétrissage long, fermentation lente.' },
    { icon: 'leaf',           titre: 'Farines locales',    sousTitre: 'Moulins du Gers, sans additifs.' },
    { icon: 'sun',            titre: 'Cuit chaque jour',   sousTitre: 'Du frais, à toute heure.' },
    { icon: 'smile',          titre: 'Accueil chaleureux', sousTitre: 'On vous connaît, on vous reconnaît.' },
  ],
  nosCreations: {
    suptitle: 'Nos créations',
    titrePrincipal: 'Du pain, des viennoiseries, et bien *plus encore*.',
    paragraphe:
      'Chaque produit est confectionné à la main, dans notre fournil. Découvrez nos cinq univers, à déguster sur place ou à emporter.',
  },
  brandTagline: 'Boulangerie · Pâtisserie',
  lexique: FAMILLE_2_LEXIQUE,
  defaults: {
    heroEyebrowQualifier: 'Artisan boulanger',
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
    ctaBannerTitle: 'Une commande, *une question* ?',
    ctaBannerText:
      'Pour toute commande spéciale (gâteau d\'anniversaire, plateau d\'événement, baguettes en grande quantité), un coup de fil suffit.',
    universItems: [
      { cat: 'Spécialité maison', name: 'Pains au levain',       desc: 'Tradition, complet, multi-céréales, seigle. Cuits sur sole, pour une croûte épaisse et une mie souple.' },
      { cat: 'Du matin',          name: 'Viennoiseries',         desc: 'Croissants, pains au chocolat, brioches. Cuits chaque matin.' },
      { cat: 'Sucré',             name: 'Pâtisseries',           desc: 'Tartes, éclairs, mille-feuilles, opéras. Frais du jour.' },
      { cat: 'Sur commande',      name: 'Gâteaux d\'événement',  desc: 'Anniversaires, mariages, baptêmes. Pièces sur mesure.' },
      { cat: 'Pause salée',       name: 'Snacks & sandwichs',    desc: 'Quiches, pizzas, sandwichs frais. Idéal pour le déjeuner.' },
    ],
  },
  paletteOverrides: {
    palette: {
      cream: '#F5EFE4', creamLight: '#FAF6EE', creamWarm: '#EBE0CC',
      ink: '#1A1612', inkSoft: '#4A3F35', inkMuted: '#7A6E60',
    },
    primarySoft: '#D87454',
    accentLight: '#D4A968',
  },
}

const boucherie: MetierPreset = {
  id: 'boucherie',
  nom: 'Boucherie',
  couleurs: {
    primary: '#7A1F2B',
    accent: '#B07539',
    background: '#F4EFE8',
  },
  atouts: [
    { icon: 'shield-check',   titre: 'Producteurs locaux',   sousTitre: 'Éleveurs sélectionnés, terroir du Gers.' },
    { icon: 'chef-hat',       titre: 'Préparations maison',  sousTitre: 'Saucisses, terrines, plats du jour.' },
    { icon: 'clock',          titre: 'Maturation maîtrisée', sousTitre: '15 à 21 jours pour les pièces nobles.' },
    { icon: 'message-circle', titre: 'Conseils du boucher',  sousTitre: 'Cuissons, accompagnements, coupes.' },
  ],
  nosCreations: {
    suptitle: 'Nos créations',
    titrePrincipal: 'Du bœuf, du porc, et bien *plus encore*.',
    paragraphe:
      'Chaque pièce est sélectionnée auprès de nos éleveurs partenaires, parée et préparée à la main dans notre laboratoire.',
  },
  brandTagline: 'Boucherie · Charcuterie',
  lexique: FAMILLE_2_LEXIQUE,
  defaults: {
    heroEyebrowQualifier: 'Artisan boucher',
    heroTitle: 'La viande *de confiance*, depuis toujours.',
    heroLead:
      'Producteurs locaux, races sélectionnées, maturation maîtrisée. Un savoir-faire au service du goût et du conseil.',
    heroQuote:
      'Une bonne viande, c\'est d\'abord une histoire. Celle d\'un éleveur, d\'un terroir, et d\'un savoir-faire qu\'on transmet.',
    heroQuoteAuthor: '— Le boucher',
    histoireTitle: 'Un *vrai métier*, des vrais conseils.',
    histoireLead:
      'Chaque pièce est sélectionnée, parée et préparée à la main, dans le respect du métier et du goût.',
    textePresentation:
      'Nos viandes viennent d\'éleveurs que nous connaissons personnellement, dans un rayon proche de la boucherie. Bœuf de race noble, agneau du terroir, porc fermier. La maturation, le détail, le conseil au comptoir : c\'est tout ça qui fait la différence à la fin dans votre assiette.',
    ctaBannerTitle: 'Une commande *spéciale* ?',
    ctaBannerText:
      'Pour un lot BBQ, un plateau de fêtes, une pièce pour un repas familial — passez-nous un coup de fil, on prépare tout sur mesure.',
    universItems: [
      { cat: 'Spécialité maison', name: 'Bœuf maturé',         desc: 'Blonde d\'Aquitaine et Limousine, maturées 15 à 21 jours sur place. Côtes, faux-filets, entrecôtes — tendreté et goût garantis.' },
      { cat: 'Élevage local',     name: 'Volaille fermière',   desc: 'Poulets, canards, pintades du Gers. Plein air, élevage lent.' },
      { cat: 'Préparations',      name: 'Charcuterie maison',  desc: 'Saucisses, terrines, rillettes, pâtés. Recettes familiales.' },
      { cat: 'Sur commande',      name: 'Lots & plateaux',     desc: 'Lots BBQ, plateaux apéro, pièces pour événements.' },
      { cat: 'À emporter',        name: 'Plats préparés',      desc: 'Daubes, blanquettes, lasagnes maison. Prêts à réchauffer.' },
    ],
  },
  paletteOverrides: {
    palette: {
      cream: '#F4EFE8', creamLight: '#FAF6EF', creamWarm: '#E8DDC9',
      ink: '#1C1612', inkSoft: '#4A3D33', inkMuted: '#7A6B5E',
    },
    primarySoft: '#A33D4A',
    accentLight: '#CB9258',
  },
}

const restaurant: MetierPreset = {
  id: 'restaurant',
  nom: 'Restaurant',
  couleurs: {
    primary: '#3D5C3A',
    accent: '#B5904A',
    background: '#F4EFE5',
  },
  atouts: [
    { icon: 'leaf',           titre: 'Produits frais',   sousTitre: 'Marché du matin, producteurs locaux.' },
    { icon: 'calendar',       titre: 'Carte de saison',  sousTitre: 'Ce qui pousse, ce qui se mange.' },
    { icon: 'chef-hat',       titre: 'Cuisine ouverte',  sousTitre: 'Du visible, pas de mystère.' },
    { icon: 'heart',          titre: 'Accueil familial', sousTitre: 'Comme chez vous, en mieux.' },
  ],
  nosCreations: {
    suptitle: 'Nos créations',
    titrePrincipal: 'Une carte de saison, et bien *plus encore*.',
    paragraphe:
      'Notre cuisine évolue au rythme des produits du moment. Découvrez nos cinq univers, à déguster sur place ou à emporter.',
  },
  brandTagline: 'Restaurant · Cuisine de saison',
  lexique: FAMILLE_2_LEXIQUE,
  defaults: {
    heroEyebrowQualifier: 'Cuisine de saison',
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
    ctaBannerTitle: 'Une *réservation* ?',
    ctaBannerText:
      'Pour une table, un événement ou une commande à emporter, un coup de fil et on s\'occupe de tout.',
    universItems: [
      { cat: 'Spécialité maison', name: 'Notre carte',       desc: 'Une cuisine généreuse qui change au fil des saisons. Entrées, plats du terroir, desserts maison.' },
      { cat: 'Au quotidien',      name: 'Plat du jour',      desc: 'Une suggestion différente chaque jour, à un prix doux pour le midi.' },
      { cat: 'Pratique',          name: 'Menu midi',         desc: 'Formule rapide et complète, idéale pour la pause déjeuner.' },
      { cat: 'Événements',        name: 'Soirées spéciales', desc: 'Repas à thème, soirées dégustation, événements privés.' },
      { cat: 'Service',           name: 'À emporter',        desc: 'Vos plats favoris à emporter, sur commande.' },
    ],
  },
  paletteOverrides: {
    palette: {
      cream: '#F4EFE5', creamLight: '#FAF6EC', creamWarm: '#E8DECA',
      ink: '#1A1814', inkSoft: '#3F3D33', inkMuted: '#6E6B5E',
    },
    primarySoft: '#577A55',
    accentLight: '#D0AC6A',
  },
}

const pizzeria: MetierPreset = {
  id: 'pizzeria',
  nom: 'Pizzeria',
  couleurs: {
    primary: '#A8302A',
    accent: '#8A8C5A',
    background: '#F5F1E8',
  },
  atouts: [
    { icon: 'circle',         titre: 'Pâte fraîche du jour', sousTitre: 'Fermentation 48h, levure naturelle.' },
    { icon: 'flame',          titre: 'Four à bois',          sousTitre: 'Cuisson à 450°C en 90 secondes.' },
    { icon: 'leaf',           titre: 'Mozzarella di bufala', sousTitre: 'Importée de Campanie.' },
    { icon: 'utensils',       titre: 'Recettes italiennes',  sousTitre: 'Authentiques, sans compromis.' },
  ],
  nosCreations: {
    suptitle: 'Nos créations',
    titrePrincipal: 'Des pizzas, des antipasti, et bien *plus encore*.',
    paragraphe:
      'Chaque pizza est faite à la main, cuite au feu de bois en 90 secondes. Découvrez nos cinq univers, à déguster sur place, à emporter ou en livraison.',
  },
  brandTagline: 'Pizzeria · Cuisine italienne',
  lexique: FAMILLE_2_LEXIQUE,
  defaults: {
    heroEyebrowQualifier: 'Pizzeria au feu de bois',
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
    ctaBannerTitle: 'Une commande *à emporter* ?',
    ctaBannerText:
      'Pour une pizza, une réservation ou une livraison, un coup de fil et on prépare tout.',
    universItems: [
      { cat: 'Spécialité maison', name: 'Nos pizzas signatures', desc: 'La Margherita DOP, la Quatre Fromages, la Diavola... Cuites au feu de bois, fines et croustillantes.' },
      { cat: 'Pour commencer',    name: 'Antipasti',             desc: 'Burrata, jambon de Parme, légumes grillés. À partager.' },
      { cat: 'Sucré',             name: 'Desserts maison',       desc: 'Tiramisu, panna cotta, cannoli siciliens.' },
      { cat: 'Pratique',          name: 'À emporter',            desc: 'Toutes nos pizzas commandables au comptoir, prêtes en 15 min.' },
      { cat: 'Service',           name: 'Livraison',             desc: 'Service de livraison sur la zone, midi et soir.' },
    ],
  },
  paletteOverrides: {
    palette: {
      cream: '#F5F1E8', creamLight: '#FAF7EF', creamWarm: '#EAE0CC',
      ink: '#1A1612', inkSoft: '#4A3F35', inkMuted: '#7A6E60',
    },
    primarySoft: '#C84B43',
    accentLight: '#A6A879',
  },
}

// ──────────────────────────────────────────────────────────────────────────
// 14 NOUVEAUX PRESETS — lexique + brandTagline issus du brief Session
// "Extension presets métier : lexique global". Source de vérité ici.
// ──────────────────────────────────────────────────────────────────────────

const primeur: MetierPreset = {
  id: 'primeur',
  nom: 'Primeur',
  couleurs: {
    primary: '#3A6B3F',
    accent: '#E8893E',
    background: '#F7F5EE',
  },
  atouts: [
    { icon: 'truck',     titre: 'Arrivages quotidiens',         sousTitre: 'Le meilleur de la saison, chaque jour.' },
    { icon: 'map-pin',   titre: 'Producteurs locaux',           sousTitre: 'Circuits courts, prix justes.' },
    { icon: 'apple',     titre: 'Fruits et légumes de caractère', sousTitre: 'Variétés anciennes et oubliées.' },
    { icon: 'book-open', titre: 'Conseil cuisine',              sousTitre: 'Astuces et idées pour cuisiner de saison.' },
  ],
  nosCreations: {
    suptitle: 'NOS PRODUITS',
    titrePrincipal: 'Le meilleur de la saison, *jour après jour*.',
    paragraphe:
      'Fruits et légumes choisis chaque matin, producteurs locaux mis à l\'honneur. Venez découvrir ce que la saison nous réserve.',
  },
  brandTagline: 'Primeur · Fruits & légumes',
  lexique: {
    navHistoireLabel: 'La maison',
    navUniversLabel: 'Nos produits',
    heroCtaPrimaire: 'Voir nos produits →',
    histoireSuptitle: 'La maison',
    avisSectionTitre: 'Ce qu\'en pensent nos *fidèles*.',
    footerColonneLabel: 'Le commerce',
  },
  defaults: {
    heroEyebrowQualifier: 'Primeur',
    heroTitle: 'Des fruits et légumes *de saison*, chaque jour.',
    heroLead:
      'Arrivages quotidiens, producteurs locaux, variétés choisies. Le meilleur de ce que la saison nous offre, sans détour.',
    heroQuote:
      'Un bon fruit, ça ne triche pas. C\'est le sol, le soleil, le moment de la cueillette. Tout le reste, ce sont des artifices.',
    heroQuoteAuthor: '— Le primeur',
    histoireTitle: 'Un *primeur* de quartier, à l\'ancienne.',
    histoireLead:
      'Producteurs choisis, étal renouvelé chaque jour, et le plaisir des vraies saveurs.',
    textePresentation:
      'On fait le tour des producteurs au plus près, on choisit ce qui est mûr, on rejette ce qui ne l\'est pas. Fruits, légumes, herbes fraîches, parfois œufs et fromages : tout passe par notre étal pour que vous trouviez les bons goûts au bon moment. Demandez conseil — on aime parler de ce qu\'on vend.',
    ctaBannerTitle: 'Une commande *spéciale* ?',
    ctaBannerText:
      'Pour un panier sur mesure, des cagettes pour un événement ou des produits précis, passez nous voir ou appelez.',
    universItems: [
      { cat: 'Le cœur du métier',  name: 'Fruits & légumes de saison', desc: 'Étal renouvelé chaque matin selon les arrivages. Variétés anciennes mises à l\'honneur quand c\'est possible.' },
      { cat: 'Producteurs',        name: 'Circuits courts',            desc: 'Maraîchers et arboriculteurs locaux privilégiés. Origine affichée, traçabilité claire.' },
      { cat: 'Plus que des légumes', name: 'Épicerie complémentaire',  desc: 'Œufs frais, fromages, herbes, parfois miel ou huiles — selon les producteurs du coin.' },
      { cat: 'Sur commande',       name: 'Paniers & événements',       desc: 'Paniers garnis, cagettes pour réceptions, fruits exotiques sur demande. Délai sous 48h.' },
      { cat: 'Pratique',           name: 'Conseils cuisine',           desc: 'Comment cuisiner ce nouveau légume ? Demandez — on a toujours une idée à partager.' },
    ],
  },
}

const fromager: MetierPreset = {
  id: 'fromager',
  nom: 'Fromager',
  couleurs: {
    primary: '#B8861B',
    accent: '#6B4423',
    background: '#FBF7EC',
  },
  atouts: [
    { icon: 'clock',        titre: 'Affinage maison',     sousTitre: 'Le temps fait la richesse des saveurs.' },
    { icon: 'shield-check', titre: 'Producteurs fermiers', sousTitre: 'Sélection rigoureuse, traçabilité totale.' },
    { icon: 'layout-grid',  titre: 'Plateaux sur mesure', sousTitre: 'Composés selon vos envies et budgets.' },
    { icon: 'wine',         titre: 'Conseil dégustation', sousTitre: 'Accords vins, ordres de dégustation.' },
  ],
  nosCreations: {
    suptitle: 'NOS FROMAGES',
    titrePrincipal: 'Des artisans, des terroirs, *une passion partagée*.',
    paragraphe:
      'Sélection au plus près des producteurs, affinage maison, conseil dégustation. Pour redécouvrir ce qu\'un vrai fromage peut être.',
  },
  // Harmonisation pattern "Métier · Spécialité" (remplace "Fromages d'artisans"
  // de la session précédente). Décision du brief Session "Extension lexique".
  brandTagline: 'Fromager · Affineur',
  lexique: {
    navHistoireLabel: 'La maison',
    navUniversLabel: 'Nos fromages',
    heroCtaPrimaire: 'Voir nos fromages →',
    histoireSuptitle: 'La maison',
    avisSectionTitre: 'Ce qu\'en pensent nos *fidèles*.',
    footerColonneLabel: 'Le commerce',
  },
  defaults: {
    heroEyebrowQualifier: 'Fromager',
    heroTitle: 'Des fromages *choisis*, affinés avec soin.',
    heroLead:
      'Sélection chez les producteurs fermiers, affinage maison, conseil dégustation. Pour redécouvrir ce qu\'un vrai fromage peut être.',
    heroQuote:
      'Un fromage, ça raconte un terroir, un éleveur, une saison. Notre métier, c\'est de transmettre ce qu\'il a à dire.',
    heroQuoteAuthor: '— Le fromager',
    histoireTitle: 'Une *maison* qui prend le temps.',
    histoireLead:
      'Des producteurs visités, des fromages affinés sur place, et le plaisir de bien conseiller.',
    textePresentation:
      'On parcourt les fermes, on goûte, on choisit. Les fromages arrivent jeunes, on les laisse mûrir dans nos caves d\'affinage jusqu\'à leur juste maturité. Au comptoir, on déguste avec vous, on raconte d\'où vient chaque pièce, et on compose le plateau qui ira avec votre repas ou votre soirée.',
    ctaBannerTitle: 'Un *plateau* pour une occasion ?',
    ctaBannerText:
      'Pour un plateau sur mesure, une dégustation à thème ou un fromage précis, un coup de fil et on prépare tout.',
    universItems: [
      { cat: 'Spécialité maison', name: 'Fromages affinés sur place', desc: 'Caves d\'affinage maison, fromages amenés à juste maturité. Pâtes pressées, molles, persillées, chèvres.' },
      { cat: 'Producteurs',      name: 'Fromages fermiers',          desc: 'Sélection chez les producteurs visités, traçabilité totale. Saisons et productions limitées mises en avant.' },
      { cat: 'Sur mesure',       name: 'Plateaux de fromages',       desc: 'Composition selon le nombre de convives, le budget et le moment du repas. Conseil dégustation inclus.' },
      { cat: 'Accords',          name: 'Vins & accompagnements',     desc: 'Pains spéciaux, confitures, miels et quelques vins choisis pour accompagner les fromages.' },
      { cat: 'Pratique',         name: 'Conseil & dégustation',      desc: 'On déguste avec vous au comptoir, on explique les origines, on suggère les accords. C\'est le métier.' },
    ],
  },
}

const caviste: MetierPreset = {
  id: 'caviste',
  nom: 'Caviste',
  couleurs: {
    primary: '#5C1F2E',
    accent: '#B89968',
    background: '#F5F0E8',
  },
  atouts: [
    { icon: 'wine',           titre: 'Sélection passionnée',  sousTitre: 'Vins choisis chez les vignerons.' },
    { icon: 'message-circle', titre: 'Conseil sur mesure',    sousTitre: 'Selon vos goûts, vos occasions, votre budget.' },
    { icon: 'sparkles',       titre: 'Découvertes régulières', sousTitre: 'Nouveautés et pépites mises en avant.' },
    { icon: 'users',          titre: 'Dégustations',          sousTitre: 'Rendez-vous gourmands toute l\'année.' },
  ],
  nosCreations: {
    suptitle: 'NOTRE CAVE',
    titrePrincipal: 'Des vignerons rencontrés, *des vins qui racontent*.',
    paragraphe:
      'Sélection issue de visites en domaine, accent mis sur les vignerons engagés. Découvertes accessibles ou belles bouteilles pour les grandes occasions.',
  },
  brandTagline: 'Caviste · Vins & spiritueux',
  lexique: {
    navHistoireLabel: 'La cave',
    navUniversLabel: 'Notre cave',
    heroCtaPrimaire: 'Voir notre cave →',
    histoireSuptitle: 'La cave',
    avisSectionTitre: 'Ce qu\'en pensent nos *amateurs*.',
    footerColonneLabel: 'La cave',
  },
  defaults: {
    heroEyebrowQualifier: 'Caviste',
    heroTitle: 'Des vignerons rencontrés, *des vins qui racontent*.',
    heroLead:
      'Sélection issue de visites en domaine, accent sur les vignerons engagés. Pour les découvertes du quotidien comme pour les grandes occasions.',
    heroQuote:
      'Un vin, c\'est un vigneron, un terroir, un millésime. Notre boulot, c\'est de raconter cette histoire au moment de la dégustation.',
    heroQuoteAuthor: '— Le caviste',
    histoireTitle: 'Une *cave* à hauteur d\'amateur.',
    histoireLead:
      'Des vignerons connus, des sélections honnêtes, et le plaisir de partager une bouteille.',
    textePresentation:
      'On va dans les domaines, on goûte avec les vignerons, on choisit. La cave couvre toutes les régions de France et quelques pépites étrangères, avec une préférence assumée pour les vignerons engagés, en bio ou en biodynamie. Au comptoir, on conseille selon votre repas, votre budget ou simplement votre envie de découvrir.',
    ctaBannerTitle: 'Une *occasion* à fêter ?',
    ctaBannerText:
      'Pour un anniversaire, un cadeau, une cave à constituer ou un événement, un coup de fil et on prépare la sélection.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Notre sélection',         desc: 'Vins rouges, blancs, rosés et effervescents. Régions françaises principales et quelques découvertes étrangères.' },
      { cat: 'Engagement',        name: 'Vignerons engagés',       desc: 'Bio, biodynamie, vignerons en conversion : section dédiée aux producteurs qui font sens.' },
      { cat: 'Découvertes',       name: 'Nouveautés du mois',      desc: 'Pépites repérées récemment, petits domaines, millésimes à goûter. Renouvellement régulier.' },
      { cat: 'Plus que du vin',   name: 'Spiritueux & bières',     desc: 'Whiskies, rhums, gins choisis avec la même exigence. Quelques bières artisanales locales.' },
      { cat: 'Pratique',          name: 'Conseils & dégustations', desc: 'Conseil au comptoir, soirées dégustation thématiques, possibilité de mise sous cave.' },
    ],
  },
}

const coiffeur: MetierPreset = {
  id: 'coiffeur',
  nom: 'Coiffeur',
  couleurs: {
    primary: '#1F1F1F',
    accent: '#D4A5A5',
    background: '#FAF6F4',
  },
  atouts: [
    { icon: 'scissors',       titre: 'Coupes personnalisées', sousTitre: 'Adaptées à votre style et votre visage.' },
    { icon: 'droplet',        titre: 'Produits soignés',       sousTitre: 'Marques professionnelles, ingrédients respectueux.' },
    { icon: 'message-circle', titre: 'Conseils sur mesure',    sousTitre: 'Soins, coiffure, entretien au quotidien.' },
    { icon: 'heart',          titre: 'Moment détente',         sousTitre: 'Un espace pensé pour vous mettre à l\'aise.' },
  ],
  nosCreations: {
    suptitle: 'NOS PRESTATIONS',
    titrePrincipal: 'Une coiffure pensée pour vous, *du conseil à la coupe*.',
    paragraphe:
      'Coupes, couleurs, soins : chaque prestation commence par un échange pour comprendre votre style et votre quotidien. Le résultat vous appartient.',
  },
  brandTagline: 'Coiffeur · Salon de coiffure',
  lexique: {
    navHistoireLabel: 'Le salon',
    navUniversLabel: 'Nos prestations',
    heroCtaPrimaire: 'Voir nos prestations →',
    histoireSuptitle: 'Le salon',
    avisSectionTitre: 'Ce qu\'en pensent nos *fidèles*.',
    footerColonneLabel: 'Le salon',
  },
  defaults: {
    heroEyebrowQualifier: 'Coiffeur',
    heroTitle: 'Une coiffure *qui vous ressemble*, vraiment.',
    heroLead:
      'Coupes, couleurs, soins. Chaque prestation commence par un échange — comprendre votre style, votre quotidien, ce qui vous va.',
    heroQuote:
      'Une bonne coupe, ce n\'est pas une tendance plaquée. C\'est une coupe qui fonctionne pour vous, votre cheveu, votre vie.',
    heroQuoteAuthor: '— Le coiffeur',
    histoireTitle: 'Un *salon* où on prend le temps d\'écouter.',
    histoireLead:
      'Conseil sur mesure, gestes précis, et un moment vraiment pour vous.',
    textePresentation:
      'On commence toujours par un échange : votre routine, votre type de cheveu, votre quotidien, ce que vous aimez ou pas. La coupe suit, pensée pour vous être facile à reprendre chez vous. Les couleurs sont travaillées avec des produits choisis pour leur rendu et leur respect du cheveu. Et entre tout ça, un moment où on prend le temps — parce que c\'est aussi ça, le métier.',
    ctaBannerTitle: 'Un *rendez-vous* à prendre ?',
    ctaBannerText:
      'Pour une coupe, une couleur, un événement à venir ou simplement échanger avant un changement, appelez-nous.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Coupes femme & homme',           desc: 'Coupes personnalisées selon votre cheveu et votre style. Conseil entretien pour reproduire à la maison.' },
      { cat: 'Couleur',           name: 'Coloration & mèches',            desc: 'Colorations, balayages, ombrés, méchages. Produits respectueux du cheveu, conseil avant chaque application.' },
      { cat: 'Soins',             name: 'Soins capillaires',              desc: 'Soins en profondeur, brushings, défrisage doux, soins à domicile recommandés selon votre cheveu.' },
      { cat: 'Événement',         name: 'Coiffures mariage & cérémonie',  desc: 'Coiffures de mariée, demoiselles d\'honneur, événements pro. Essais inclus, déplacement possible.' },
      { cat: 'Pratique',          name: 'Rendez-vous & infos',            desc: 'Réservation par téléphone ou en boutique. Conseil produits maison disponibles à la vente.' },
    ],
  },
}

const esthetique: MetierPreset = {
  id: 'esthetique',
  nom: 'Esthétique',
  couleurs: {
    primary: '#C9A88D',
    accent: '#B07A6D',
    background: '#FAF3EE',
  },
  atouts: [
    { icon: 'sparkles',       titre: 'Soins personnalisés', sousTitre: 'Adaptés à votre peau et vos besoins.' },
    { icon: 'shield-check',   titre: 'Produits experts',     sousTitre: 'Marques professionnelles soigneusement sélectionnées.' },
    { icon: 'moon',           titre: 'Cabine apaisante',     sousTitre: 'Un cocon pour vraiment décompresser.' },
    { icon: 'calendar-check', titre: 'Suivi attentif',       sousTitre: 'Conseils et soins dans la durée.' },
  ],
  nosCreations: {
    suptitle: 'NOS SOINS',
    titrePrincipal: 'Des soins sur mesure, *pour prendre soin de vous*.',
    paragraphe:
      'Visage, corps, beauté des mains et des pieds : chaque protocole est adapté à votre peau et à vos envies. Un vrai moment pour soi.',
  },
  brandTagline: 'Institut · Soins esthétiques',
  lexique: {
    navHistoireLabel: 'L\'institut',
    navUniversLabel: 'Nos soins',
    heroCtaPrimaire: 'Découvrir nos soins →',
    histoireSuptitle: 'L\'institut',
    avisSectionTitre: 'Ce qu\'en pensent nos *fidèles*.',
    footerColonneLabel: 'L\'institut',
  },
  defaults: {
    heroEyebrowQualifier: 'Institut',
    heroTitle: 'Des soins *sur mesure*, pour vraiment prendre soin de vous.',
    heroLead:
      'Visage, corps, beauté des mains et des pieds. Chaque protocole est adapté à votre peau, à vos envies, à votre moment.',
    heroQuote:
      'Un soin, c\'est un moment qu\'on s\'offre. Mon rôle, c\'est de faire en sorte que vous repartiez détendue, et que la peau aussi en bénéficie.',
    heroQuoteAuthor: '— L\'esthéticienne',
    histoireTitle: 'Un *institut* pensé comme un cocon.',
    histoireLead:
      'Soins adaptés, produits choisis, et un cadre où l\'on respire vraiment.',
    textePresentation:
      'Chaque soin commence par un échange pour comprendre votre peau, vos préoccupations, vos envies du jour. Les protocoles s\'adaptent : visage, corps, mains, pieds, épilations. Les produits sont choisis chez des marques professionnelles soigneusement sélectionnées. L\'objectif : un vrai moment pour vous, des résultats visibles, et un suivi attentif si vous souhaitez vous installer dans la durée.',
    ctaBannerTitle: 'Un *rendez-vous bien-être* ?',
    ctaBannerText:
      'Pour un soin précis, un coffret cadeau ou échanger sur ce qui vous conviendrait, un appel ou un message suffit.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Soins du visage',                 desc: 'Nettoyage, hydratation, anti-âge, traitement ciblé. Diagnostic peau et conseil produits inclus.' },
      { cat: 'Corps',             name: 'Soins corps & massages',          desc: 'Modelages relaxants, gommages, enveloppements. Pour la détente ou pour des résultats ciblés.' },
      { cat: 'Beauté',            name: 'Mains, pieds, épilations',        desc: 'Manucures, pédicures, beauté du regard, épilations toutes zones. Soins précis et respectueux.' },
      { cat: 'Cadeaux',           name: 'Coffrets & bons cadeaux',         desc: 'Bons soin à offrir, coffrets sur mesure, formules anniversaire ou détente. Plusieurs gammes disponibles.' },
      { cat: 'Pratique',          name: 'Rendez-vous & abonnements',       desc: 'Réservation simple, formules d\'abonnement avec tarifs préférentiels pour les soins réguliers.' },
    ],
  },
}

const kine: MetierPreset = {
  id: 'kine',
  nom: 'Kiné',
  couleurs: {
    primary: '#4A7A8A',
    accent: '#88B5A8',
    background: '#F4F8F7',
  },
  atouts: [
    { icon: 'clipboard-list', titre: 'Bilan personnalisé', sousTitre: 'Diagnostic précis avant chaque prise en charge.' },
    { icon: 'activity',       titre: 'Techniques variées', sousTitre: 'Manuel, posturologie, exercices adaptés.' },
    { icon: 'dumbbell',       titre: 'Cabinet équipé',     sousTitre: 'Plateau technique pensé pour vos progrès.' },
    { icon: 'heart-pulse',    titre: 'Suivi attentif',     sousTitre: 'On reste à votre écoute entre les séances.' },
  ],
  nosCreations: {
    suptitle: 'NOS PRISES EN CHARGE',
    titrePrincipal: 'Une approche complète, *adaptée à chaque patient*.',
    paragraphe:
      'Rééducation, posturologie, accompagnement sportif : chaque prise en charge commence par un bilan précis. L\'objectif : vos progrès, durablement.',
  },
  brandTagline: 'Kinésithérapeute · Rééducation',
  lexique: {
    navHistoireLabel: 'Le cabinet',
    navUniversLabel: 'Nos prises en charge',
    heroCtaPrimaire: 'Découvrir le cabinet →',
    histoireSuptitle: 'Le cabinet',
    avisSectionTitre: 'Ce qu\'en disent nos *patients*.',
    footerColonneLabel: 'Le cabinet',
  },
  defaults: {
    heroEyebrowQualifier: 'Kinésithérapeute',
    heroTitle: 'Une rééducation *pensée pour vous*, et qui avance.',
    heroLead:
      'Rééducation, posturologie, accompagnement sportif. Bilan précis, techniques adaptées, et un suivi attentif entre les séances.',
    heroQuote:
      'La rééducation, ça ne se fait pas à la place du patient. On guide, on adapte, on encourage — mais le travail, c\'est lui qui le fait.',
    heroQuoteAuthor: '— Le kiné',
    histoireTitle: 'Un *cabinet* qui mise sur le suivi.',
    histoireLead:
      'Bilans rigoureux, techniques adaptées, et l\'attention au-delà des séances.',
    textePresentation:
      'Chaque prise en charge commence par un bilan précis : examen clinique, anamnèse, identification des objectifs. Les techniques utilisées combinent kiné manuelle, exercices, posturologie selon les besoins. Le suivi est attentif : on note les progrès, on ajuste, on échange entre les séances si nécessaire. L\'objectif : que vous gagniez en autonomie et que les résultats tiennent dans la durée.',
    ctaBannerTitle: 'Un *rendez-vous* à prendre ?',
    ctaBannerText:
      'Pour une prescription médicale, une douleur récurrente ou un accompagnement sportif, appelez le cabinet ou laissez un message.',
    universItems: [
      { cat: 'Le cœur du métier',  name: 'Rééducation fonctionnelle',                      desc: 'Post-opératoire, traumatique, neurologique. Suivi progressif jusqu\'à la reprise complète de l\'activité.' },
      { cat: 'Douleurs chroniques', name: 'Lombalgies, cervicalgies, tendinopathies',     desc: 'Approche globale : examen, traitement manuel, exercices, conseils posturaux pour le quotidien.' },
      { cat: 'Posturologie',       name: 'Bilan postural',                                 desc: 'Analyse fine, traitement adapté. Pertinent pour douleurs récidivantes ou pathologies posturales.' },
      { cat: 'Sportifs',           name: 'Kiné du sport',                                  desc: 'Prévention, récupération, post-blessure. Accompagnement de la reprise jusqu\'à la performance.' },
      { cat: 'Pratique',           name: 'Rendez-vous & infos',                            desc: 'Prise de rendez-vous par téléphone ou en ligne. Conventionné, tiers payant possible selon mutuelle.' },
    ],
  },
}

const cabinet: MetierPreset = {
  id: 'cabinet',
  nom: 'Cabinet',
  couleurs: {
    primary: '#2C3E5C',
    accent: '#A8A8A8',
    background: '#F5F5F5',
  },
  atouts: [
    { icon: 'headphones',  titre: 'Écoute attentive',       sousTitre: 'Comprendre avant de proposer.' },
    { icon: 'user',        titre: 'Approche personnalisée', sousTitre: 'Chaque situation est unique.' },
    { icon: 'award',       titre: 'Compétences reconnues',  sousTitre: 'Formation continue et expérience.' },
    { icon: 'handshake',   titre: 'Suivi dans la durée',    sousTitre: 'Une relation de confiance qui s\'installe.' },
  ],
  nosCreations: {
    suptitle: 'NOS DOMAINES',
    titrePrincipal: 'Un accompagnement sur mesure, *pour chaque situation*.',
    paragraphe:
      'Nous intervenons dans plusieurs domaines de compétence. Chaque dossier est traité avec rigueur, dans le respect des délais et avec une vraie écoute.',
  },
  brandTagline: 'Cabinet · Expertise & conseil',
  lexique: {
    navHistoireLabel: 'Le cabinet',
    navUniversLabel: 'Nos domaines',
    heroCtaPrimaire: 'Découvrir le cabinet →',
    histoireSuptitle: 'Le cabinet',
    avisSectionTitre: 'Ce qu\'en disent nos *clients*.',
    footerColonneLabel: 'Le cabinet',
  },
  defaults: {
    heroEyebrowQualifier: 'Cabinet',
    heroTitle: 'Un accompagnement *sur mesure*, dans la durée.',
    heroLead:
      'Chaque situation est unique. Notre rôle : comprendre, conseiller, accompagner — avec rigueur et avec une vraie disponibilité.',
    heroQuote:
      'Le métier, c\'est d\'abord d\'écouter. Comprendre vraiment ce dont la personne ou l\'entreprise a besoin, avant de proposer quoi que ce soit.',
    heroQuoteAuthor: '— L\'équipe',
    histoireTitle: 'Un *cabinet* qui mise sur la relation.',
    histoireLead:
      'Écoute attentive, compétences solides, et un accompagnement qui s\'installe dans la durée.',
    textePresentation:
      'Chaque dossier commence par un échange approfondi : votre situation, vos enjeux, vos objectifs. L\'analyse suit, rigoureuse et structurée. Les recommandations sont formulées clairement, avec leurs implications. L\'accompagnement se poursuit ensuite : on reste disponible, on adapte, on suit. La confiance se construit dossier après dossier — et c\'est elle qui fait la différence.',
    ctaBannerTitle: 'Un *premier échange* ?',
    ctaBannerText:
      'Pour exposer votre situation, demander un devis ou simplement échanger sur une question, prenez contact par téléphone ou par message.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Conseil sur mesure',           desc: 'Analyse de votre situation, recommandations claires, accompagnement dans la mise en œuvre des décisions.' },
      { cat: 'Expertise',         name: 'Domaines d\'intervention',     desc: 'Nos domaines de compétence couvrent les sujets les plus fréquents de notre métier. Précisions sur demande.' },
      { cat: 'Particuliers',      name: 'Accompagnement particuliers',  desc: 'Conseil et suivi pour les questions personnelles. Premier rendez-vous d\'évaluation possible.' },
      { cat: 'Entreprises',       name: 'Accompagnement entreprises',   desc: 'Conseil aux dirigeants, suivi récurrent, intervention ponctuelle sur projet. Selon votre structure.' },
      { cat: 'Pratique',          name: 'Rendez-vous & honoraires',     desc: 'Prise de rendez-vous par téléphone ou message. Honoraires précisés avant tout engagement.' },
    ],
  },
}

const menuisier: MetierPreset = {
  id: 'menuisier',
  nom: 'Menuisier',
  couleurs: {
    primary: '#5C3A21',
    accent: '#C9A678',
    background: '#FAF5ED',
  },
  atouts: [
    { icon: 'ruler',        titre: 'Sur mesure',     sousTitre: 'Conçu et fabriqué selon vos espaces.' },
    { icon: 'tree-pine',    titre: 'Bois sélectionnés', sousTitre: 'Essences choisies pour la durée.' },
    { icon: 'hammer',       titre: 'Atelier local',  sousTitre: 'Fabrication maîtrisée de A à Z.' },
    { icon: 'check-circle', titre: 'Pose soignée',   sousTitre: 'Finitions impeccables, chantier propre.' },
  ],
  nosCreations: {
    suptitle: 'NOS RÉALISATIONS',
    titrePrincipal: 'Du bois, des idées, *du sur mesure*.',
    paragraphe:
      'Mobilier, agencements, escaliers, terrasses : chaque projet est conçu sur mesure et fabriqué dans notre atelier. Le bois, on en connaît un rayon.',
  },
  brandTagline: 'Menuisier · Agencement',
  lexique: {
    navHistoireLabel: 'L\'atelier',
    navUniversLabel: 'Nos réalisations',
    heroCtaPrimaire: 'Voir nos réalisations →',
    histoireSuptitle: 'L\'atelier',
    avisSectionTitre: 'Ce qu\'en disent nos *clients*.',
    footerColonneLabel: 'L\'atelier',
  },
  defaults: {
    heroEyebrowQualifier: 'Menuisier',
    heroTitle: 'Du bois, *du sur mesure*, des idées concrétisées.',
    heroLead:
      'Mobilier, agencements, escaliers, terrasses. Conception sur mesure, fabrication en atelier, pose soignée chez vous.',
    heroQuote:
      'Le bois, ça se respecte. Choisir la bonne essence, lire le fil, prévoir comment ça va vieillir. Le métier commence là.',
    heroQuoteAuthor: '— Le menuisier',
    histoireTitle: 'Un *atelier* où chaque projet compte.',
    histoireLead:
      'Essences choisies, fabrication maîtrisée, et le souci de la finition.',
    textePresentation:
      'On part toujours d\'un échange avec vous : visite, plans, conseil sur les essences. La fabrication se fait dans notre atelier, où chaque pièce est conçue pour s\'intégrer à votre espace. Mobilier sur mesure, dressings, escaliers, terrasses : le bois est choisi pour durer, les assemblages pour tenir. La pose chez vous se fait avec le même soin.',
    ctaBannerTitle: 'Un *projet* sur mesure ?',
    ctaBannerText:
      'Pour un meuble, un agencement complet, un escalier ou une terrasse : passez nous voir à l\'atelier ou appelez-nous pour un rendez-vous.',
    universItems: [
      { cat: 'Spécialité maison', name: 'Mobilier sur mesure',     desc: 'Bibliothèques, dressings, bureaux, tables : conçus pour votre espace, fabriqués dans notre atelier.' },
      { cat: 'Agencement',        name: 'Cuisines & rangements',   desc: 'Cuisine intégrale ou rangements complexes : étude, fabrication, pose. Avec ou sans plan de travail.' },
      { cat: 'Structure',         name: 'Escaliers & verrières',   desc: 'Escaliers droits, hélicoïdaux, en colimaçon. Verrières intérieures bois ou mixtes. Étude technique incluse.' },
      { cat: 'Extérieur',         name: 'Terrasses & bardages',    desc: 'Terrasses bois, bardages, claustras, pergolas. Essences résistantes choisies pour durer.' },
      { cat: 'Pratique',          name: 'Devis & atelier',         desc: 'Visite chez vous, devis détaillé, conception en atelier puis pose soignée. Suivi jusqu\'à la livraison.' },
    ],
  },
}

const plombier: MetierPreset = {
  id: 'plombier',
  nom: 'Plombier',
  couleurs: {
    primary: '#1E4A6B',
    accent: '#6B7A85',
    background: '#F2F4F6',
  },
  atouts: [
    { icon: 'zap',          titre: 'Intervention rapide', sousTitre: 'Diagnostic et solutions sans tarder.' },
    { icon: 'file-text',    titre: 'Devis clair',         sousTitre: 'Tout est annoncé avant de commencer.' },
    { icon: 'sparkles',     titre: 'Travail propre',      sousTitre: 'Chantier respecté, lieux laissés nets.' },
    { icon: 'shield-check', titre: 'Garantie matériel',   sousTitre: 'Marques fiables, installation pérenne.' },
  ],
  nosCreations: {
    suptitle: 'NOS INTERVENTIONS',
    titrePrincipal: 'Du dépannage à l\'installation, *on s\'occupe de tout*.',
    paragraphe:
      'Fuites, chauffage, salles de bains, raccordements : nous intervenons sur tous types de chantiers. Devis clair en amont, travail propre sur place.',
  },
  brandTagline: 'Plombier · Chauffagiste',
  lexique: {
    navHistoireLabel: 'L\'entreprise',
    navUniversLabel: 'Nos interventions',
    heroCtaPrimaire: 'Voir nos interventions →',
    histoireSuptitle: 'L\'entreprise',
    avisSectionTitre: 'Ce qu\'en disent nos *clients*.',
    footerColonneLabel: 'L\'entreprise',
  },
  defaults: {
    heroEyebrowQualifier: 'Plombier',
    heroTitle: 'Du dépannage à l\'installation, *on s\'occupe de tout*.',
    heroLead:
      'Fuites, chauffage, sanitaires, raccordements. Diagnostic clair, devis honnête, intervention rapide. Et un chantier laissé propre.',
    heroQuote:
      'Un bon plombier, c\'est celui qui répare une fois bien, pas trois fois mal. Le temps qu\'on prend au diagnostic, on le gagne ensuite.',
    heroQuoteAuthor: '— Le plombier',
    histoireTitle: 'Une *entreprise* qui répare bien du premier coup.',
    histoireLead:
      'Diagnostic précis, devis clair, intervention soignée — sans facture qui dérape.',
    textePresentation:
      'On intervient en dépannage et en installation : fuites d\'eau, chauffe-eau, chaudières, sanitaires, raccordements neufs. Avant chaque intervention, diagnostic et devis annoncé. Les marques utilisées sont choisies pour leur fiabilité, l\'installation est faite dans les règles de l\'art, et le chantier est laissé propre. Pour les urgences, on s\'organise pour intervenir vite.',
    ctaBannerTitle: 'Une *fuite* ou un projet ?',
    ctaBannerText:
      'Pour un dépannage rapide, un devis de salle de bains ou le remplacement d\'un chauffe-eau, appelez-nous : on s\'organise.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Dépannage plomberie',     desc: 'Fuites, débouchage, robinetterie, chauffe-eau. Intervention rapide, diagnostic clair, réparation durable.' },
      { cat: 'Installation',      name: 'Sanitaires & salles d\'eau', desc: 'Pose de sanitaires neufs, salles de bains complètes, raccordements. Conseil sur les équipements adaptés.' },
      { cat: 'Chauffage',         name: 'Chaudières & chauffe-eau', desc: 'Installation, remplacement, entretien. Gaz, électrique, thermodynamique : conseil énergie inclus.' },
      { cat: 'Rénovation',        name: 'Réseaux & raccordements', desc: 'Refonte complète des réseaux d\'eau, mise aux normes, raccordements pour rénovation lourde.' },
      { cat: 'Pratique',          name: 'Devis & urgence',         desc: 'Devis clair avant intervention, contrat d\'entretien possible, dépannage rapide en cas de fuite.' },
    ],
  },
}

const electricien: MetierPreset = {
  id: 'electricien',
  nom: 'Électricien',
  couleurs: {
    primary: '#1A2540',
    accent: '#E8B934',
    background: '#F5F4EE',
  },
  atouts: [
    { icon: 'shield-check', titre: 'Normes respectées', sousTitre: 'Installations aux dernières exigences.' },
    { icon: 'file-text',    titre: 'Devis transparent', sousTitre: 'Détaillé, sans surprise.' },
    { icon: 'zap',          titre: 'Dépannage rapide',  sousTitre: 'Pour les urgences comme pour le suivi.' },
    { icon: 'leaf',         titre: 'Conseil énergie',   sousTitre: 'Solutions économes et durables.' },
  ],
  nosCreations: {
    suptitle: 'NOS PRESTATIONS',
    titrePrincipal: 'Mise aux normes, dépannage, rénovation, *tout est possible*.',
    paragraphe:
      'Du tableau électrique à l\'installation domotique, nous intervenons dans les règles de l\'art. Devis détaillé, conseils énergie, garantie sur le travail.',
  },
  brandTagline: 'Électricien · Domotique',
  lexique: {
    navHistoireLabel: 'L\'entreprise',
    navUniversLabel: 'Nos prestations',
    heroCtaPrimaire: 'Voir nos prestations →',
    histoireSuptitle: 'L\'entreprise',
    avisSectionTitre: 'Ce qu\'en disent nos *clients*.',
    footerColonneLabel: 'L\'entreprise',
  },
  defaults: {
    heroEyebrowQualifier: 'Électricien',
    heroTitle: 'Une installation *aux normes*, sans approximation.',
    heroLead:
      'Dépannage, mise aux normes, rénovation, domotique. Travail dans les règles, devis détaillé, et un conseil énergie qui fait économiser.',
    heroQuote:
      'L\'électricité, ça ne pardonne pas l\'approximation. C\'est pour ça qu\'on prend le temps de bien faire, et qu\'on garantit ce qu\'on installe.',
    heroQuoteAuthor: '— L\'électricien',
    histoireTitle: 'Une *entreprise* qui ne lésine pas sur la sécurité.',
    histoireLead:
      'Normes respectées, matériel fiable, et le souci d\'expliquer ce qu\'on installe.',
    textePresentation:
      'On intervient sur tous types de chantiers : dépannage, mise aux normes (consuel), rénovation complète, neuf, domotique. Avant chaque intervention, diagnostic et devis détaillé. Le matériel utilisé est choisi pour sa fiabilité, l\'installation est faite dans les règles, et on prend le temps d\'expliquer ce qui a été fait. Pour les rénovations énergétiques, on conseille les solutions économes adaptées à votre logement.',
    ctaBannerTitle: 'Une *panne* ou un projet ?',
    ctaBannerText:
      'Pour un dépannage, une mise aux normes ou l\'étude d\'une installation neuve, appelez-nous : on revient vite avec une réponse claire.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Installation électrique', desc: 'Neuf, rénovation, extension. Tableaux électriques, circuits, prises, éclairage. Travaux conformes NF C 15-100.' },
      { cat: 'Sécurité',          name: 'Mise aux normes',         desc: 'Audit installation existante, mise en sécurité, consuel pour vente ou rénovation lourde.' },
      { cat: 'Dépannage',         name: 'Pannes & urgences',       desc: 'Disjonctions répétées, court-circuits, prises HS, panne complète. Diagnostic rapide, réparation durable.' },
      { cat: 'Confort',           name: 'Domotique & éclairage',   desc: 'Volets roulants connectés, éclairage automatisé, thermostats intelligents. Solutions adaptées à votre quotidien.' },
      { cat: 'Pratique',          name: 'Devis & garantie',        desc: 'Devis détaillé sous quelques jours, garantie sur l\'installation, conseil énergie pour faire des économies.' },
    ],
  },
}

const peintre: MetierPreset = {
  id: 'peintre',
  nom: 'Peintre',
  couleurs: {
    primary: '#3A4550',
    accent: '#2C5F6F',
    background: '#F3F2EE',
  },
  atouts: [
    { icon: 'layers',       titre: 'Préparation soignée', sousTitre: 'Le rendu commence avant la peinture.' },
    { icon: 'palette',      titre: 'Conseil couleurs',    sousTitre: 'Harmonies adaptées à vos pièces.' },
    { icon: 'shield-check', titre: 'Produits de qualité', sousTitre: 'Peintures durables, finitions impeccables.' },
    { icon: 'sparkles',     titre: 'Chantier propre',     sousTitre: 'Bâches, masquage, nettoyage en fin de journée.' },
  ],
  nosCreations: {
    suptitle: 'NOS CHANTIERS',
    titrePrincipal: 'Intérieur, extérieur, *des finitions qui font la différence*.',
    paragraphe:
      'Préparation des supports, conseil couleurs, application soignée : chaque chantier reçoit la même attention. Le rendu commence avant même de peindre.',
  },
  brandTagline: 'Peintre · Décoration',
  lexique: {
    navHistoireLabel: 'L\'entreprise',
    navUniversLabel: 'Nos chantiers',
    heroCtaPrimaire: 'Voir nos chantiers →',
    histoireSuptitle: 'L\'entreprise',
    avisSectionTitre: 'Ce qu\'en disent nos *clients*.',
    footerColonneLabel: 'L\'entreprise',
  },
  defaults: {
    heroEyebrowQualifier: 'Peintre',
    heroTitle: 'Un rendu *qui dure*, du sol au plafond.',
    heroLead:
      'Intérieur, extérieur, décoration. Préparation des supports, conseil couleurs, application soignée — un travail visible quand il est bien fait.',
    heroQuote:
      'Une bonne peinture, ça commence avant d\'ouvrir le pot. Préparation, sous-couches, conditions de séchage : tout compte si on veut que ça tienne.',
    heroQuoteAuthor: '— Le peintre',
    histoireTitle: 'Une *entreprise* qui finit ce qu\'elle commence.',
    histoireLead:
      'Préparation soignée, application précise, et le respect des lieux pendant le chantier.',
    textePresentation:
      'On commence par préparer : ponçage, rebouchage, sous-couches adaptées. C\'est invisible mais c\'est ce qui fait que la peinture tient. Ensuite l\'application : peintures choisies pour leur rendu et leur durabilité, finitions soignées, raccords nets. Pendant le chantier, on protège le mobilier, on bâche les sols, on nettoie en fin de journée. À la fin, un rendu qui se voit et un chantier qu\'on a presque oublié.',
    ctaBannerTitle: 'Un *chantier* à étudier ?',
    ctaBannerText:
      'Pour une pièce, un appartement complet ou une façade extérieure, un appel ou un message et on vient voir.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Peinture intérieure',      desc: 'Murs, plafonds, boiseries. Préparation complète, choix de finition adapté à chaque pièce.' },
      { cat: 'Extérieur',         name: 'Façades & boiseries ext.', desc: 'Ravalement, traitement bois extérieurs, peintures spéciales résistantes aux intempéries.' },
      { cat: 'Décoration',        name: 'Décors & finitions',       desc: 'Patines, effets matières, peintures décoratives, papiers peints. Pour donner du caractère aux pièces.' },
      { cat: 'Rénovation',        name: 'Préparation lourde',       desc: 'Reprise de fissures, traitement humidité, décapage, ponçage de plafonds anciens. Les supports complexes.' },
      { cat: 'Pratique',          name: 'Conseil & devis',          desc: 'Visite, échantillons et nuanciers, conseil couleurs, devis détaillé. Engagement sur la qualité du rendu.' },
    ],
  },
}

const paysagiste: MetierPreset = {
  id: 'paysagiste',
  nom: 'Paysagiste',
  couleurs: {
    primary: '#2F4A2F',
    accent: '#B85C3C',
    background: '#F3F1EA',
  },
  atouts: [
    { icon: 'flower-2',       titre: 'Création sur mesure', sousTitre: 'Selon votre terrain, vos envies, votre budget.' },
    { icon: 'leaf',           titre: 'Végétaux adaptés',    sousTitre: 'Choisis pour votre sol et votre climat.' },
    { icon: 'calendar-check', titre: 'Entretien régulier',  sousTitre: 'Contrats annuels ou interventions ponctuelles.' },
    { icon: 'trending-up',    titre: 'Conseil long terme',  sousTitre: 'Un jardin pensé pour évoluer.' },
  ],
  nosCreations: {
    suptitle: 'NOS RÉALISATIONS',
    titrePrincipal: 'Un jardin à votre image, *pensé pour durer*.',
    paragraphe:
      'Conception, plantation, terrasses, entretien : chaque projet part de vos envies et de la réalité du terrain. Pour un jardin qui vit avec vous.',
  },
  brandTagline: 'Paysagiste · Jardins & terrasses',
  lexique: {
    navHistoireLabel: 'L\'entreprise',
    navUniversLabel: 'Nos réalisations',
    heroCtaPrimaire: 'Voir nos réalisations →',
    histoireSuptitle: 'L\'entreprise',
    avisSectionTitre: 'Ce qu\'en disent nos *clients*.',
    footerColonneLabel: 'L\'entreprise',
  },
  defaults: {
    heroEyebrowQualifier: 'Paysagiste',
    heroTitle: 'Un jardin *qui vous ressemble*, qui vit avec vous.',
    heroLead:
      'Création, plantation, terrasses, entretien. On part de votre terrain, de vos envies, et on imagine un jardin qui vit dans le temps.',
    heroQuote:
      'Un jardin, ce n\'est pas une décoration figée. C\'est un vivant qui change avec les saisons, et qui doit pouvoir évoluer avec ceux qui l\'habitent.',
    heroQuoteAuthor: '— Le paysagiste',
    histoireTitle: 'Une *entreprise* qui pense le jardin sur le long terme.',
    histoireLead:
      'Conception adaptée, végétaux choisis pour durer, et le souci du jardin qui évolue bien.',
    textePresentation:
      'Chaque projet part d\'une visite : analyser le terrain, l\'orientation, le sol, vos usages et vos envies. La conception suit : plans, choix des végétaux, matériaux pour terrasses et chemins. Plantation et création se font ensuite, avec des végétaux adaptés au climat et au sol pour qu\'ils prennent vraiment. Pour l\'entretien : contrats annuels ou interventions ponctuelles selon ce qui vous arrange.',
    ctaBannerTitle: 'Un *jardin* à imaginer ?',
    ctaBannerText:
      'Pour un projet complet, une création ponctuelle ou un contrat d\'entretien, on vient voir le terrain et on en parle.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Création de jardin',     desc: 'Conception complète, plantations, gazon, allées, éclairage. De la planche au jardin réalisé.' },
      { cat: 'Aménagement',       name: 'Terrasses & extérieurs', desc: 'Terrasses bois ou pierre, dallages, murets, piscines naturelles. Coordination avec maçon si besoin.' },
      { cat: 'Végétal',           name: 'Plantations sur mesure', desc: 'Haies, arbres, massifs, potager. Végétaux choisis pour votre sol, votre climat et vos envies d\'entretien.' },
      { cat: 'Suivi',             name: 'Entretien & contrats',   desc: 'Tontes, tailles, désherbage, traitements naturels. Forfaits annuels ou interventions à la demande.' },
      { cat: 'Pratique',          name: 'Conseil & devis',        desc: 'Visite sur site, conseil végétal et aménagement, devis détaillé. Accompagnement de l\'idée jusqu\'à l\'entretien.' },
    ],
  },
}

const photographe: MetierPreset = {
  id: 'photographe',
  nom: 'Photographe',
  couleurs: {
    primary: '#1A1A1A',
    accent: '#B8A282',
    background: '#F5F3EF',
  },
  atouts: [
    { icon: 'user',     titre: 'Approche personnalisée', sousTitre: 'Chaque séance est pensée pour vous.' },
    { icon: 'eye',      titre: 'Œil attentif',            sousTitre: 'Capter les vrais moments, les vraies expressions.' },
    { icon: 'sparkles', titre: 'Retouches soignées',     sousTitre: 'Naturel préservé, rendu impeccable.' },
    { icon: 'image',    titre: 'Livraison rapide',        sousTitre: 'Galeries en ligne et tirages soignés.' },
  ],
  nosCreations: {
    suptitle: 'MES SÉANCES',
    titrePrincipal: 'Des moments vrais, *capturés avec justesse*.',
    paragraphe:
      'Portrait, famille, mariage, professionnel : chaque séance est préparée pour vous mettre à l\'aise. Le résultat : des images naturelles, qui vous ressemblent.',
  },
  brandTagline: 'Photographe · Studio & reportage',
  lexique: {
    navHistoireLabel: 'Le studio',
    navUniversLabel: 'Mes séances',
    heroCtaPrimaire: 'Voir mes séances →',
    histoireSuptitle: 'Le studio',
    avisSectionTitre: 'Ce qu\'en disent ceux qui m\'ont fait *confiance*.',
    footerColonneLabel: 'Le studio',
  },
  defaults: {
    heroEyebrowQualifier: 'Photographe',
    heroTitle: 'Des images *qui vous ressemblent*, vraiment.',
    heroLead:
      'Portrait, famille, mariage, professionnel. Chaque séance se prépare pour vous mettre à l\'aise — et le résultat suit, naturel et juste.',
    heroQuote:
      'La meilleure image, ce n\'est pas la plus posée. C\'est celle où la personne s\'oublie un instant, et redevient elle-même.',
    heroQuoteAuthor: '— Le photographe',
    histoireTitle: 'Un *regard* posé sur ce qui compte.',
    histoireLead:
      'Préparation soignée, écoute pendant la séance, et le souci d\'images qui durent.',
    textePresentation:
      'Chaque séance commence par un échange : votre intention, le lieu, l\'ambiance recherchée. Le jour J, on prend le temps : se rencontrer, se mettre à l\'aise, laisser venir. Les images sont retouchées avec respect — on garde le naturel, on soigne la lumière, on s\'arrête avant la sur-retouche. À la fin : une galerie en ligne, des tirages soignés si vous le souhaitez, et des images qui vous accompagneront longtemps.',
    ctaBannerTitle: 'Une *séance* à programmer ?',
    ctaBannerText:
      'Pour un projet précis, un devis, ou simplement échanger sur vos envies, appelez ou laissez un message.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Portrait & famille',           desc: 'Séances individuelles, en couple, en famille. Studio ou extérieur, selon l\'ambiance recherchée.' },
      { cat: 'Grands moments',    name: 'Mariages & cérémonies',        desc: 'Reportage complet : préparatifs, cérémonie, vin d\'honneur, soirée. Photos naturelles, livraison soignée.' },
      { cat: 'Vie',               name: 'Grossesse, naissance, enfance', desc: 'Séances dédiées aux moments uniques : grossesse, nouveau-né, anniversaires. Cadre apaisant, rythme respecté.' },
      { cat: 'Pro',               name: 'Photographie professionnelle',  desc: 'Portraits corporate, communication entreprise, événementiel pro. Cadrage adapté à votre image.' },
      { cat: 'Pratique',          name: 'Tarifs & livraison',           desc: 'Devis selon la prestation. Galerie en ligne sécurisée, tirages disponibles, formats variés.' },
    ],
  },
}

const autre: MetierPreset = {
  id: 'autre',
  nom: 'Autre',
  couleurs: {
    primary: '#2C3E50',
    accent: '#95A5A6',
    background: '#F8F8F8',
  },
  atouts: [
    { icon: 'award',        titre: 'Savoir-faire', sousTitre: 'Une expertise affirmée dans notre métier.' },
    { icon: 'map-pin',      titre: 'Proximité',    sousTitre: 'À votre écoute, au plus près de vos besoins.' },
    { icon: 'shield-check', titre: 'Qualité',      sousTitre: 'Des prestations soignées et durables.' },
    { icon: 'handshake',    titre: 'Engagement',   sousTitre: 'Un accompagnement honnête et fiable.' },
  ],
  nosCreations: {
    suptitle: 'NOTRE OFFRE',
    titrePrincipal: 'Un savoir-faire, *au service de vos projets*.',
    paragraphe:
      'Notre métier, c\'est de vous accompagner avec sérieux et proximité. Découvrez nos prestations, pensées pour répondre concrètement à vos besoins.',
  },
  brandTagline: 'Artisan · Savoir-faire local',
  lexique: {
    navHistoireLabel: 'L\'entreprise',
    navUniversLabel: 'Notre offre',
    heroCtaPrimaire: 'Découvrir notre offre →',
    histoireSuptitle: 'L\'entreprise',
    avisSectionTitre: 'Ce qu\'en disent nos *clients*.',
    footerColonneLabel: 'L\'entreprise',
  },
  defaults: {
    heroEyebrowQualifier: 'Artisan local',
    heroTitle: 'Un *savoir-faire*, au service de vos projets.',
    heroLead:
      'Une expertise affirmée, une approche personnalisée, et l\'envie de bien faire à chaque rendez-vous. Notre métier, on l\'aime — et ça se sent.',
    heroQuote:
      'Notre métier, c\'est avant tout une relation de confiance. On prend le temps qu\'il faut pour faire les choses bien.',
    heroQuoteAuthor: '— L\'équipe',
    histoireTitle: 'Une *maison* à votre écoute.',
    histoireLead:
      'Une approche simple et soignée, au plus près de vos besoins.',
    textePresentation:
      'Notre métier, c\'est de répondre à vos demandes avec attention et précision. Écoute, conseil, qualité du travail : on met le même soin dans chaque projet. Le but : que vous soyez accompagné sereinement, du premier échange au résultat final.',
    ctaBannerTitle: 'Une *question*, un projet ?',
    ctaBannerText:
      'Un coup de fil ou un message, et on revient vers vous rapidement pour en parler.',
    universItems: [
      { cat: 'Notre signature', name: 'Notre spécialité',             desc: 'Le cœur de notre métier, ce qui nous distingue et ce qu\'on fait au quotidien.' },
      { cat: 'Sur mesure',      name: 'Adapté à vos besoins',         desc: 'Chaque demande est unique : on s\'adapte à votre situation et à vos contraintes.' },
      { cat: 'Conseil',         name: 'Accompagnement personnalisé',  desc: 'Avant, pendant, après : on prend le temps de l\'échange à chaque étape.' },
      { cat: 'Suivi',           name: 'Avant et après',               desc: 'Une relation qui s\'installe dans la durée, pas juste une transaction.' },
      { cat: 'Pratique',        name: 'Prise de contact',             desc: 'Par téléphone, par message ou en venant nous voir : c\'est comme vous préférez.' },
    ],
  },
}

// ──────────────────────────────────────────────────────────────────────────
// PRESETS V2 — 16 catégories ajoutées par le brief "Consolidation finale".
//
// Toutes les annexes A → E ont été intégrées : chacun de ces 16 presets a
// désormais ses valeurs spécifiques (couleurs métier, atouts, nosCreations,
// lexique, defaults rédigés) et est exposé dans le select admin via
// `CATEGORIES_EXPOSED_IN_ADMIN` (cf. `lib/crm/constants.ts`).
//
// L'ancienne factory `buildStub()` a été retirée — plus de placeholder
// nécessaire. Si une nouvelle catégorie V3 venait à être ajoutée plus tard,
// le pattern serait : étendre `ProspectCategorie`, déclarer un preset
// complet ici (pas de stub), exposer dans `CATEGORIES_EXPOSED_IN_ADMIN`.
// ──────────────────────────────────────────────────────────────────────────

// Famille commerces de bouche (Annexe A) — presets complets

const bar_cafe: MetierPreset = {
  id: 'bar_cafe',
  nom: 'Bar-Café',
  couleurs: {
    primary: '#2C2520',
    accent: '#C8924D',
    background: '#F7F1E8',
  },
  atouts: [
    { icon: 'coffee',         titre: 'Cafés sélectionnés', sousTitre: 'Torréfacteurs choisis, mouture du jour.' },
    { icon: 'list',           titre: 'Ardoise du moment',  sousTitre: 'Boissons et petite restauration soignées.' },
    { icon: 'users',          titre: 'Lieu vivant',        sousTitre: 'Pour s\'arrêter, travailler, se retrouver.' },
    { icon: 'smile',          titre: 'Service attentif',   sousTitre: 'Comme à la maison, mais pas chez soi.' },
  ],
  nosCreations: {
    suptitle: 'L\'ARDOISE',
    titrePrincipal: 'Des cafés, des boissons, *et un peu de cuisine*.',
    paragraphe:
      'Café du matin au tard du soir, planches à partager, formules midi simples et soignées. L\'ardoise change au fil des envies et de ce que les producteurs nous apportent.',
  },
  brandTagline: 'Bar · Café & brasserie',
  lexique: {
    navHistoireLabel: 'La maison',
    navUniversLabel: 'L\'ardoise',
    heroCtaPrimaire: 'Voir l\'ardoise →',
    histoireSuptitle: 'La maison',
    avisSectionTitre: 'Ce qu\'en pensent nos *habitués*.',
    footerColonneLabel: 'Le commerce',
  },
  defaults: {
    heroEyebrowQualifier: 'Bar-café',
    heroTitle: 'Un *bistrot* du matin au soir.',
    heroLead:
      'Cafés bien faits, boissons soignées, planches à partager. Un lieu où on a envie de s\'arrêter, de revenir, et où on vous reconnaît.',
    heroQuote:
      'Le bistrot, ce n\'est pas juste un endroit où on consomme. C\'est un endroit où on se pose, où on parle, où on prend le temps.',
    heroQuoteAuthor: '— Le patron',
    histoireTitle: 'Un *bistrot* qui fait place.',
    histoireLead:
      'Cafés choisis, ardoise du moment, et l\'envie d\'un lieu qui rassemble.',
    textePresentation:
      'Le matin, c\'est café et viennoiseries. Le midi, formule simple à l\'ardoise. L\'après-midi, on s\'installe pour bosser ou pour discuter. Le soir, planches, vins et bières artisanales. Une seule règle : du soin dans ce qu\'on sert et un vrai accueil — qu\'on vienne pour cinq minutes ou pour la soirée.',
    ctaBannerTitle: 'Une *réservation* ?',
    ctaBannerText:
      'Pour une table le midi, une soirée entre amis ou la privatisation d\'un coin du bar, un message et on s\'organise.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Cafés & boissons',           desc: 'Expresso, allongé, latte, thés en vrac, jus frais, sirops maison. Cafés de torréfacteurs choisis.' },
      { cat: 'Le midi',           name: 'Formule du jour',            desc: 'Plat unique ou entrée-plat, simple et bien fait, à un prix doux. Change tous les jours.' },
      { cat: 'L\'apéro',          name: 'Planches & tapas',           desc: 'Charcuteries, fromages, légumes marinés, à partager autour d\'un verre. Soir et fin d\'après-midi.' },
      { cat: 'Choisis',           name: 'Vins, bières & spiritueux',  desc: 'Petits domaines, brasseries artisanales locales, sélection régulière sur ardoise.' },
      { cat: 'Pratique',          name: 'Privatisation & événements', desc: 'Anniversaires, after-work, soirées privées : on peut adapter le lieu selon vos envies.' },
    ],
  },
}

const traiteur: MetierPreset = {
  id: 'traiteur',
  nom: 'Traiteur',
  couleurs: {
    primary: '#5C3A2E',
    accent: '#C9A24B',
    background: '#FAF5EC',
  },
  atouts: [
    { icon: 'sparkles',       titre: 'Sur mesure',     sousTitre: 'Menu pensé pour votre événement.' },
    { icon: 'chef-hat',       titre: 'Cuisine maison', sousTitre: 'Tout préparé dans notre atelier.' },
    { icon: 'package',        titre: 'Service complet', sousTitre: 'Livraison, dressage, parfois service à table.' },
    { icon: 'message-circle', titre: 'Conseil amont',  sousTitre: 'Devis clair et accompagnement projet.' },
  ],
  nosCreations: {
    suptitle: 'NOS PRESTATIONS',
    titrePrincipal: 'De l\'apéro à la noce, *on cuisine vos événements*.',
    paragraphe:
      'Cocktails, repas assis, buffets, plateaux à emporter : chaque prestation est conçue avec vous, à partir de produits frais et de recettes maison. Devis personnalisé, conseil amont, exécution soignée.',
  },
  brandTagline: 'Traiteur · Événements',
  lexique: {
    navHistoireLabel: 'La maison',
    navUniversLabel: 'Nos prestations',
    heroCtaPrimaire: 'Voir nos prestations →',
    histoireSuptitle: 'La maison',
    avisSectionTitre: 'Ce qu\'en disent nos *clients*.',
    footerColonneLabel: 'Le commerce',
  },
  defaults: {
    heroEyebrowQualifier: 'Traiteur',
    heroTitle: 'Vos événements, *cuisinés avec soin*.',
    heroLead:
      'Cocktails, repas, buffets, plateaux à emporter. Cuisine maison, produits frais, et un accompagnement projet pour que tout se passe bien.',
    heroQuote:
      'Un repas d\'événement, ça se prépare longtemps avant. Le menu, les quantités, le service — tout doit être pensé pour que vous, vous profitiez.',
    heroQuoteAuthor: '— Le traiteur',
    histoireTitle: 'Une *cuisine* au service de vos moments.',
    histoireLead:
      'Sur mesure, fait maison, et le souci du détail à toutes les étapes.',
    textePresentation:
      'On part toujours d\'un échange avec vous : le contexte, le nombre d\'invités, les envies, le budget. Le menu se construit ensemble, à partir de produits frais sourcés au plus près. Notre atelier prépare tout en amont, on livre et on dresse au lieu de l\'événement. L\'objectif : que vous puissiez profiter de vos invités sans vous soucier de rien.',
    ctaBannerTitle: 'Un *événement* à venir ?',
    ctaBannerText:
      'Pour un devis, un échange de cadrage ou simplement explorer une idée, appelez-nous : on prend le temps qu\'il faut.',
    universItems: [
      { cat: 'Spécialité maison', name: 'Cocktails & buffets',     desc: 'Pièces salées et sucrées, présentation soignée, quantités calibrées pour votre nombre d\'invités.' },
      { cat: 'Grands moments',    name: 'Mariages & cérémonies',   desc: 'Menu complet sur mesure, accompagnement amont, dressage et service le jour J selon formule.' },
      { cat: 'Entreprise',        name: 'Repas pro & séminaires',  desc: 'Plateaux repas, déjeuners de travail, pauses gourmandes pour formations et événements pro.' },
      { cat: 'À emporter',        name: 'Plateaux & box',          desc: 'Plateaux pour anniversaires, repas en famille, week-ends. Sur commande, à retirer ou à livrer.' },
      { cat: 'Pratique',          name: 'Devis & rendez-vous',     desc: 'Premier échange gratuit pour cadrer votre projet, devis détaillé sous quelques jours.' },
    ],
  },
}

const chocolatier: MetierPreset = {
  id: 'chocolatier',
  nom: 'Chocolatier',
  couleurs: {
    primary: '#3D2317',
    accent: '#C9A861',
    background: '#FAF5EC',
  },
  atouts: [
    { icon: 'leaf',           titre: 'Cacao choisi',       sousTitre: 'Origines sélectionnées, traçabilité claire.' },
    { icon: 'hand',           titre: 'Fait à la main',     sousTitre: 'Chaque pièce moulée et garnie sur place.' },
    { icon: 'chef-hat',       titre: 'Recettes maison',    sousTitre: 'Pralinés, ganaches, gourmandises de saison.' },
    { icon: 'message-circle', titre: 'Conseil dégustation', sousTitre: 'Pour offrir ou pour vous faire plaisir.' },
  ],
  nosCreations: {
    suptitle: 'NOS CRÉATIONS',
    titrePrincipal: 'Du cacao, des recettes, *du fait main*.',
    paragraphe:
      'Pralinés, ganaches, moulages, confiseries de saison : chaque pièce sort de notre atelier, travaillée à la main avec des cacaos d\'origines choisies. Pour offrir, pour la maison, ou pour les grandes occasions.',
  },
  brandTagline: 'Chocolatier · Artisan confiseur',
  lexique: {
    navHistoireLabel: 'La maison',
    navUniversLabel: 'Nos créations',
    heroCtaPrimaire: 'Voir nos créations →',
    histoireSuptitle: 'La maison',
    avisSectionTitre: 'Ce qu\'en pensent nos *gourmands*.',
    footerColonneLabel: 'Le commerce',
  },
  defaults: {
    heroEyebrowQualifier: 'Chocolatier',
    heroTitle: 'Des chocolats *faits main*, du cacao à la bouchée.',
    heroLead:
      'Pralinés, ganaches, moulages, confiseries de saison. Cacaos choisis, recettes maison, et le geste qui fait la différence.',
    heroQuote:
      'Un bon chocolat, c\'est d\'abord un bon cacao. Ensuite c\'est de la précision, du temps, et l\'envie de transmettre ce moment de plaisir.',
    heroQuoteAuthor: '— Le chocolatier',
    histoireTitle: 'Un *atelier* de chocolatier, à l\'ancienne.',
    histoireLead:
      'Cacaos d\'origines, recettes maison, et le plaisir du geste précis.',
    textePresentation:
      'L\'atelier travaille des cacaos d\'origines choisies : Madagascar, Pérou, Équateur. Les couvertures sont tempérées sur place, les pralinés torréfiés à façon, les ganaches montées à la main. Pour chaque saison, des collections renouvelées : moulages de Pâques, ballotins de Noël, confiseries d\'été. Tout est fait ici, dans le respect du temps et du goût.',
    ctaBannerTitle: 'Une *commande spéciale* ?',
    ctaBannerText:
      'Pour un événement, un cadeau personnalisé, un ballotin sur mesure ou de gros volumes, un coup de fil et on prépare tout.',
    universItems: [
      { cat: 'Spécialité maison', name: 'Ballotins & assortiments',  desc: 'Sélections maison de pralinés et ganaches, présentation soignée. À offrir ou à se faire offrir.' },
      { cat: 'Selon la saison',   name: 'Collections saisonnières',  desc: 'Pâques, fêtes de fin d\'année, Saint-Valentin : créations renouvelées au rythme du calendrier.' },
      { cat: 'Plus que du chocolat', name: 'Confiseries maison',     desc: 'Pâtes de fruits, calissons, guimauves, caramels — recettes traditionnelles travaillées sur place.' },
      { cat: 'Sur commande',      name: 'Pièces personnalisées',     desc: 'Logos en chocolat, pièces événementielles, grosses quantités. Délai sur devis.' },
      { cat: 'Pratique',          name: 'Conseil & dégustation',     desc: 'Au comptoir, on raconte les origines, on fait goûter, on conseille selon vos envies.' },
    ],
  },
}

const epicerie_fine: MetierPreset = {
  id: 'epicerie_fine',
  nom: 'Épicerie fine',
  couleurs: {
    primary: '#3F4A2F',
    accent: '#B8895C',
    background: '#FAF6EC',
  },
  atouts: [
    { icon: 'shield-check',   titre: 'Producteurs choisis', sousTitre: 'Visites en ferme, sélection rigoureuse.' },
    { icon: 'map-pin',        titre: 'Produits du terroir', sousTitre: 'Spécialités locales mises à l\'honneur.' },
    { icon: 'gift',           titre: 'Coffrets cadeaux',    sousTitre: 'Composés selon vos envies.' },
    { icon: 'message-circle', titre: 'Conseil & dégustation', sousTitre: 'On fait goûter avant d\'acheter.' },
  ],
  nosCreations: {
    suptitle: 'NOS PRODUITS',
    titrePrincipal: 'Des produits *choisis*, des producteurs visités.',
    paragraphe:
      'Conserves, huiles, miels, épices, vins, douceurs : chaque référence est sélectionnée chez des producteurs rencontrés. Le terroir local est mis à l\'honneur, complété par quelques pépites venues d\'ailleurs.',
  },
  brandTagline: 'Épicerie fine · Producteurs choisis',
  lexique: {
    navHistoireLabel: 'La maison',
    navUniversLabel: 'Nos produits',
    heroCtaPrimaire: 'Voir nos produits →',
    histoireSuptitle: 'La maison',
    avisSectionTitre: 'Ce qu\'en pensent nos *fidèles*.',
    footerColonneLabel: 'Le commerce',
  },
  defaults: {
    heroEyebrowQualifier: 'Épicerie fine',
    heroTitle: 'Le terroir *en boutique*, dans l\'assiette.',
    heroLead:
      'Producteurs visités, spécialités locales, pépites du monde entier. Une épicerie où chaque produit a son histoire et son producteur.',
    heroQuote:
      'Choisir un produit, c\'est choisir une rencontre. Un producteur, une terre, un savoir-faire. C\'est tout ça qu\'on met dans nos rayons.',
    heroQuoteAuthor: '— L\'épicier',
    histoireTitle: 'Une *épicerie* qui raconte le terroir.',
    histoireLead:
      'Producteurs rencontrés, produits choisis, et le plaisir de partager nos coups de cœur.',
    textePresentation:
      'Foie gras, conserves, huiles, vinaigres, miels, confitures, vins locaux : la boutique met le terroir local au premier plan, complété par des sélections venues d\'autres régions et de quelques pays voisins. On rencontre les producteurs, on goûte, on rapporte ce qui nous a plu. Au comptoir, on fait déguster, on raconte, on conseille selon vos goûts ou pour vos cadeaux.',
    ctaBannerTitle: 'Un *coffret* à composer ?',
    ctaBannerText:
      'Pour un cadeau, un panier événement ou une commande d\'entreprise, on compose selon votre budget et vos envies. Un coup de fil suffit.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Spécialités du terroir',     desc: 'Conserves, foie gras, charcuteries sèches, fromages, confitures et miels de producteurs locaux.' },
      { cat: 'Sélections',        name: 'Huiles, vinaigres & épices', desc: 'Huiles d\'olive de domaines choisis, vinaigres balsamiques, épices et condiments choisis avec exigence.' },
      { cat: 'Boissons',          name: 'Vins & spiritueux locaux',   desc: 'Sélection de vignerons régionaux, armagnacs, liqueurs et apéritifs artisanaux du Sud-Ouest.' },
      { cat: 'Cadeaux',           name: 'Coffrets sur mesure',        desc: 'Composés selon votre budget, dans un emballage soigné. Anniversaires, fêtes, cadeaux d\'entreprise.' },
      { cat: 'Pratique',          name: 'Dégustations & conseil',     desc: 'On fait goûter au comptoir, on raconte les producteurs, on conseille les associations.' },
    ],
  },
}

// Famille bâtiment & artisanat (Annexe B) — presets complets

const macon: MetierPreset = {
  id: 'macon',
  nom: 'Maçon',
  couleurs: {
    primary: '#5C4D3A',
    accent: '#B85C3C',
    background: '#F4F0E8',
  },
  atouts: [
    { icon: 'file-text',    titre: 'Devis clair',      sousTitre: 'Détaillé, sans surprise à la facture.' },
    { icon: 'check-circle', titre: 'Travail soigné',   sousTitre: 'Murs droits, finitions propres.' },
    { icon: 'shield-check', titre: 'Chantier respecté', sousTitre: 'Délais tenus, lieux laissés nets.' },
    { icon: 'message-circle', titre: 'Conseil amont',   sousTitre: 'On vous accompagne dès l\'idée.' },
  ],
  nosCreations: {
    suptitle: 'NOS RÉALISATIONS',
    titrePrincipal: 'De la fondation à la finition, *on construit avec vous*.',
    paragraphe:
      'Construction neuve, rénovation, extension, ouverture de mur, terrasse : chaque chantier est cadré en amont avec un devis détaillé. On respecte les délais, on respecte les lieux, et on s\'assure que le résultat tienne dans la durée.',
  },
  brandTagline: 'Maçon · Construction & rénovation',
  lexique: {
    navHistoireLabel: 'L\'entreprise',
    navUniversLabel: 'Nos réalisations',
    heroCtaPrimaire: 'Voir nos réalisations →',
    histoireSuptitle: 'L\'entreprise',
    avisSectionTitre: 'Ce qu\'en disent nos *clients*.',
    footerColonneLabel: 'L\'entreprise',
  },
  defaults: {
    heroEyebrowQualifier: 'Maçon',
    heroTitle: 'La maçonnerie *bien faite*, sans mauvaise surprise.',
    heroLead:
      'Construction, rénovation, extension. Devis détaillé en amont, exécution soignée, et un vrai accompagnement de l\'idée jusqu\'aux finitions.',
    heroQuote:
      'Une bonne maçonnerie, c\'est invisible. Ça se voit quand c\'est mal fait, dix ans plus tard. Notre métier, c\'est de faire en sorte qu\'on ne nous revoie pas pour les mauvaises raisons.',
    heroQuoteAuthor: '— Le maçon',
    histoireTitle: 'Une *entreprise* qui prend ses chantiers au sérieux.',
    histoireLead:
      'Devis détaillés, délais tenus, finitions soignées : le métier comme il devrait toujours se faire.',
    textePresentation:
      'On intervient sur tous types de chantiers : maison individuelle, extension, rénovation lourde, ouverture de mur, terrasse, garage. Chaque projet commence par une visite, un cadrage précis et un devis détaillé. Sur le chantier : équipes formées, matériaux choisis, respect des règles de l\'art. À la fin : un travail propre, une facture conforme au devis, et un contact qui reste joignable.',
    ctaBannerTitle: 'Un *projet* à étudier ?',
    ctaBannerText:
      'Pour une visite, un devis ou un simple conseil avant de se lancer, appelez ou laissez un message : on revient vers vous rapidement.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Maçonnerie générale',        desc: 'Murs, fondations, dalles, planchers, ouvertures. Construction neuve et rénovation, toutes échelles.' },
      { cat: 'Agrandissement',    name: 'Extensions & surélévations', desc: 'Étude technique, raccordement à l\'existant, gros œuvre complet jusqu\'au clos couvert.' },
      { cat: 'Aménagement',       name: 'Terrasses & dallages',       desc: 'Terrasses sur dalle, escaliers extérieurs, allées et accès. Béton, pierre, ou matériaux décoratifs.' },
      { cat: 'Rénovation',        name: 'Reprise structure',          desc: 'Reprise de fondations, ouverture de mur porteur (avec étude), reprise de fissures, traitement humidité.' },
      { cat: 'Pratique',          name: 'Devis & accompagnement',     desc: 'Visite sur site, devis détaillé sous quelques jours, suivi de chantier régulier jusqu\'à la livraison.' },
    ],
  },
}

const couvreur: MetierPreset = {
  id: 'couvreur',
  nom: 'Couvreur',
  couleurs: {
    primary: '#3D4A52',
    accent: '#B07A3E',
    background: '#F2F2EE',
  },
  atouts: [
    { icon: 'search',       titre: 'Diagnostic toiture',  sousTitre: 'Inspection complète avant intervention.' },
    { icon: 'shield-check', titre: 'Matériaux durables',  sousTitre: 'Tuiles, ardoises, zinguerie de qualité.' },
    { icon: 'home',         titre: 'Charpente comprise',  sousTitre: 'On voit aussi sous la couverture.' },
    { icon: 'hard-hat',     titre: 'Travail en sécurité', sousTitre: 'Échafaudages aux normes, équipes formées.' },
  ],
  nosCreations: {
    suptitle: 'NOS INTERVENTIONS',
    titrePrincipal: 'De la charpente à la dernière tuile, *on couvre tout*.',
    paragraphe:
      'Pose, rénovation, dépannage : on intervient sur tous types de toitures. Diagnostic complet, matériaux durables, mise en œuvre dans les règles. Pour que votre toit dure et vous protège vraiment.',
  },
  brandTagline: 'Couvreur · Charpentier',
  lexique: {
    navHistoireLabel: 'L\'entreprise',
    navUniversLabel: 'Nos interventions',
    heroCtaPrimaire: 'Voir nos interventions →',
    histoireSuptitle: 'L\'entreprise',
    avisSectionTitre: 'Ce qu\'en disent nos *clients*.',
    footerColonneLabel: 'L\'entreprise',
  },
  defaults: {
    heroEyebrowQualifier: 'Couvreur',
    heroTitle: 'Une toiture *qui tient*, dans le temps.',
    heroLead:
      'Pose neuve, rénovation, dépannage. Diagnostic précis, matériaux durables, travail en sécurité. On voit aussi la charpente, pas que la couverture.',
    heroQuote:
      'Un toit, ça se regarde de près avant de monter dessus. La charpente, l\'écran, la ventilation : tout compte si on veut que ça tienne.',
    heroQuoteAuthor: '— Le couvreur',
    histoireTitle: 'Une *entreprise* qui regarde sous les tuiles.',
    histoireLead:
      'Diagnostic complet, matériaux durables, et le respect des règles de l\'art.',
    textePresentation:
      'On intervient en pose neuve, en rénovation et en dépannage urgent. Avant chaque chantier, diagnostic de la charpente, de l\'écran sous-toiture et de la ventilation : pas seulement la couverture. Tuiles canal, plates, ardoises, zinc, bac acier : on travaille tous matériaux selon le besoin et le style du bâti. Échafaudages aux normes, équipes formées, chantier laissé propre.',
    ctaBannerTitle: 'Une *fuite* ou un projet de toiture ?',
    ctaBannerText:
      'Pour un diagnostic, un devis ou un dépannage rapide après tempête, appelez-nous : on intervient dans les meilleurs délais.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Couverture & zinguerie',  desc: 'Pose neuve et rénovation : tuiles, ardoises, zinc. Gouttières, chéneaux, noues, raccords.' },
      { cat: 'Charpente',         name: 'Charpente traditionnelle', desc: 'Étude, fabrication et pose. Reprise de charpente, renforts, traitement des bois.' },
      { cat: 'Rénovation',        name: 'Réfection complète',       desc: 'Dépose, charpente, isolation, écran, couverture neuve. Avec ou sans changement de matériau.' },
      { cat: 'Urgence',           name: 'Dépannage toiture',        desc: 'Fuites, tempête, tuiles cassées : intervention rapide pour mettre hors d\'eau, devis pour la réparation durable.' },
      { cat: 'Pratique',          name: 'Diagnostic & devis',       desc: 'Visite sur site, inspection détaillée, devis sous quelques jours avec préconisations claires.' },
    ],
  },
}

const carreleur: MetierPreset = {
  id: 'carreleur',
  nom: 'Carreleur',
  couleurs: {
    primary: '#3A4550',
    accent: '#B89968',
    background: '#F4F3EF',
  },
  atouts: [
    { icon: 'ruler',          titre: 'Pose précise',        sousTitre: 'Joints alignés, niveaux parfaits.' },
    { icon: 'layers',         titre: 'Préparation soignée', sousTitre: 'Support traité avant la première dalle.' },
    { icon: 'message-circle', titre: 'Conseil matériau',    sousTitre: 'Le bon carrelage pour le bon usage.' },
    { icon: 'sparkles',       titre: 'Chantier propre',     sousTitre: 'Découpes nettes, lieux préservés.' },
  ],
  nosCreations: {
    suptitle: 'NOS RÉALISATIONS',
    titrePrincipal: 'Du sol au plafond, *un carrelage qui dure*.',
    paragraphe:
      'Sols, murs, salles de bains, terrasses, faïences décoratives : la pose se prépare bien avant de poser la première dalle. Choix du matériau, traitement du support, alignement, joints : chaque étape compte pour un rendu net qui dure.',
  },
  brandTagline: 'Carreleur · Pose & rénovation',
  lexique: {
    navHistoireLabel: 'L\'entreprise',
    navUniversLabel: 'Nos réalisations',
    heroCtaPrimaire: 'Voir nos réalisations →',
    histoireSuptitle: 'L\'entreprise',
    avisSectionTitre: 'Ce qu\'en disent nos *clients*.',
    footerColonneLabel: 'L\'entreprise',
  },
  defaults: {
    heroEyebrowQualifier: 'Carreleur',
    heroTitle: 'Une pose *au cordeau*, des finitions soignées.',
    heroLead:
      'Carrelage sol et mur, faïences, salles de bains, terrasses. Préparation du support, pose précise, joints nets — le souci du détail à chaque étape.',
    heroQuote:
      'Le carrelage, c\'est l\'art de la préparation. Un bon support, un bon plan de calepinage, et la pose se passe sans drame.',
    heroQuoteAuthor: '— Le carreleur',
    histoireTitle: 'Un *artisan* qui travaille au millimètre.',
    histoireLead:
      'Préparation rigoureuse, pose précise, et le respect du matériau choisi.',
    textePresentation:
      'Le carrelage, c\'est d\'abord du soin avant de poser. On commence par vérifier la planéité du support, le traiter si besoin, calculer le calepinage pour optimiser les découpes et les raccords. Ensuite la pose : alignement au cordeau, joints réguliers, découpes nettes autour des obstacles. À la fin, un sol ou un mur qui tient dans le temps et qui se voit pour les bonnes raisons.',
    ctaBannerTitle: 'Un *chantier* à étudier ?',
    ctaBannerText:
      'Pour un devis, un conseil sur le choix d\'un carrelage ou la rénovation d\'une salle de bains complète, un message ou un appel.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Pose sol & mur',          desc: 'Carrelage neuf ou rénovation, tout format. Grès cérame, terre cuite, pierre naturelle, faïence.' },
      { cat: 'Salles d\'eau',     name: 'Salles de bains complètes', desc: 'De la dépose à la pose finale : étanchéité, carrelage, faïence, joints. Coordination avec plombier si besoin.' },
      { cat: 'Extérieur',         name: 'Terrasses & dallages',    desc: 'Pose sur plots, pose collée, dallages extérieurs. Choix matériau adapté au climat et à l\'usage.' },
      { cat: 'Décoration',        name: 'Faïences & mosaïques',    desc: 'Crédences, frises décoratives, mosaïques, motifs personnalisés. Pose précise et calepinage soigné.' },
      { cat: 'Pratique',          name: 'Conseil & devis',         desc: 'Visite, conseil matériau adapté à votre usage et budget, devis détaillé sous quelques jours.' },
    ],
  },
}

const piscinier: MetierPreset = {
  id: 'piscinier',
  nom: 'Piscinier',
  couleurs: {
    primary: '#1E5A7A',
    accent: '#6FA8C5',
    background: '#F2F6F8',
  },
  atouts: [
    { icon: 'map-pin',        titre: 'Étude du terrain',     sousTitre: 'Implantation pensée selon votre extérieur.' },
    { icon: 'wrench',         titre: 'Construction soignée', sousTitre: 'Maçonnerie, étanchéité, équipements fiables.' },
    { icon: 'calendar-check', titre: 'Entretien possible',   sousTitre: 'Forfaits saison ou interventions ponctuelles.' },
    { icon: 'trending-up',    titre: 'Conseil long terme',   sousTitre: 'On vous accompagne au-delà de la livraison.' },
  ],
  nosCreations: {
    suptitle: 'NOS PISCINES',
    titrePrincipal: 'De la conception à l\'entretien, *on vous accompagne*.',
    paragraphe:
      'Construction neuve, rénovation, entretien, dépannage : la piscine se pense en amont et s\'entretient dans la durée. Étude technique, exécution soignée, et un suivi qui reste là après la livraison.',
  },
  brandTagline: 'Piscinier · Construction & entretien',
  lexique: {
    navHistoireLabel: 'L\'entreprise',
    navUniversLabel: 'Nos piscines',
    heroCtaPrimaire: 'Voir nos piscines →',
    histoireSuptitle: 'L\'entreprise',
    avisSectionTitre: 'Ce qu\'en disent nos *clients*.',
    footerColonneLabel: 'L\'entreprise',
  },
  defaults: {
    heroEyebrowQualifier: 'Piscinier',
    heroTitle: 'Une piscine *bien pensée*, pour des années.',
    heroLead:
      'Construction, rénovation, entretien. Étude du terrain, choix techniques fiables, et un accompagnement qui dure après la mise à l\'eau.',
    heroQuote:
      'Une piscine, ça se vit dix, vingt, trente ans. C\'est pour ça qu\'on prend le temps de bien la concevoir au départ.',
    heroQuoteAuthor: '— Le piscinier',
    histoireTitle: 'Une *entreprise* qui pense piscine sur le long terme.',
    histoireLead:
      'Étude amont, construction soignée, et un suivi qui reste là après la livraison.',
    textePresentation:
      'Chaque projet commence par une visite : analyser le terrain, l\'orientation, les accès, vos usages. La conception suit : forme, dimensions, équipements (filtration, traitement, chauffage), choix esthétiques. La construction se fait avec des partenaires de confiance : maçonnerie, étanchéité, équipements fiables. Pour l\'après : forfaits d\'entretien ou interventions ponctuelles, dépannage en saison.',
    ctaBannerTitle: 'Un *projet* de piscine ?',
    ctaBannerText:
      'Pour une construction neuve, une rénovation ou un contrat d\'entretien, on vient voir votre terrain et on en parle.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Construction neuve',          desc: 'Étude, terrassement, structure, étanchéité, équipements. Piscines maçonnées, coques, formes libres ou classiques.' },
      { cat: 'Rénovation',        name: 'Rénovation & rééquipement',   desc: 'Reprise d\'étanchéité, remplacement local technique, mise aux normes, changement de revêtement.' },
      { cat: 'Entretien',         name: 'Forfaits annuels',            desc: 'Hivernage, remise en route, traitement de l\'eau, nettoyage régulier. Plusieurs formules selon vos besoins.' },
      { cat: 'Dépannage',         name: 'Interventions ponctuelles',   desc: 'Panne pompe, problème de traitement, équipement défaillant : intervention rapide en saison.' },
      { cat: 'Pratique',          name: 'Devis & accompagnement',      desc: 'Visite, étude technique, devis détaillé. Suivi de chantier et formation à l\'usage à la livraison.' },
    ],
  },
}

// Famille services à la personne (Annexe C) — presets complets

const osteopathe: MetierPreset = {
  id: 'osteopathe',
  nom: 'Ostéopathe',
  couleurs: {
    primary: '#3A5A6B',
    accent: '#A8B5A8',
    background: '#F4F7F6',
  },
  atouts: [
    { icon: 'clipboard-list', titre: 'Bilan attentif',    sousTitre: 'Diagnostic précis avant tout geste.' },
    { icon: 'circle',         titre: 'Approche globale',  sousTitre: 'On regarde le corps dans son ensemble.' },
    { icon: 'users',          titre: 'Tous publics',      sousTitre: 'Adultes, enfants, sportifs, femmes enceintes.' },
    { icon: 'message-circle', titre: 'Conseils quotidien', sousTitre: 'Pour que les bénéfices durent.' },
  ],
  nosCreations: {
    suptitle: 'NOS PRISES EN CHARGE',
    titrePrincipal: 'Une approche *globale*, pour chaque patient.',
    paragraphe:
      'Douleurs aiguës ou chroniques, troubles fonctionnels, suivi de grossesse, sportifs : chaque consultation commence par un bilan complet pour comprendre l\'origine des symptômes. Les techniques s\'adaptent à votre situation, votre âge, votre histoire.',
  },
  brandTagline: 'Ostéopathe · Soins manuels',
  lexique: {
    navHistoireLabel: 'Le cabinet',
    navUniversLabel: 'Nos prises en charge',
    heroCtaPrimaire: 'Découvrir le cabinet →',
    histoireSuptitle: 'Le cabinet',
    avisSectionTitre: 'Ce qu\'en disent nos *patients*.',
    footerColonneLabel: 'Le cabinet',
  },
  defaults: {
    heroEyebrowQualifier: 'Ostéopathe',
    heroTitle: 'Une approche *manuelle et globale*, attentive.',
    heroLead:
      'Adultes, enfants, sportifs, femmes enceintes. Chaque consultation commence par un bilan attentif et propose des gestes adaptés à votre situation.',
    heroQuote:
      'L\'ostéopathie, c\'est avant tout de l\'écoute : du corps, de l\'histoire du patient, des signaux qu\'il envoie. Les gestes viennent après.',
    heroQuoteAuthor: '— L\'ostéopathe',
    histoireTitle: 'Un *cabinet* qui prend le temps.',
    histoireLead:
      'Écoute attentive, approche globale, et le souci de chercher la cause au-delà du symptôme.',
    textePresentation:
      'Chaque consultation commence par un échange et un bilan complet : antécédents, mode de vie, examen clinique. L\'approche est globale — on cherche les causes au-delà du seul symptôme. Les techniques utilisées (structurelles, fonctionnelles, douces selon les patients) s\'adaptent à votre âge, votre situation, votre demande. Pour conclure, des conseils concrets pour le quotidien : posture, gestes, étirements.',
    ctaBannerTitle: 'Un *rendez-vous* à prendre ?',
    ctaBannerText:
      'Pour une douleur, un suivi régulier, un bilan post-accident ou en accompagnement de grossesse, appelez ou laissez un message.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Douleurs aiguës & chroniques',  desc: 'Lombalgies, sciatiques, cervicalgies, tendinopathies, douleurs récidivantes. Bilan et prise en charge adaptée.' },
      { cat: 'Spécifique',        name: 'Suivi périnatal & nourrissons', desc: 'Grossesse, post-partum, nourrissons (coliques, plagiocéphalie, troubles du sommeil). Techniques douces.' },
      { cat: 'Sportifs',          name: 'Ostéopathie du sport',          desc: 'Préparation, récupération, prévention des blessures, optimisation des appuis. Pour amateurs comme confirmés.' },
      { cat: 'Global',            name: 'Troubles fonctionnels',         desc: 'Migraines, troubles digestifs, stress, troubles ORL. Approche globale qui dépasse le symptôme isolé.' },
      { cat: 'Pratique',          name: 'Rendez-vous & tarifs',          desc: 'Prise de rendez-vous simple, durée 45-60 min, tarifs affichés. Remboursement mutuelle possible selon contrats.' },
    ],
  },
}

const praticien_bien_etre: MetierPreset = {
  id: 'praticien_bien_etre',
  nom: 'Praticien bien-être',
  couleurs: {
    primary: '#6B7B6F',
    accent: '#C99B7A',
    background: '#F6F2EC',
  },
  atouts: [
    { icon: 'headphones',     titre: 'Écoute attentive',  sousTitre: 'Le temps qu\'il faut pour comprendre.' },
    { icon: 'feather',        titre: 'Approche douce',    sousTitre: 'Techniques choisies, gestes mesurés.' },
    { icon: 'moon',           titre: 'Cabinet apaisant',  sousTitre: 'Un espace pensé pour se poser.' },
    { icon: 'calendar-check', titre: 'Suivi adapté',      sousTitre: 'Au rythme qui vous convient.' },
  ],
  nosCreations: {
    suptitle: 'NOS ACCOMPAGNEMENTS',
    titrePrincipal: 'Un accompagnement *à votre rythme*.',
    paragraphe:
      'Chaque pratique commence par un échange : comprendre où vous en êtes, ce qui vous traverse, ce vers quoi vous voulez aller. Les séances s\'adaptent à votre cheminement, sans forcer.',
  },
  brandTagline: 'Bien-être · Accompagnement',
  lexique: {
    navHistoireLabel: 'Le cabinet',
    navUniversLabel: 'Nos accompagnements',
    heroCtaPrimaire: 'Découvrir nos accompagnements →',
    histoireSuptitle: 'Le cabinet',
    avisSectionTitre: 'Ce qu\'en disent celles et ceux que *l\'on accompagne*.',
    footerColonneLabel: 'Le cabinet',
  },
  defaults: {
    heroEyebrowQualifier: 'Bien-être',
    heroTitle: 'Prendre soin, *à votre rythme*.',
    heroLead:
      'Sophrologie, naturopathie, accompagnement bien-être : un espace d\'écoute et de pratiques douces, pour avancer là où vous en avez besoin.',
    heroQuote:
      'Chaque personne arrive avec son histoire. Le rôle du praticien, c\'est d\'écouter, de proposer, et de laisser le chemin se faire.',
    heroQuoteAuthor: '— La praticienne',
    histoireTitle: 'Un *cabinet* à l\'écoute.',
    histoireLead:
      'Un espace pensé pour le calme, des pratiques choisies pour ce qu\'elles apportent vraiment.',
    textePresentation:
      'Le cabinet est un lieu où l\'on prend le temps : d\'échanger, d\'observer, de comprendre. Les séances combinent écoute, technique et propositions concrètes pour le quotidien. Pas de promesse miracle, pas d\'injonction — juste un accompagnement pensé pour vous, dans la durée si vous le souhaitez.',
    ctaBannerTitle: 'Une *première séance* ?',
    ctaBannerText:
      'Pour prendre rendez-vous, échanger sur votre situation ou poser une question, un message ou un appel suffit.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Séances individuelles',    desc: 'Un échange, une pratique adaptée, des outils à emporter. Durée et fréquence ajustées à votre situation.' },
      { cat: 'Pour démarrer',     name: 'Première rencontre',       desc: 'Une séance d\'écoute pour comprendre votre demande et voir ce qu\'on peut faire ensemble.' },
      { cat: 'Suivi',             name: 'Accompagnement régulier',  desc: 'Pour avancer sur un sujet précis : stress, sommeil, transition, mieux-être global.' },
      { cat: 'Ateliers',          name: 'Groupes & ateliers',       desc: 'Sessions thématiques en petit groupe — relaxation, gestion du stress, ateliers découverte.' },
      { cat: 'Pratique',          name: 'Modalités',                desc: 'Au cabinet ou en visio selon les pratiques. Tarifs et conditions précisés à la prise de contact.' },
    ],
  },
}

// Famille commerces & services (Annexe D) — presets complets

const fleuriste: MetierPreset = {
  id: 'fleuriste',
  nom: 'Fleuriste',
  couleurs: {
    primary: '#4A6B4F',
    accent: '#D89B9B',
    background: '#FAF6F1',
  },
  atouts: [
    { icon: 'flower',         titre: 'Fleurs choisies',      sousTitre: 'Sélection chez les producteurs, fraîcheur d\'abord.' },
    { icon: 'sparkles',       titre: 'Bouquets sur mesure',  sousTitre: 'Pour vous ou pour offrir, à votre image.' },
    { icon: 'calendar',       titre: 'Événements',           sousTitre: 'Mariages, cérémonies, deuils — composition soignée.' },
    { icon: 'message-circle', titre: 'Conseil floral',       sousTitre: 'Quelle fleur pour quelle occasion ? On en parle.' },
  ],
  nosCreations: {
    suptitle: 'NOS COMPOSITIONS',
    titrePrincipal: 'Des fleurs choisies, *des bouquets qui parlent*.',
    paragraphe:
      'Bouquets du moment, créations sur mesure, fleurs à la tige : chaque composition part des envies et de ce que la saison nous offre. À retirer en boutique ou à livrer.',
  },
  brandTagline: 'Fleuriste · Création florale',
  lexique: {
    navHistoireLabel: 'La boutique',
    navUniversLabel: 'Nos compositions',
    heroCtaPrimaire: 'Voir nos compositions →',
    histoireSuptitle: 'La boutique',
    avisSectionTitre: 'Ce qu\'en pensent nos *fidèles*.',
    footerColonneLabel: 'La boutique',
  },
  defaults: {
    heroEyebrowQualifier: 'Fleuriste',
    heroTitle: 'Des fleurs *qui racontent*, chaque jour.',
    heroLead:
      'Compositions de saison, bouquets sur mesure, fleurs choisies chez les producteurs. Pour offrir, pour célébrer, ou juste pour faire du bien.',
    heroQuote:
      'Une belle fleur, ça ne se choisit pas au hasard. C\'est une intention qu\'on offre, et chacune mérite ce soin.',
    heroQuoteAuthor: '— La fleuriste',
    histoireTitle: 'Une *boutique* qui fait bouquet.',
    histoireLead:
      'Des fleurs choisies, des compositions pensées, et le plaisir de partager ce métier avec vous.',
    textePresentation:
      'On choisit les fleurs au plus près des producteurs, on travaille les couleurs et les textures avec attention, et on adapte chaque bouquet à l\'occasion : un anniversaire, un mariage, un hommage, ou simplement l\'envie d\'embellir son intérieur. La boutique vit au rythme des saisons — venez voir ce qu\'on a aujourd\'hui.',
    ctaBannerTitle: 'Une commande *spéciale* ?',
    ctaBannerText:
      'Mariage, deuil, événement, bouquet à livrer : un coup de fil ou un message, et on prépare tout pour vous.',
    universItems: [
      { cat: 'Notre signature', name: 'Bouquets du moment',     desc: 'Compositions de saison, renouvelées chaque semaine. À emporter directement.' },
      { cat: 'Sur mesure',      name: 'Bouquets personnalisés', desc: 'Pour offrir : on adapte les couleurs, les fleurs et la taille à votre intention.' },
      { cat: 'Événements',      name: 'Mariages & cérémonies',  desc: 'Décor floral, bouquet de mariée, centres de table. Devis sur demande.' },
      { cat: 'Hommages',        name: 'Fleurs de deuil',        desc: 'Coussins, gerbes, raquettes — créations sobres et soignées, dans les délais.' },
      { cat: 'Pratique',        name: 'Livraison',              desc: 'Livraison locale possible — appelez-nous pour les détails et délais.' },
    ],
  },
}

const bijoutier: MetierPreset = {
  id: 'bijoutier',
  nom: 'Bijoutier',
  couleurs: {
    primary: '#2A2620',
    accent: '#C9A24B',
    background: '#FAF6EE',
  },
  atouts: [
    { icon: 'gem',            titre: 'Métaux précieux',    sousTitre: 'Or, argent, sélection rigoureuse.' },
    { icon: 'hammer',         titre: 'Atelier maison',     sousTitre: 'Réparations et créations sur place.' },
    { icon: 'watch',          titre: 'Horlogerie soignée', sousTitre: 'Entretien et réparation de montres.' },
    { icon: 'message-circle', titre: 'Conseil discret',    sousTitre: 'Pour offrir ou pour soi, sans pression.' },
  ],
  nosCreations: {
    suptitle: 'NOTRE BOUTIQUE',
    titrePrincipal: 'Des bijoux, des montres, *un atelier sur place*.',
    paragraphe:
      'Sélection de bijoux en or et argent, montres choisies, réparations et créations sur mesure dans notre atelier. Pour offrir, pour transmettre, ou pour faire revivre une pièce ancienne.',
  },
  brandTagline: 'Bijoutier · Horloger',
  lexique: {
    navHistoireLabel: 'La boutique',
    navUniversLabel: 'Notre boutique',
    heroCtaPrimaire: 'Voir nos créations →',
    histoireSuptitle: 'La boutique',
    avisSectionTitre: 'Ce qu\'en pensent nos *clients*.',
    footerColonneLabel: 'La boutique',
  },
  defaults: {
    heroEyebrowQualifier: 'Bijoutier',
    heroTitle: 'Des pièces *choisies*, un atelier qui suit.',
    heroLead:
      'Bijoux or et argent, montres, créations sur mesure, réparations. Une boutique où l\'on prend le temps, et un atelier sur place pour entretenir vos pièces.',
    heroQuote:
      'Un bijou, ça traverse les générations si on en prend soin. Notre rôle, c\'est d\'aider à choisir, à transmettre, et à entretenir ce qui dure.',
    heroQuoteAuthor: '— Le bijoutier',
    histoireTitle: 'Une *boutique* à l\'ancienne, avec son atelier.',
    histoireLead:
      'Sélection rigoureuse, conseil discret, et un atelier qui répare et crée.',
    textePresentation:
      'La boutique propose une sélection de bijoux en or et argent : alliances, solitaires, créoles, pendentifs, chaînes. Les montres sont choisies avec la même exigence, mécaniques et quartz. L\'atelier sur place permet de réparer, redimensionner, redonner vie à des pièces anciennes. Et pour les projets sur mesure : on dessine, on propose, on fabrique. Le tout dans un cadre où l\'on prend le temps.',
    ctaBannerTitle: 'Une *pièce* à choisir ?',
    ctaBannerText:
      'Pour un cadeau, une alliance, une réparation ou un projet sur mesure, passez nous voir ou appelez pour un rendez-vous.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Bijoux or & argent',       desc: 'Sélection de pièces classiques et tendances. Alliances, solitaires, créoles, chaînes, pendentifs.' },
      { cat: 'Horlogerie',        name: 'Montres & entretien',      desc: 'Montres mécaniques et quartz choisies. Changement de pile, entretien, réparation toutes marques.' },
      { cat: 'Sur mesure',        name: 'Créations personnalisées', desc: 'Dessin sur mesure, transformation de pièces anciennes, projets sentimentaux. Devis sur étude.' },
      { cat: 'Atelier',           name: 'Réparations & rénovations', desc: 'Mise à taille, soudure, polissage, restauration de bijoux anciens. Devis transparent avant intervention.' },
      { cat: 'Pratique',          name: 'Rendez-vous & estimation', desc: 'Conseil sans engagement, estimation gratuite pour bijoux anciens, prise de rendez-vous pour projets sur mesure.' },
    ],
  },
}

const librairie: MetierPreset = {
  id: 'librairie',
  nom: 'Librairie',
  couleurs: {
    primary: '#3A2A1F',
    accent: '#B85C3C',
    background: '#FAF5EC',
  },
  atouts: [
    { icon: 'book-open',      titre: 'Sélection vivante',    sousTitre: 'Sélection renouvelée, coups de cœur affichés.' },
    { icon: 'message-circle', titre: 'Conseil sur mesure',   sousTitre: 'Le bon livre pour le bon lecteur.' },
    { icon: 'package',        titre: 'Commandes spéciales',  sousTitre: 'On commande ce que vous cherchez.' },
    { icon: 'users',          titre: 'Lieu vivant',          sousTitre: 'Rencontres, dédicaces, ateliers.' },
  ],
  nosCreations: {
    suptitle: 'NOS RAYONS',
    titrePrincipal: 'Des livres, des conseils, *une vraie librairie*.',
    paragraphe:
      'Romans, essais, jeunesse, BD, beaux-livres, livres locaux : un fonds choisi, des coups de cœur affichés, et le plaisir d\'échanger avec vous sur ce que vous lisez ou cherchez.',
  },
  brandTagline: 'Librairie · Conseil & découverte',
  lexique: {
    navHistoireLabel: 'La librairie',
    navUniversLabel: 'Nos rayons',
    heroCtaPrimaire: 'Voir nos rayons →',
    histoireSuptitle: 'La librairie',
    avisSectionTitre: 'Ce qu\'en pensent nos *lecteurs*.',
    footerColonneLabel: 'La librairie',
  },
  defaults: {
    heroEyebrowQualifier: 'Librairie',
    heroTitle: 'Des livres *choisis*, des conseils sincères.',
    heroLead:
      'Romans, essais, jeunesse, BD, beaux-livres. Un fonds vivant, des coups de cœur affichés, et le plaisir d\'échanger autour de ce qu\'on lit.',
    heroQuote:
      'Une librairie, ce n\'est pas juste un stock de livres. C\'est un endroit où quelqu\'un a lu, choisi, et a envie de partager ce qu\'il a trouvé.',
    heroQuoteAuthor: '— Le libraire',
    histoireTitle: 'Une *librairie* qui aime ce qu\'elle vend.',
    histoireLead:
      'Sélection vivante, conseil sincère, et un lieu où on a envie de revenir.',
    textePresentation:
      'La librairie défend ce qu\'elle a aimé : romans français et étrangers, sciences humaines, jeunesse soignée, BD, beaux-livres, livres régionaux. Les coups de cœur sont mis en avant, les sélections renouvelées au fil des actualités et des saisons. On peut venir bouquiner, demander conseil, commander un titre précis, ou simplement traîner dans les rayons. Et de temps en temps, on accueille un auteur pour une rencontre.',
    ctaBannerTitle: 'Une *commande* à passer ?',
    ctaBannerText:
      'Pour un titre précis, une liste cadeau, des achats pour une école ou une bibliothèque, passez nous voir ou appelez.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Romans & littérature',          desc: 'Rentrées littéraires, romans français et étrangers, poésie, théâtre. Coups de cœur affichés en vitrine.' },
      { cat: 'Idées',             name: 'Essais & sciences humaines',    desc: 'Philosophie, histoire, sociologie, actualité. Sélection vivante au fil des publications marquantes.' },
      { cat: 'Jeunesse',          name: 'Albums, romans, BD jeunesse',   desc: 'Du tout-petit à l\'ado : albums illustrés, premières lectures, romans, BD, mangas. Conseil pour les cadeaux.' },
      { cat: 'Local',             name: 'Livres du terroir & auteurs locaux', desc: 'Histoire locale, gastronomie régionale, auteurs du coin. Quand on peut, on les invite à dédicacer.' },
      { cat: 'Pratique',          name: 'Commandes & événements',        desc: 'Commande de tout titre disponible sous 48h. Cartes cadeaux, listes anniversaires, rencontres et dédicaces.' },
    ],
  },
}

const garagiste: MetierPreset = {
  id: 'garagiste',
  nom: 'Garagiste',
  couleurs: {
    primary: '#1F3A5F',
    accent: '#B7322C',
    background: '#F4F5F7',
  },
  atouts: [
    { icon: 'search',       titre: 'Diagnostic clair',  sousTitre: 'Avant intervention, on vous explique tout.' },
    { icon: 'wrench',       titre: 'Toutes marques',    sousTitre: 'Entretien, réparation, contrôle.' },
    { icon: 'file-text',    titre: 'Devis honnête',     sousTitre: 'Pas de surprise à la facture.' },
    { icon: 'shield-check', titre: 'Travail garanti',   sousTitre: 'Pièces et main-d\'œuvre couvertes.' },
  ],
  nosCreations: {
    suptitle: 'NOS PRESTATIONS',
    titrePrincipal: 'De l\'entretien à la grosse réparation, *on s\'occupe de tout*.',
    paragraphe:
      'Vidange, freinage, embrayage, distribution, pannes électroniques : nous intervenons sur toutes marques et tous types de véhicules. Diagnostic gratuit, devis clair, délais respectés.',
  },
  brandTagline: 'Garagiste · Mécanique & entretien',
  lexique: {
    navHistoireLabel: 'Le garage',
    navUniversLabel: 'Nos prestations',
    heroCtaPrimaire: 'Voir nos prestations →',
    histoireSuptitle: 'Le garage',
    avisSectionTitre: 'Ce qu\'en disent nos *clients*.',
    footerColonneLabel: 'Le garage',
  },
  defaults: {
    heroEyebrowQualifier: 'Garagiste',
    heroTitle: 'Votre voiture *entre de bonnes mains*.',
    heroLead:
      'Entretien, réparation, diagnostic. Toutes marques, devis clair, et un vrai accompagnement pour vous éviter les mauvaises surprises.',
    heroQuote:
      'Un bon garagiste, c\'est celui qui vous explique ce qu\'il fait, pourquoi il le fait, et combien ça coûte avant de commencer.',
    heroQuoteAuthor: '— Le garagiste',
    histoireTitle: 'Un *garage* de confiance, près de chez vous.',
    histoireLead:
      'Diagnostic précis, conseils honnêtes, et le souci du travail bien fait.',
    textePresentation:
      'Notre atelier est équipé pour intervenir sur toutes les marques et tous types de véhicules : entretien courant, distribution, embrayage, freinage, électronique. Chaque intervention commence par un diagnostic et un devis clair. On vous explique avant, on vous montre après. L\'objectif : que vous repartiez avec une voiture fiable et la facture annoncée.',
    ctaBannerTitle: 'Un *devis* ou un rendez-vous ?',
    ctaBannerText:
      'Pour un diagnostic, un entretien ou un dépannage, passez nous voir ou appelez-nous — on s\'organise pour vous prendre rapidement.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Entretien & révision',         desc: 'Vidange, filtres, contrôle freinage, distribution. Toutes marques, toutes motorisations.' },
      { cat: 'Réparation',        name: 'Mécanique générale',           desc: 'Embrayage, suspension, échappement, électronique. Diagnostic précis avant intervention.' },
      { cat: 'Sécurité',          name: 'Pneumatiques',                 desc: 'Vente et montage tous pneus, équilibrage, géométrie. Stockage saisonnier possible.' },
      { cat: 'Avant CT',          name: 'Préparation contrôle technique', desc: 'Contre-visite, mise aux normes. On vous accompagne pour passer du premier coup.' },
      { cat: 'Pratique',          name: 'Dépannage',                    desc: 'Sur place, à domicile ou enlèvement véhicule. Appelez-nous pour les modalités.' },
    ],
  },
}

// Famille hébergement (Annexe E) — presets complets

const gite: MetierPreset = {
  id: 'gite',
  nom: 'Gîte',
  couleurs: {
    primary: '#4A5C3A',
    accent: '#C9853D',
    background: '#FAF5EC',
  },
  atouts: [
    { icon: 'home',  titre: 'Cadre soigné',     sousTitre: 'Maison entretenue, équipements pensés.' },
    { icon: 'smile', titre: 'Accueil personnel', sousTitre: 'On vous reçoit, on prend le temps.' },
    { icon: 'map',   titre: 'Conseils locaux',   sousTitre: 'Bonnes adresses du coin partagées.' },
    { icon: 'moon',  titre: 'Calme assuré',      sousTitre: 'Loin de l\'agitation, près de l\'essentiel.' },
  ],
  nosCreations: {
    suptitle: 'L\'HÉBERGEMENT',
    titrePrincipal: 'Un lieu *pour souffler*, dans un vrai cadre.',
    paragraphe:
      'Gîte ou chambres d\'hôtes, séjour court ou semaine complète : la maison est pensée pour vous mettre à l\'aise. Cadre soigné, équipements complets, accueil personnel — et de vraies adresses du coin à partager.',
  },
  brandTagline: 'Gîte · Chambres d\'hôtes',
  lexique: {
    navHistoireLabel: 'La maison',
    navUniversLabel: 'L\'hébergement',
    heroCtaPrimaire: 'Voir l\'hébergement →',
    histoireSuptitle: 'La maison',
    avisSectionTitre: 'Ce qu\'en disent nos *hôtes*.',
    footerColonneLabel: 'La maison',
  },
  defaults: {
    heroEyebrowQualifier: 'Hébergement',
    heroTitle: 'Un *vrai séjour*, dans un vrai lieu.',
    heroLead:
      'Gîte, chambres d\'hôtes, accueil personnel. Un cadre soigné, des conseils locaux, et le calme qui fait du bien quand on en a besoin.',
    heroQuote:
      'Recevoir, c\'est s\'occuper des détails qu\'on ne voit pas. Pour que l\'invité, lui, n\'ait qu\'à profiter du lieu et du moment.',
    heroQuoteAuthor: '— Les hôtes',
    histoireTitle: 'Une *maison* qui sait recevoir.',
    histoireLead:
      'Cadre soigné, accueil chaleureux, et l\'envie de partager ce qu\'on aime du coin.',
    textePresentation:
      'La maison est pensée pour le séjour : équipements complets, literie soignée, espaces de vie agréables, extérieur arrangé. On accueille en personne, on prend le temps de présenter, on partage les bonnes adresses : restaurants, marchés, balades, sites à voir. Le reste du temps, on reste discrets — vous êtes chez vous. Un cadre pour souffler, retrouver le calme, ou rayonner dans la région.',
    ctaBannerTitle: 'Une *réservation* ?',
    ctaBannerText:
      'Pour un séjour, un week-end, une question sur les disponibilités ou le coin, appelez ou laissez un message — réponse rapide.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'L\'hébergement',              desc: 'Gîte indépendant ou chambres d\'hôtes selon formule. Capacité, équipements et tarifs détaillés sur demande.' },
      { cat: 'Confort',           name: 'Équipements & services',     desc: 'Literie soignée, linge fourni, cuisine équipée, wifi, parking. Petit-déjeuner selon formule.' },
      { cat: 'À côté',            name: 'Le coin & ses richesses',    desc: 'Sites à voir, restaurants conseillés, marchés, randonnées, vignobles. Carte personnalisée à l\'arrivée.' },
      { cat: 'Selon vos envies',  name: 'Formules & séjours',         desc: 'Week-ends, semaines, séjours thématiques. Tarifs dégressifs selon durée, formules adaptables.' },
      { cat: 'Pratique',          name: 'Réservation & arrivée',      desc: 'Réservation directe (sans frais de plateforme), accueil personnalisé, conseil pré-séjour.' },
    ],
  },
}

const camping: MetierPreset = {
  id: 'camping',
  nom: 'Camping',
  couleurs: {
    primary: '#2F5C3F',
    accent: '#E8893E',
    background: '#F4F7F1',
  },
  atouts: [
    { icon: 'tree-pine', titre: 'Cadre nature',          sousTitre: 'Emplacements ombragés, espaces préservés.' },
    { icon: 'tent',      titre: 'Hébergements variés',   sousTitre: 'Tentes, caravanes, mobil-homes, chalets.' },
    { icon: 'sparkles',  titre: 'Animations',            sousTitre: 'Activités selon la saison, pour tous âges.' },
    { icon: 'users',     titre: 'Accueil familial',      sousTitre: 'À taille humaine, on prend le temps.' },
  ],
  nosCreations: {
    suptitle: 'LE CAMPING',
    titrePrincipal: 'Des vacances *en pleine nature*, à taille humaine.',
    paragraphe:
      'Emplacements pour tentes et caravanes, mobil-homes, chalets : plusieurs formules pour s\'adapter à votre séjour. Cadre naturel préservé, services pensés, animations en saison et accueil personnel.',
  },
  brandTagline: 'Camping · Nature & loisirs',
  lexique: {
    navHistoireLabel: 'Le camping',
    navUniversLabel: 'Le camping',
    heroCtaPrimaire: 'Découvrir le camping →',
    histoireSuptitle: 'Le camping',
    avisSectionTitre: 'Ce qu\'en disent nos *campeurs*.',
    footerColonneLabel: 'Le camping',
  },
  defaults: {
    heroEyebrowQualifier: 'Camping',
    heroTitle: 'Des vacances *au grand air*, à taille humaine.',
    heroLead:
      'Emplacements, mobil-homes, chalets. Cadre naturel, services pensés, animations en saison. L\'envie de vacances vraies, sans usine à touristes.',
    heroQuote:
      'Un bon camping, ce n\'est pas une usine. C\'est un lieu où on se reconnaît d\'un séjour à l\'autre, où on revient parce qu\'on s\'y est senti bien.',
    heroQuoteAuthor: '— L\'équipe',
    histoireTitle: 'Un *camping* qui prend soin de ses campeurs.',
    histoireLead:
      'Cadre nature préservé, services soignés, et l\'accueil qui fait revenir.',
    textePresentation:
      'Le camping propose plusieurs formules d\'hébergement : emplacements pour tentes et caravanes, mobil-homes équipés, chalets bois. Les espaces sont pensés pour préserver la tranquillité : ombrage, distances, zones de jeux séparées. Sur place : sanitaires, espace piscine selon saison, animations pour enfants et adultes. Et autour, des choses à faire — randonnées, baignades, marchés, sites à visiter.',
    ctaBannerTitle: 'Une *réservation* ?',
    ctaBannerText:
      'Pour réserver un emplacement, un hébergement, demander des disponibilités ou poser une question, appelez ou écrivez-nous.',
    universItems: [
      { cat: 'Le cœur du métier', name: 'Emplacements & hébergements', desc: 'Tentes et caravanes sur emplacements ombragés, mobil-homes équipés, chalets. Plusieurs gammes et tarifs.' },
      { cat: 'Sur place',         name: 'Services & équipements',      desc: 'Sanitaires soignés, espace piscine en saison, aire de jeux, laverie, wifi, snack selon période.' },
      { cat: 'Animations',        name: 'Activités en saison',         desc: 'Animations enfants, soirées à thème, activités sportives selon période. Programme variable été/hors saison.' },
      { cat: 'À côté',            name: 'À découvrir autour',          desc: 'Randonnées, sites naturels, villages à visiter, marchés locaux. Conseils personnalisés à votre arrivée.' },
      { cat: 'Pratique',          name: 'Réservation & saison',        desc: 'Réservation en ligne ou par téléphone. Ouverture saisonnière, tarifs dégressifs selon durée.' },
    ],
  },
}

/**
 * Dictionnaire `categorie → preset`. La clé est `ProspectCategorie`, ce qui
 * garantit (via le type) qu'aucune catégorie n'est oubliée.
 */
export const METIER_PRESETS: Readonly<Record<ProspectCategorie, MetierPreset>> = {
  // V1 — Famille 2 (commerces de bouche historiques)
  boulangerie,
  boucherie,
  restaurant,
  pizzeria,
  // V1 — Commerces de bouche additionnels
  primeur,
  fromager,
  caviste,
  // V1 — Services à la personne
  coiffeur,
  esthetique,
  kine,
  cabinet,
  // V1 — Bâtiment & artisanat
  menuisier,
  plombier,
  electricien,
  peintre,
  paysagiste,
  // V1 — Commerces & services
  photographe,
  // V2 — Commerces de bouche additionnels (STUBS — Annexe A à intégrer)
  bar_cafe,
  traiteur,
  chocolatier,
  epicerie_fine,
  // V2 — Bâtiment & artisanat additionnels (STUBS — Annexe B à intégrer)
  macon,
  couvreur,
  carreleur,
  piscinier,
  // V2 — Services à la personne additionnels (STUBS — Annexe C à intégrer)
  osteopathe,
  praticien_bien_etre,
  // V2 — Commerces & services additionnels (STUBS — Annexe D à intégrer)
  fleuriste,
  bijoutier,
  librairie,
  garagiste,
  // V2 — Hébergement (STUBS — Annexe E à intégrer)
  gite,
  camping,
  // Fallback
  autre,
}

/**
 * Récupère le preset d'une catégorie. Fallback sur `autre` si la catégorie
 * est inconnue (cas théorique : la signature de type empêche ce chemin en
 * pratique, mais le fallback protège d'un cast unsafe côté appelant).
 */
export function getPresetForCategorie(categorie: ProspectCategorie): MetierPreset {
  return METIER_PRESETS[categorie] ?? autre
}
