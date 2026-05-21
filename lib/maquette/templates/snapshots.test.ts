import { describe, expect, it } from 'vitest'
import { TEMPLATES } from './index'

/**
 * Test snapshot des 4 templates Famille 2.
 *
 * Objectif : figer les valeurs courantes des templates `boulangerie`,
 * `boucherie`, `restaurant` et `pizzeria` pour qu'**aucune modification
 * involontaire** (refacto, extension de presets, ajout de champ) ne change
 * silencieusement le rendu des maquettes Famille 2 déjà distribuées en
 * prospection.
 *
 * Si tu modifies intentionnellement une de ces valeurs (ex : correction
 * orthographique validée, évolution éditoriale délibérée), regénère le
 * snapshot avec `npx vitest run lib/maquette/templates/snapshots.test.ts -u`.
 * À chaque update, vérifie visuellement sur une maquette publiée existante
 * que le changement est bien celui attendu.
 *
 * Pourquoi un inline snapshot plutôt que `toMatchSnapshot()` :
 *   - lisibilité en code review (le diff git est explicite, pas dans un .snap)
 *   - pas de fichier `__snapshots__` séparé à committer
 *   - le snapshot apparaît à côté de l'assertion, donc l'intention est claire
 */
describe('TEMPLATES — snapshots Famille 2 (zéro régression)', () => {
  it('boulangerie', () => {
    expect(TEMPLATES.boulangerie).toMatchInlineSnapshot(`
      {
        "defaults": {
          "avisSectionTitre": "Ce qu'en pensent nos *habitués*.",
          "brandTagline": "Boulangerie · Pâtisserie",
          "ctaBannerText": "Pour toute commande spéciale (gâteau d'anniversaire, plateau d'événement, baguettes en grande quantité), un coup de fil suffit.",
          "ctaBannerTitle": "Une commande, *une question* ?",
          "footerColonneLabel": "Le commerce",
          "heroCtaPrimaire": "Voir nos créations →",
          "heroEyebrow": [Function],
          "heroLead": "Pétri, façonné et cuit chaque jour dans notre fournil. Une tradition vivante, des farines locales, du goût avant tout.",
          "heroQuote": "Le bon pain, c'est du temps respecté. Du levain, de la patience, et la même envie chaque matin.",
          "heroQuoteAuthor": "— Le boulanger",
          "heroTitle": "Le pain *fait maison*, au quotidien.",
          "histoireLead": "Avec une seule idée en tête : faire du bon pain, simplement.",
          "histoireSuptitle": "La maison",
          "histoireTitle": "Une boulangerie de *quartier*, ouverte à tous.",
          "navHistoireLabel": "La maison",
          "navUniversLabel": "Nos créations",
          "textePresentation": "Pas de fioritures. Du levain naturel, des farines de moulins locaux, et le temps qu'il faut pour que la pâte développe ses arômes. Notre fournil tourne dès l'aube pour que vous trouviez chaque jour des baguettes croustillantes, des viennoiseries dorées et des pâtisseries soignées.",
          "universSectionIntro": "Chaque produit est confectionné à la main, dans notre fournil. Découvrez nos cinq univers, à déguster sur place ou à emporter.",
          "universSectionSuptitle": "Nos créations",
          "universSectionTitle": "Du pain, des viennoiseries, et bien *plus encore*.",
        },
        "palette": {
          "accent": "#B8893E",
          "accentLight": "#D4A968",
          "cream": "#F5EFE4",
          "creamLight": "#FAF6EE",
          "creamWarm": "#EBE0CC",
          "ink": "#1A1612",
          "inkMuted": "#7A6E60",
          "inkSoft": "#4A3F35",
          "primary": "#B5512E",
          "primarySoft": "#D87454",
        },
        "universItems": [
          {
            "cat": "Spécialité maison",
            "desc": "Tradition, complet, multi-céréales, seigle. Cuits sur sole, pour une croûte épaisse et une mie souple.",
            "name": "Pains au levain",
          },
          {
            "cat": "Du matin",
            "desc": "Croissants, pains au chocolat, brioches. Cuits chaque matin.",
            "name": "Viennoiseries",
          },
          {
            "cat": "Sucré",
            "desc": "Tartes, éclairs, mille-feuilles, opéras. Frais du jour.",
            "name": "Pâtisseries",
          },
          {
            "cat": "Sur commande",
            "desc": "Anniversaires, mariages, baptêmes. Pièces sur mesure.",
            "name": "Gâteaux d'événement",
          },
          {
            "cat": "Pause salée",
            "desc": "Quiches, pizzas, sandwichs frais. Idéal pour le déjeuner.",
            "name": "Snacks & sandwichs",
          },
        ],
        "valeursItems": [
          {
            "desc": "Pétrissage long, fermentation lente.",
            "title": "Levain naturel",
          },
          {
            "desc": "Moulins du Gers, sans additifs.",
            "title": "Farines locales",
          },
          {
            "desc": "Du frais, à toute heure.",
            "title": "Cuit chaque jour",
          },
          {
            "desc": "On vous connaît, on vous reconnaît.",
            "title": "Accueil chaleureux",
          },
        ],
        "variant": "boulangerie",
      }
    `)
  })

  // Pour les 3 autres templates Famille 2, on génère le snapshot au premier
  // run de vitest (la chaîne `toMatchInlineSnapshot()` vide sera remplie
  // automatiquement par vitest et apparaîtra dans le diff git). Ça permet
  // d'éviter d'écrire les 3 blobs à la main : vitest les figera pour nous,
  // puis tout changement involontaire futur fera péter le test.
  //
  // Si vitest échoue ici en CI, c'est que le snapshot n'a pas encore été
  // figé localement : lancer `vitest -u` une fois pour générer.

  it('boucherie', () => {
    expect(TEMPLATES.boucherie).toMatchInlineSnapshot(`
      {
        "defaults": {
          "avisSectionTitre": "Ce qu'en pensent nos *habitués*.",
          "brandTagline": "Boucherie · Charcuterie",
          "ctaBannerText": "Pour un lot BBQ, un plateau de fêtes, une pièce pour un repas familial — passez-nous un coup de fil, on prépare tout sur mesure.",
          "ctaBannerTitle": "Une commande *spéciale* ?",
          "footerColonneLabel": "Le commerce",
          "heroCtaPrimaire": "Voir nos créations →",
          "heroEyebrow": [Function],
          "heroLead": "Producteurs locaux, races sélectionnées, maturation maîtrisée. Un savoir-faire au service du goût et du conseil.",
          "heroQuote": "Une bonne viande, c'est d'abord une histoire. Celle d'un éleveur, d'un terroir, et d'un savoir-faire qu'on transmet.",
          "heroQuoteAuthor": "— Le boucher",
          "heroTitle": "La viande *de confiance*, depuis toujours.",
          "histoireLead": "Chaque pièce est sélectionnée, parée et préparée à la main, dans le respect du métier et du goût.",
          "histoireSuptitle": "La maison",
          "histoireTitle": "Un *vrai métier*, des vrais conseils.",
          "navHistoireLabel": "La maison",
          "navUniversLabel": "Nos créations",
          "textePresentation": "Nos viandes viennent d'éleveurs que nous connaissons personnellement, dans un rayon proche de la boucherie. Bœuf de race noble, agneau du terroir, porc fermier. La maturation, le détail, le conseil au comptoir : c'est tout ça qui fait la différence à la fin dans votre assiette.",
          "universSectionIntro": "Chaque pièce est sélectionnée auprès de nos éleveurs partenaires, parée et préparée à la main dans notre laboratoire.",
          "universSectionSuptitle": "Nos créations",
          "universSectionTitle": "Du bœuf, du porc, et bien *plus encore*.",
        },
        "palette": {
          "accent": "#B07539",
          "accentLight": "#CB9258",
          "cream": "#F4EFE8",
          "creamLight": "#FAF6EF",
          "creamWarm": "#E8DDC9",
          "ink": "#1C1612",
          "inkMuted": "#7A6B5E",
          "inkSoft": "#4A3D33",
          "primary": "#7A1F2B",
          "primarySoft": "#A33D4A",
        },
        "universItems": [
          {
            "cat": "Spécialité maison",
            "desc": "Blonde d'Aquitaine et Limousine, maturées 15 à 21 jours sur place. Côtes, faux-filets, entrecôtes — tendreté et goût garantis.",
            "name": "Bœuf maturé",
          },
          {
            "cat": "Élevage local",
            "desc": "Poulets, canards, pintades du Gers. Plein air, élevage lent.",
            "name": "Volaille fermière",
          },
          {
            "cat": "Préparations",
            "desc": "Saucisses, terrines, rillettes, pâtés. Recettes familiales.",
            "name": "Charcuterie maison",
          },
          {
            "cat": "Sur commande",
            "desc": "Lots BBQ, plateaux apéro, pièces pour événements.",
            "name": "Lots & plateaux",
          },
          {
            "cat": "À emporter",
            "desc": "Daubes, blanquettes, lasagnes maison. Prêts à réchauffer.",
            "name": "Plats préparés",
          },
        ],
        "valeursItems": [
          {
            "desc": "Éleveurs sélectionnés, terroir du Gers.",
            "title": "Producteurs locaux",
          },
          {
            "desc": "Saucisses, terrines, plats du jour.",
            "title": "Préparations maison",
          },
          {
            "desc": "15 à 21 jours pour les pièces nobles.",
            "title": "Maturation maîtrisée",
          },
          {
            "desc": "Cuissons, accompagnements, coupes.",
            "title": "Conseils du boucher",
          },
        ],
        "variant": "boucherie",
      }
    `)
  })

  it('restaurant', () => {
    expect(TEMPLATES.restaurant).toMatchInlineSnapshot(`
      {
        "defaults": {
          "avisSectionTitre": "Ce qu'en pensent nos *habitués*.",
          "brandTagline": "Restaurant · Cuisine de saison",
          "ctaBannerText": "Pour une table, un événement ou une commande à emporter, un coup de fil et on s'occupe de tout.",
          "ctaBannerTitle": "Une *réservation* ?",
          "footerColonneLabel": "Le commerce",
          "heroCtaPrimaire": "Voir nos créations →",
          "heroEyebrow": [Function],
          "heroLead": "Des produits frais choisis chaque matin, des recettes simples et soignées, et le plaisir de manger comme à la maison.",
          "heroQuote": "Bien manger, c'est d'abord respecter ce qu'on a dans l'assiette. Le produit, le geste, et le temps qu'il faut.",
          "heroQuoteAuthor": "— Le chef",
          "heroTitle": "Une cuisine *de saison*, faite ici.",
          "histoireLead": "Des produits frais, une carte qui change avec les saisons, et l'envie de bien faire chaque jour.",
          "histoireSuptitle": "La maison",
          "histoireTitle": "Une cuisine *qui a du sens*.",
          "navHistoireLabel": "La maison",
          "navUniversLabel": "Nos créations",
          "textePresentation": "Le marché du matin guide notre carte. Nos producteurs, on les connaît : maraîchers, éleveurs, fromagers, vignerons. Tout vient de la région autant que possible. Les recettes ? Simples, généreuses, soignées — celles qui rassemblent et donnent envie de revenir.",
          "universSectionIntro": "Notre cuisine évolue au rythme des produits du moment. Découvrez nos cinq univers, à déguster sur place ou à emporter.",
          "universSectionSuptitle": "Nos créations",
          "universSectionTitle": "Une carte de saison, et bien *plus encore*.",
        },
        "palette": {
          "accent": "#B5904A",
          "accentLight": "#D0AC6A",
          "cream": "#F4EFE5",
          "creamLight": "#FAF6EC",
          "creamWarm": "#E8DECA",
          "ink": "#1A1814",
          "inkMuted": "#6E6B5E",
          "inkSoft": "#3F3D33",
          "primary": "#3D5C3A",
          "primarySoft": "#577A55",
        },
        "universItems": [
          {
            "cat": "Spécialité maison",
            "desc": "Une cuisine généreuse qui change au fil des saisons. Entrées, plats du terroir, desserts maison.",
            "name": "Notre carte",
          },
          {
            "cat": "Au quotidien",
            "desc": "Une suggestion différente chaque jour, à un prix doux pour le midi.",
            "name": "Plat du jour",
          },
          {
            "cat": "Pratique",
            "desc": "Formule rapide et complète, idéale pour la pause déjeuner.",
            "name": "Menu midi",
          },
          {
            "cat": "Événements",
            "desc": "Repas à thème, soirées dégustation, événements privés.",
            "name": "Soirées spéciales",
          },
          {
            "cat": "Service",
            "desc": "Vos plats favoris à emporter, sur commande.",
            "name": "À emporter",
          },
        ],
        "valeursItems": [
          {
            "desc": "Marché du matin, producteurs locaux.",
            "title": "Produits frais",
          },
          {
            "desc": "Ce qui pousse, ce qui se mange.",
            "title": "Carte de saison",
          },
          {
            "desc": "Du visible, pas de mystère.",
            "title": "Cuisine ouverte",
          },
          {
            "desc": "Comme chez vous, en mieux.",
            "title": "Accueil familial",
          },
        ],
        "variant": "restaurant",
      }
    `)
  })

  it('pizzeria', () => {
    expect(TEMPLATES.pizzeria).toMatchInlineSnapshot(`
      {
        "defaults": {
          "avisSectionTitre": "Ce qu'en pensent nos *habitués*.",
          "brandTagline": "Pizzeria · Cuisine italienne",
          "ctaBannerText": "Pour une pizza, une réservation ou une livraison, un coup de fil et on prépare tout.",
          "ctaBannerTitle": "Une commande *à emporter* ?",
          "footerColonneLabel": "Le commerce",
          "heroCtaPrimaire": "Voir nos créations →",
          "heroEyebrow": [Function],
          "heroLead": "Pâte fraîche pétrie chaque jour, mozzarella di bufala, tomates de qualité. La vraie tradition italienne, à emporter ou sur place.",
          "heroQuote": "La pizza, c'est une question de patience. Une bonne pâte qui repose, un feu qui chauffe, et le geste qui vient avec le temps.",
          "heroQuoteAuthor": "— Le pizzaiolo",
          "heroTitle": "Pizzas *au feu de bois*, à toute heure.",
          "histoireLead": "Une cuisine simple, des produits choisis, et le respect de la tradition napolitaine.",
          "histoireSuptitle": "La maison",
          "histoireTitle": "L'*Italie* à la française.",
          "navHistoireLabel": "La maison",
          "navUniversLabel": "Nos créations",
          "textePresentation": "Notre four à bois chauffe à 450°C. La pâte repose 48h pour développer ses arômes. La mozzarella vient de Campanie, les tomates sont choisies parmi les meilleures variétés italiennes. Pas de raccourcis, juste le vrai goût d'une pizza faite avec passion.",
          "universSectionIntro": "Chaque pizza est faite à la main, cuite au feu de bois en 90 secondes. Découvrez nos cinq univers, à déguster sur place, à emporter ou en livraison.",
          "universSectionSuptitle": "Nos créations",
          "universSectionTitle": "Des pizzas, des antipasti, et bien *plus encore*.",
        },
        "palette": {
          "accent": "#8A8C5A",
          "accentLight": "#A6A879",
          "cream": "#F5F1E8",
          "creamLight": "#FAF7EF",
          "creamWarm": "#EAE0CC",
          "ink": "#1A1612",
          "inkMuted": "#7A6E60",
          "inkSoft": "#4A3F35",
          "primary": "#A8302A",
          "primarySoft": "#C84B43",
        },
        "universItems": [
          {
            "cat": "Spécialité maison",
            "desc": "La Margherita DOP, la Quatre Fromages, la Diavola... Cuites au feu de bois, fines et croustillantes.",
            "name": "Nos pizzas signatures",
          },
          {
            "cat": "Pour commencer",
            "desc": "Burrata, jambon de Parme, légumes grillés. À partager.",
            "name": "Antipasti",
          },
          {
            "cat": "Sucré",
            "desc": "Tiramisu, panna cotta, cannoli siciliens.",
            "name": "Desserts maison",
          },
          {
            "cat": "Pratique",
            "desc": "Toutes nos pizzas commandables au comptoir, prêtes en 15 min.",
            "name": "À emporter",
          },
          {
            "cat": "Service",
            "desc": "Service de livraison sur la zone, midi et soir.",
            "name": "Livraison",
          },
        ],
        "valeursItems": [
          {
            "desc": "Fermentation 48h, levure naturelle.",
            "title": "Pâte fraîche du jour",
          },
          {
            "desc": "Cuisson à 450°C en 90 secondes.",
            "title": "Four à bois",
          },
          {
            "desc": "Importée de Campanie.",
            "title": "Mozzarella di bufala",
          },
          {
            "desc": "Authentiques, sans compromis.",
            "title": "Recettes italiennes",
          },
        ],
        "variant": "pizzeria",
      }
    `)
  })
})

/**
 * Snapshots des presets enrichis V1 non-F2 (Annexes A, B…) et des nouveaux
 * presets V2 livrés au fil des annexes.
 *
 * Différence de régime par rapport à Famille 2 :
 *   - **F2** : toute divergence = régression à investiguer (pas de `-u`).
 *   - **Ici** : à la première livraison d'un preset (Annexe X intégrée),
 *     `npx vitest run lib/maquette/templates/snapshots.test.ts -u` est OK
 *     — c'est l'enrichissement attendu. Après ça, le snapshot devient
 *     anti-régression jusqu'à la prochaine évolution éditoriale délibérée.
 */
describe('TEMPLATES — snapshots Annexe A (Commerces de bouche)', () => {
  it('primeur',       () => { expect(TEMPLATES.primeur).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en pensent nos *fidèles*.",
        "brandTagline": "Primeur · Fruits & légumes",
        "ctaBannerText": "Pour un panier sur mesure, des cagettes pour un événement ou des produits précis, passez nous voir ou appelez.",
        "ctaBannerTitle": "Une commande *spéciale* ?",
        "footerColonneLabel": "Le commerce",
        "heroCtaPrimaire": "Voir nos produits →",
        "heroEyebrow": [Function],
        "heroLead": "Arrivages quotidiens, producteurs locaux, variétés choisies. Le meilleur de ce que la saison nous offre, sans détour.",
        "heroQuote": "Un bon fruit, ça ne triche pas. C'est le sol, le soleil, le moment de la cueillette. Tout le reste, ce sont des artifices.",
        "heroQuoteAuthor": "— Le primeur",
        "heroTitle": "Des fruits et légumes *de saison*, chaque jour.",
        "histoireLead": "Producteurs choisis, étal renouvelé chaque jour, et le plaisir des vraies saveurs.",
        "histoireSuptitle": "La maison",
        "histoireTitle": "Un *primeur* de quartier, à l'ancienne.",
        "navHistoireLabel": "La maison",
        "navUniversLabel": "Nos produits",
        "textePresentation": "On fait le tour des producteurs au plus près, on choisit ce qui est mûr, on rejette ce qui ne l'est pas. Fruits, légumes, herbes fraîches, parfois œufs et fromages : tout passe par notre étal pour que vous trouviez les bons goûts au bon moment. Demandez conseil — on aime parler de ce qu'on vend.",
        "universSectionIntro": "Fruits et légumes choisis chaque matin, producteurs locaux mis à l'honneur. Venez découvrir ce que la saison nous réserve.",
        "universSectionSuptitle": "NOS PRODUITS",
        "universSectionTitle": "Le meilleur de la saison, *jour après jour*.",
      },
      "palette": {
        "accent": "#E8893E",
        "accentLight": "#eea76e",
        "cream": "#F7F5EE",
        "creamLight": "#faf9f5",
        "creamWarm": "#f8dcc5",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#3A6B3F",
        "primarySoft": "#6b906f",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Étal renouvelé chaque matin selon les arrivages. Variétés anciennes mises à l'honneur quand c'est possible.",
          "name": "Fruits & légumes de saison",
        },
        {
          "cat": "Producteurs",
          "desc": "Maraîchers et arboriculteurs locaux privilégiés. Origine affichée, traçabilité claire.",
          "name": "Circuits courts",
        },
        {
          "cat": "Plus que des légumes",
          "desc": "Œufs frais, fromages, herbes, parfois miel ou huiles — selon les producteurs du coin.",
          "name": "Épicerie complémentaire",
        },
        {
          "cat": "Sur commande",
          "desc": "Paniers garnis, cagettes pour réceptions, fruits exotiques sur demande. Délai sous 48h.",
          "name": "Paniers & événements",
        },
        {
          "cat": "Pratique",
          "desc": "Comment cuisiner ce nouveau légume ? Demandez — on a toujours une idée à partager.",
          "name": "Conseils cuisine",
        },
      ],
      "valeursItems": [
        {
          "desc": "Le meilleur de la saison, chaque jour.",
          "title": "Arrivages quotidiens",
        },
        {
          "desc": "Circuits courts, prix justes.",
          "title": "Producteurs locaux",
        },
        {
          "desc": "Variétés anciennes et oubliées.",
          "title": "Fruits et légumes de caractère",
        },
        {
          "desc": "Astuces et idées pour cuisiner de saison.",
          "title": "Conseil cuisine",
        },
      ],
      "variant": "primeur",
    }
  `) })
  it('fromager',      () => { expect(TEMPLATES.fromager).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en pensent nos *fidèles*.",
        "brandTagline": "Fromager · Affineur",
        "ctaBannerText": "Pour un plateau sur mesure, une dégustation à thème ou un fromage précis, un coup de fil et on prépare tout.",
        "ctaBannerTitle": "Un *plateau* pour une occasion ?",
        "footerColonneLabel": "Le commerce",
        "heroCtaPrimaire": "Voir nos fromages →",
        "heroEyebrow": [Function],
        "heroLead": "Sélection chez les producteurs fermiers, affinage maison, conseil dégustation. Pour redécouvrir ce qu'un vrai fromage peut être.",
        "heroQuote": "Un fromage, ça raconte un terroir, un éleveur, une saison. Notre métier, c'est de transmettre ce qu'il a à dire.",
        "heroQuoteAuthor": "— Le fromager",
        "heroTitle": "Des fromages *choisis*, affinés avec soin.",
        "histoireLead": "Des producteurs visités, des fromages affinés sur place, et le plaisir de bien conseiller.",
        "histoireSuptitle": "La maison",
        "histoireTitle": "Une *maison* qui prend le temps.",
        "navHistoireLabel": "La maison",
        "navUniversLabel": "Nos fromages",
        "textePresentation": "On parcourt les fermes, on goûte, on choisit. Les fromages arrivent jeunes, on les laisse mûrir dans nos caves d'affinage jusqu'à leur juste maturité. Au comptoir, on déguste avec vous, on raconte d'où vient chaque pièce, et on compose le plateau qui ira avec votre repas ou votre soirée.",
        "universSectionIntro": "Sélection au plus près des producteurs, affinage maison, conseil dégustation. Pour redécouvrir ce qu'un vrai fromage peut être.",
        "universSectionSuptitle": "NOS FROMAGES",
        "universSectionTitle": "Des artisans, des terroirs, *une passion partagée*.",
      },
      "palette": {
        "accent": "#6B4423",
        "accentLight": "#90735a",
        "cream": "#FBF7EC",
        "creamLight": "#fdfaf4",
        "creamWarm": "#d3c7bd",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#B8861B",
        "primarySoft": "#caa454",
      },
      "universItems": [
        {
          "cat": "Spécialité maison",
          "desc": "Caves d'affinage maison, fromages amenés à juste maturité. Pâtes pressées, molles, persillées, chèvres.",
          "name": "Fromages affinés sur place",
        },
        {
          "cat": "Producteurs",
          "desc": "Sélection chez les producteurs visités, traçabilité totale. Saisons et productions limitées mises en avant.",
          "name": "Fromages fermiers",
        },
        {
          "cat": "Sur mesure",
          "desc": "Composition selon le nombre de convives, le budget et le moment du repas. Conseil dégustation inclus.",
          "name": "Plateaux de fromages",
        },
        {
          "cat": "Accords",
          "desc": "Pains spéciaux, confitures, miels et quelques vins choisis pour accompagner les fromages.",
          "name": "Vins & accompagnements",
        },
        {
          "cat": "Pratique",
          "desc": "On déguste avec vous au comptoir, on explique les origines, on suggère les accords. C'est le métier.",
          "name": "Conseil & dégustation",
        },
      ],
      "valeursItems": [
        {
          "desc": "Le temps fait la richesse des saveurs.",
          "title": "Affinage maison",
        },
        {
          "desc": "Sélection rigoureuse, traçabilité totale.",
          "title": "Producteurs fermiers",
        },
        {
          "desc": "Composés selon vos envies et budgets.",
          "title": "Plateaux sur mesure",
        },
        {
          "desc": "Accords vins, ordres de dégustation.",
          "title": "Conseil dégustation",
        },
      ],
      "variant": "fromager",
    }
  `) })
  it('caviste',       () => { expect(TEMPLATES.caviste).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en pensent nos *amateurs*.",
        "brandTagline": "Caviste · Vins & spiritueux",
        "ctaBannerText": "Pour un anniversaire, un cadeau, une cave à constituer ou un événement, un coup de fil et on prépare la sélection.",
        "ctaBannerTitle": "Une *occasion* à fêter ?",
        "footerColonneLabel": "La cave",
        "heroCtaPrimaire": "Voir notre cave →",
        "heroEyebrow": [Function],
        "heroLead": "Sélection issue de visites en domaine, accent sur les vignerons engagés. Pour les découvertes du quotidien comme pour les grandes occasions.",
        "heroQuote": "Un vin, c'est un vigneron, un terroir, un millésime. Notre boulot, c'est de raconter cette histoire au moment de la dégustation.",
        "heroQuoteAuthor": "— Le caviste",
        "heroTitle": "Des vignerons rencontrés, *des vins qui racontent*.",
        "histoireLead": "Des vignerons connus, des sélections honnêtes, et le plaisir de partager une bouteille.",
        "histoireSuptitle": "La cave",
        "histoireTitle": "Une *cave* à hauteur d'amateur.",
        "navHistoireLabel": "La cave",
        "navUniversLabel": "Notre cave",
        "textePresentation": "On va dans les domaines, on goûte avec les vignerons, on choisit. La cave couvre toutes les régions de France et quelques pépites étrangères, avec une préférence assumée pour les vignerons engagés, en bio ou en biodynamie. Au comptoir, on conseille selon votre repas, votre budget ou simplement votre envie de découvrir.",
        "universSectionIntro": "Sélection issue de visites en domaine, accent mis sur les vignerons engagés. Découvertes accessibles ou belles bouteilles pour les grandes occasions.",
        "universSectionSuptitle": "NOTRE CAVE",
        "universSectionTitle": "Des vignerons rencontrés, *des vins qui racontent*.",
      },
      "palette": {
        "accent": "#B89968",
        "accentLight": "#cab38e",
        "cream": "#F5F0E8",
        "creamLight": "#f9f6f1",
        "creamWarm": "#eae0d2",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#5C1F2E",
        "primarySoft": "#855762",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Vins rouges, blancs, rosés et effervescents. Régions françaises principales et quelques découvertes étrangères.",
          "name": "Notre sélection",
        },
        {
          "cat": "Engagement",
          "desc": "Bio, biodynamie, vignerons en conversion : section dédiée aux producteurs qui font sens.",
          "name": "Vignerons engagés",
        },
        {
          "cat": "Découvertes",
          "desc": "Pépites repérées récemment, petits domaines, millésimes à goûter. Renouvellement régulier.",
          "name": "Nouveautés du mois",
        },
        {
          "cat": "Plus que du vin",
          "desc": "Whiskies, rhums, gins choisis avec la même exigence. Quelques bières artisanales locales.",
          "name": "Spiritueux & bières",
        },
        {
          "cat": "Pratique",
          "desc": "Conseil au comptoir, soirées dégustation thématiques, possibilité de mise sous cave.",
          "name": "Conseils & dégustations",
        },
      ],
      "valeursItems": [
        {
          "desc": "Vins choisis chez les vignerons.",
          "title": "Sélection passionnée",
        },
        {
          "desc": "Selon vos goûts, vos occasions, votre budget.",
          "title": "Conseil sur mesure",
        },
        {
          "desc": "Nouveautés et pépites mises en avant.",
          "title": "Découvertes régulières",
        },
        {
          "desc": "Rendez-vous gourmands toute l'année.",
          "title": "Dégustations",
        },
      ],
      "variant": "caviste",
    }
  `) })
  it('bar_cafe',      () => { expect(TEMPLATES.bar_cafe).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en pensent nos *habitués*.",
        "brandTagline": "Bar · Café & brasserie",
        "ctaBannerText": "Pour une table le midi, une soirée entre amis ou la privatisation d'un coin du bar, un message et on s'organise.",
        "ctaBannerTitle": "Une *réservation* ?",
        "footerColonneLabel": "Le commerce",
        "heroCtaPrimaire": "Voir l'ardoise →",
        "heroEyebrow": [Function],
        "heroLead": "Cafés bien faits, boissons soignées, planches à partager. Un lieu où on a envie de s'arrêter, de revenir, et où on vous reconnaît.",
        "heroQuote": "Le bistrot, ce n'est pas juste un endroit où on consomme. C'est un endroit où on se pose, où on parle, où on prend le temps.",
        "heroQuoteAuthor": "— Le patron",
        "heroTitle": "Un *bistrot* du matin au soir.",
        "histoireLead": "Cafés choisis, ardoise du moment, et l'envie d'un lieu qui rassemble.",
        "histoireSuptitle": "La maison",
        "histoireTitle": "Un *bistrot* qui fait place.",
        "navHistoireLabel": "La maison",
        "navUniversLabel": "L'ardoise",
        "textePresentation": "Le matin, c'est café et viennoiseries. Le midi, formule simple à l'ardoise. L'après-midi, on s'installe pour bosser ou pour discuter. Le soir, planches, vins et bières artisanales. Une seule règle : du soin dans ce qu'on sert et un vrai accueil — qu'on vienne pour cinq minutes ou pour la soirée.",
        "universSectionIntro": "Café du matin au tard du soir, planches à partager, formules midi simples et soignées. L'ardoise change au fil des envies et de ce que les producteurs nous apportent.",
        "universSectionSuptitle": "L'ARDOISE",
        "universSectionTitle": "Des cafés, des boissons, *et un peu de cuisine*.",
      },
      "palette": {
        "accent": "#C8924D",
        "accentLight": "#d6ad7a",
        "cream": "#F7F1E8",
        "creamLight": "#faf7f1",
        "creamWarm": "#efdeca",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#2C2520",
        "primarySoft": "#615c58",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Expresso, allongé, latte, thés en vrac, jus frais, sirops maison. Cafés de torréfacteurs choisis.",
          "name": "Cafés & boissons",
        },
        {
          "cat": "Le midi",
          "desc": "Plat unique ou entrée-plat, simple et bien fait, à un prix doux. Change tous les jours.",
          "name": "Formule du jour",
        },
        {
          "cat": "L'apéro",
          "desc": "Charcuteries, fromages, légumes marinés, à partager autour d'un verre. Soir et fin d'après-midi.",
          "name": "Planches & tapas",
        },
        {
          "cat": "Choisis",
          "desc": "Petits domaines, brasseries artisanales locales, sélection régulière sur ardoise.",
          "name": "Vins, bières & spiritueux",
        },
        {
          "cat": "Pratique",
          "desc": "Anniversaires, after-work, soirées privées : on peut adapter le lieu selon vos envies.",
          "name": "Privatisation & événements",
        },
      ],
      "valeursItems": [
        {
          "desc": "Torréfacteurs choisis, mouture du jour.",
          "title": "Cafés sélectionnés",
        },
        {
          "desc": "Boissons et petite restauration soignées.",
          "title": "Ardoise du moment",
        },
        {
          "desc": "Pour s'arrêter, travailler, se retrouver.",
          "title": "Lieu vivant",
        },
        {
          "desc": "Comme à la maison, mais pas chez soi.",
          "title": "Service attentif",
        },
      ],
      "variant": "bar_cafe",
    }
  `) })
  it('traiteur',      () => { expect(TEMPLATES.traiteur).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *clients*.",
        "brandTagline": "Traiteur · Événements",
        "ctaBannerText": "Pour un devis, un échange de cadrage ou simplement explorer une idée, appelez-nous : on prend le temps qu'il faut.",
        "ctaBannerTitle": "Un *événement* à venir ?",
        "footerColonneLabel": "Le commerce",
        "heroCtaPrimaire": "Voir nos prestations →",
        "heroEyebrow": [Function],
        "heroLead": "Cocktails, repas, buffets, plateaux à emporter. Cuisine maison, produits frais, et un accompagnement projet pour que tout se passe bien.",
        "heroQuote": "Un repas d'événement, ça se prépare longtemps avant. Le menu, les quantités, le service — tout doit être pensé pour que vous, vous profitiez.",
        "heroQuoteAuthor": "— Le traiteur",
        "heroTitle": "Vos événements, *cuisinés avec soin*.",
        "histoireLead": "Sur mesure, fait maison, et le souci du détail à toutes les étapes.",
        "histoireSuptitle": "La maison",
        "histoireTitle": "Une *cuisine* au service de vos moments.",
        "navHistoireLabel": "La maison",
        "navUniversLabel": "Nos prestations",
        "textePresentation": "On part toujours d'un échange avec vous : le contexte, le nombre d'invités, les envies, le budget. Le menu se construit ensemble, à partir de produits frais sourcés au plus près. Notre atelier prépare tout en amont, on livre et on dresse au lieu de l'événement. L'objectif : que vous puissiez profiter de vos invités sans vous soucier de rien.",
        "universSectionIntro": "Cocktails, repas assis, buffets, plateaux à emporter : chaque prestation est conçue avec vous, à partir de produits frais et de recettes maison. Devis personnalisé, conseil amont, exécution soignée.",
        "universSectionSuptitle": "NOS PRESTATIONS",
        "universSectionTitle": "De l'apéro à la noce, *on cuisine vos événements*.",
      },
      "palette": {
        "accent": "#C9A24B",
        "accentLight": "#d7b978",
        "cream": "#FAF5EC",
        "creamLight": "#fcf9f4",
        "creamWarm": "#efe3c9",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#5C3A2E",
        "primarySoft": "#856b62",
      },
      "universItems": [
        {
          "cat": "Spécialité maison",
          "desc": "Pièces salées et sucrées, présentation soignée, quantités calibrées pour votre nombre d'invités.",
          "name": "Cocktails & buffets",
        },
        {
          "cat": "Grands moments",
          "desc": "Menu complet sur mesure, accompagnement amont, dressage et service le jour J selon formule.",
          "name": "Mariages & cérémonies",
        },
        {
          "cat": "Entreprise",
          "desc": "Plateaux repas, déjeuners de travail, pauses gourmandes pour formations et événements pro.",
          "name": "Repas pro & séminaires",
        },
        {
          "cat": "À emporter",
          "desc": "Plateaux pour anniversaires, repas en famille, week-ends. Sur commande, à retirer ou à livrer.",
          "name": "Plateaux & box",
        },
        {
          "cat": "Pratique",
          "desc": "Premier échange gratuit pour cadrer votre projet, devis détaillé sous quelques jours.",
          "name": "Devis & rendez-vous",
        },
      ],
      "valeursItems": [
        {
          "desc": "Menu pensé pour votre événement.",
          "title": "Sur mesure",
        },
        {
          "desc": "Tout préparé dans notre atelier.",
          "title": "Cuisine maison",
        },
        {
          "desc": "Livraison, dressage, parfois service à table.",
          "title": "Service complet",
        },
        {
          "desc": "Devis clair et accompagnement projet.",
          "title": "Conseil amont",
        },
      ],
      "variant": "traiteur",
    }
  `) })
  it('chocolatier',   () => { expect(TEMPLATES.chocolatier).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en pensent nos *gourmands*.",
        "brandTagline": "Chocolatier · Artisan confiseur",
        "ctaBannerText": "Pour un événement, un cadeau personnalisé, un ballotin sur mesure ou de gros volumes, un coup de fil et on prépare tout.",
        "ctaBannerTitle": "Une *commande spéciale* ?",
        "footerColonneLabel": "Le commerce",
        "heroCtaPrimaire": "Voir nos créations →",
        "heroEyebrow": [Function],
        "heroLead": "Pralinés, ganaches, moulages, confiseries de saison. Cacaos choisis, recettes maison, et le geste qui fait la différence.",
        "heroQuote": "Un bon chocolat, c'est d'abord un bon cacao. Ensuite c'est de la précision, du temps, et l'envie de transmettre ce moment de plaisir.",
        "heroQuoteAuthor": "— Le chocolatier",
        "heroTitle": "Des chocolats *faits main*, du cacao à la bouchée.",
        "histoireLead": "Cacaos d'origines, recettes maison, et le plaisir du geste précis.",
        "histoireSuptitle": "La maison",
        "histoireTitle": "Un *atelier* de chocolatier, à l'ancienne.",
        "navHistoireLabel": "La maison",
        "navUniversLabel": "Nos créations",
        "textePresentation": "L'atelier travaille des cacaos d'origines choisies : Madagascar, Pérou, Équateur. Les couvertures sont tempérées sur place, les pralinés torréfiés à façon, les ganaches montées à la main. Pour chaque saison, des collections renouvelées : moulages de Pâques, ballotins de Noël, confiseries d'été. Tout est fait ici, dans le respect du temps et du goût.",
        "universSectionIntro": "Pralinés, ganaches, moulages, confiseries de saison : chaque pièce sort de notre atelier, travaillée à la main avec des cacaos d'origines choisies. Pour offrir, pour la maison, ou pour les grandes occasions.",
        "universSectionSuptitle": "NOS CRÉATIONS",
        "universSectionTitle": "Du cacao, des recettes, *du fait main*.",
      },
      "palette": {
        "accent": "#C9A861",
        "accentLight": "#d7be89",
        "cream": "#FAF5EC",
        "creamLight": "#fcf9f4",
        "creamWarm": "#efe5d0",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#3D2317",
        "primarySoft": "#6e5a51",
      },
      "universItems": [
        {
          "cat": "Spécialité maison",
          "desc": "Sélections maison de pralinés et ganaches, présentation soignée. À offrir ou à se faire offrir.",
          "name": "Ballotins & assortiments",
        },
        {
          "cat": "Selon la saison",
          "desc": "Pâques, fêtes de fin d'année, Saint-Valentin : créations renouvelées au rythme du calendrier.",
          "name": "Collections saisonnières",
        },
        {
          "cat": "Plus que du chocolat",
          "desc": "Pâtes de fruits, calissons, guimauves, caramels — recettes traditionnelles travaillées sur place.",
          "name": "Confiseries maison",
        },
        {
          "cat": "Sur commande",
          "desc": "Logos en chocolat, pièces événementielles, grosses quantités. Délai sur devis.",
          "name": "Pièces personnalisées",
        },
        {
          "cat": "Pratique",
          "desc": "Au comptoir, on raconte les origines, on fait goûter, on conseille selon vos envies.",
          "name": "Conseil & dégustation",
        },
      ],
      "valeursItems": [
        {
          "desc": "Origines sélectionnées, traçabilité claire.",
          "title": "Cacao choisi",
        },
        {
          "desc": "Chaque pièce moulée et garnie sur place.",
          "title": "Fait à la main",
        },
        {
          "desc": "Pralinés, ganaches, gourmandises de saison.",
          "title": "Recettes maison",
        },
        {
          "desc": "Pour offrir ou pour vous faire plaisir.",
          "title": "Conseil dégustation",
        },
      ],
      "variant": "chocolatier",
    }
  `) })
  it('epicerie_fine', () => { expect(TEMPLATES.epicerie_fine).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en pensent nos *fidèles*.",
        "brandTagline": "Épicerie fine · Producteurs choisis",
        "ctaBannerText": "Pour un cadeau, un panier événement ou une commande d'entreprise, on compose selon votre budget et vos envies. Un coup de fil suffit.",
        "ctaBannerTitle": "Un *coffret* à composer ?",
        "footerColonneLabel": "Le commerce",
        "heroCtaPrimaire": "Voir nos produits →",
        "heroEyebrow": [Function],
        "heroLead": "Producteurs visités, spécialités locales, pépites du monde entier. Une épicerie où chaque produit a son histoire et son producteur.",
        "heroQuote": "Choisir un produit, c'est choisir une rencontre. Un producteur, une terre, un savoir-faire. C'est tout ça qu'on met dans nos rayons.",
        "heroQuoteAuthor": "— L'épicier",
        "heroTitle": "Le terroir *en boutique*, dans l'assiette.",
        "histoireLead": "Producteurs rencontrés, produits choisis, et le plaisir de partager nos coups de cœur.",
        "histoireSuptitle": "La maison",
        "histoireTitle": "Une *épicerie* qui raconte le terroir.",
        "navHistoireLabel": "La maison",
        "navUniversLabel": "Nos produits",
        "textePresentation": "Foie gras, conserves, huiles, vinaigres, miels, confitures, vins locaux : la boutique met le terroir local au premier plan, complété par des sélections venues d'autres régions et de quelques pays voisins. On rencontre les producteurs, on goûte, on rapporte ce qui nous a plu. Au comptoir, on fait déguster, on raconte, on conseille selon vos goûts ou pour vos cadeaux.",
        "universSectionIntro": "Conserves, huiles, miels, épices, vins, douceurs : chaque référence est sélectionnée chez des producteurs rencontrés. Le terroir local est mis à l'honneur, complété par quelques pépites venues d'ailleurs.",
        "universSectionSuptitle": "NOS PRODUITS",
        "universSectionTitle": "Des produits *choisis*, des producteurs visités.",
      },
      "palette": {
        "accent": "#B8895C",
        "accentLight": "#caa785",
        "cream": "#FAF6EC",
        "creamLight": "#fcfaf4",
        "creamWarm": "#eadcce",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#3F4A2F",
        "primarySoft": "#6f7763",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Conserves, foie gras, charcuteries sèches, fromages, confitures et miels de producteurs locaux.",
          "name": "Spécialités du terroir",
        },
        {
          "cat": "Sélections",
          "desc": "Huiles d'olive de domaines choisis, vinaigres balsamiques, épices et condiments choisis avec exigence.",
          "name": "Huiles, vinaigres & épices",
        },
        {
          "cat": "Boissons",
          "desc": "Sélection de vignerons régionaux, armagnacs, liqueurs et apéritifs artisanaux du Sud-Ouest.",
          "name": "Vins & spiritueux locaux",
        },
        {
          "cat": "Cadeaux",
          "desc": "Composés selon votre budget, dans un emballage soigné. Anniversaires, fêtes, cadeaux d'entreprise.",
          "name": "Coffrets sur mesure",
        },
        {
          "cat": "Pratique",
          "desc": "On fait goûter au comptoir, on raconte les producteurs, on conseille les associations.",
          "name": "Dégustations & conseil",
        },
      ],
      "valeursItems": [
        {
          "desc": "Visites en ferme, sélection rigoureuse.",
          "title": "Producteurs choisis",
        },
        {
          "desc": "Spécialités locales mises à l'honneur.",
          "title": "Produits du terroir",
        },
        {
          "desc": "Composés selon vos envies.",
          "title": "Coffrets cadeaux",
        },
        {
          "desc": "On fait goûter avant d'acheter.",
          "title": "Conseil & dégustation",
        },
      ],
      "variant": "epicerie_fine",
    }
  `) })
})

describe('TEMPLATES — snapshots Annexe B (Bâtiment & artisanat)', () => {
  it('menuisier',   () => { expect(TEMPLATES.menuisier).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *clients*.",
        "brandTagline": "Menuisier · Agencement",
        "ctaBannerText": "Pour un meuble, un agencement complet, un escalier ou une terrasse : passez nous voir à l'atelier ou appelez-nous pour un rendez-vous.",
        "ctaBannerTitle": "Un *projet* sur mesure ?",
        "footerColonneLabel": "L'atelier",
        "heroCtaPrimaire": "Voir nos réalisations →",
        "heroEyebrow": [Function],
        "heroLead": "Mobilier, agencements, escaliers, terrasses. Conception sur mesure, fabrication en atelier, pose soignée chez vous.",
        "heroQuote": "Le bois, ça se respecte. Choisir la bonne essence, lire le fil, prévoir comment ça va vieillir. Le métier commence là.",
        "heroQuoteAuthor": "— Le menuisier",
        "heroTitle": "Du bois, *du sur mesure*, des idées concrétisées.",
        "histoireLead": "Essences choisies, fabrication maîtrisée, et le souci de la finition.",
        "histoireSuptitle": "L'atelier",
        "histoireTitle": "Un *atelier* où chaque projet compte.",
        "navHistoireLabel": "L'atelier",
        "navUniversLabel": "Nos réalisations",
        "textePresentation": "On part toujours d'un échange avec vous : visite, plans, conseil sur les essences. La fabrication se fait dans notre atelier, où chaque pièce est conçue pour s'intégrer à votre espace. Mobilier sur mesure, dressings, escaliers, terrasses : le bois est choisi pour durer, les assemblages pour tenir. La pose chez vous se fait avec le même soin.",
        "universSectionIntro": "Mobilier, agencements, escaliers, terrasses : chaque projet est conçu sur mesure et fabriqué dans notre atelier. Le bois, on en connaît un rayon.",
        "universSectionSuptitle": "NOS RÉALISATIONS",
        "universSectionTitle": "Du bois, des idées, *du sur mesure*.",
      },
      "palette": {
        "accent": "#C9A678",
        "accentLight": "#d7bc9a",
        "cream": "#FAF5ED",
        "creamLight": "#fcf9f4",
        "creamWarm": "#efe4d7",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#5C3A21",
        "primarySoft": "#856b59",
      },
      "universItems": [
        {
          "cat": "Spécialité maison",
          "desc": "Bibliothèques, dressings, bureaux, tables : conçus pour votre espace, fabriqués dans notre atelier.",
          "name": "Mobilier sur mesure",
        },
        {
          "cat": "Agencement",
          "desc": "Cuisine intégrale ou rangements complexes : étude, fabrication, pose. Avec ou sans plan de travail.",
          "name": "Cuisines & rangements",
        },
        {
          "cat": "Structure",
          "desc": "Escaliers droits, hélicoïdaux, en colimaçon. Verrières intérieures bois ou mixtes. Étude technique incluse.",
          "name": "Escaliers & verrières",
        },
        {
          "cat": "Extérieur",
          "desc": "Terrasses bois, bardages, claustras, pergolas. Essences résistantes choisies pour durer.",
          "name": "Terrasses & bardages",
        },
        {
          "cat": "Pratique",
          "desc": "Visite chez vous, devis détaillé, conception en atelier puis pose soignée. Suivi jusqu'à la livraison.",
          "name": "Devis & atelier",
        },
      ],
      "valeursItems": [
        {
          "desc": "Conçu et fabriqué selon vos espaces.",
          "title": "Sur mesure",
        },
        {
          "desc": "Essences choisies pour la durée.",
          "title": "Bois sélectionnés",
        },
        {
          "desc": "Fabrication maîtrisée de A à Z.",
          "title": "Atelier local",
        },
        {
          "desc": "Finitions impeccables, chantier propre.",
          "title": "Pose soignée",
        },
      ],
      "variant": "menuisier",
    }
  `) })
  it('plombier',    () => { expect(TEMPLATES.plombier).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *clients*.",
        "brandTagline": "Plombier · Chauffagiste",
        "ctaBannerText": "Pour un dépannage rapide, un devis de salle de bains ou le remplacement d'un chauffe-eau, appelez-nous : on s'organise.",
        "ctaBannerTitle": "Une *fuite* ou un projet ?",
        "footerColonneLabel": "L'entreprise",
        "heroCtaPrimaire": "Voir nos interventions →",
        "heroEyebrow": [Function],
        "heroLead": "Fuites, chauffage, sanitaires, raccordements. Diagnostic clair, devis honnête, intervention rapide. Et un chantier laissé propre.",
        "heroQuote": "Un bon plombier, c'est celui qui répare une fois bien, pas trois fois mal. Le temps qu'on prend au diagnostic, on le gagne ensuite.",
        "heroQuoteAuthor": "— Le plombier",
        "heroTitle": "Du dépannage à l'installation, *on s'occupe de tout*.",
        "histoireLead": "Diagnostic précis, devis clair, intervention soignée — sans facture qui dérape.",
        "histoireSuptitle": "L'entreprise",
        "histoireTitle": "Une *entreprise* qui répare bien du premier coup.",
        "navHistoireLabel": "L'entreprise",
        "navUniversLabel": "Nos interventions",
        "textePresentation": "On intervient en dépannage et en installation : fuites d'eau, chauffe-eau, chaudières, sanitaires, raccordements neufs. Avant chaque intervention, diagnostic et devis annoncé. Les marques utilisées sont choisies pour leur fiabilité, l'installation est faite dans les règles de l'art, et le chantier est laissé propre. Pour les urgences, on s'organise pour intervenir vite.",
        "universSectionIntro": "Fuites, chauffage, salles de bains, raccordements : nous intervenons sur tous types de chantiers. Devis clair en amont, travail propre sur place.",
        "universSectionSuptitle": "NOS INTERVENTIONS",
        "universSectionTitle": "Du dépannage à l'installation, *on s'occupe de tout*.",
      },
      "palette": {
        "accent": "#6B7A85",
        "accentLight": "#909ba4",
        "cream": "#F2F4F6",
        "creamLight": "#f7f8fa",
        "creamWarm": "#d3d7da",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#1E4A6B",
        "primarySoft": "#567790",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Fuites, débouchage, robinetterie, chauffe-eau. Intervention rapide, diagnostic clair, réparation durable.",
          "name": "Dépannage plomberie",
        },
        {
          "cat": "Installation",
          "desc": "Pose de sanitaires neufs, salles de bains complètes, raccordements. Conseil sur les équipements adaptés.",
          "name": "Sanitaires & salles d'eau",
        },
        {
          "cat": "Chauffage",
          "desc": "Installation, remplacement, entretien. Gaz, électrique, thermodynamique : conseil énergie inclus.",
          "name": "Chaudières & chauffe-eau",
        },
        {
          "cat": "Rénovation",
          "desc": "Refonte complète des réseaux d'eau, mise aux normes, raccordements pour rénovation lourde.",
          "name": "Réseaux & raccordements",
        },
        {
          "cat": "Pratique",
          "desc": "Devis clair avant intervention, contrat d'entretien possible, dépannage rapide en cas de fuite.",
          "name": "Devis & urgence",
        },
      ],
      "valeursItems": [
        {
          "desc": "Diagnostic et solutions sans tarder.",
          "title": "Intervention rapide",
        },
        {
          "desc": "Tout est annoncé avant de commencer.",
          "title": "Devis clair",
        },
        {
          "desc": "Chantier respecté, lieux laissés nets.",
          "title": "Travail propre",
        },
        {
          "desc": "Marques fiables, installation pérenne.",
          "title": "Garantie matériel",
        },
      ],
      "variant": "plombier",
    }
  `) })
  it('electricien', () => { expect(TEMPLATES.electricien).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *clients*.",
        "brandTagline": "Électricien · Domotique",
        "ctaBannerText": "Pour un dépannage, une mise aux normes ou l'étude d'une installation neuve, appelez-nous : on revient vite avec une réponse claire.",
        "ctaBannerTitle": "Une *panne* ou un projet ?",
        "footerColonneLabel": "L'entreprise",
        "heroCtaPrimaire": "Voir nos prestations →",
        "heroEyebrow": [Function],
        "heroLead": "Dépannage, mise aux normes, rénovation, domotique. Travail dans les règles, devis détaillé, et un conseil énergie qui fait économiser.",
        "heroQuote": "L'électricité, ça ne pardonne pas l'approximation. C'est pour ça qu'on prend le temps de bien faire, et qu'on garantit ce qu'on installe.",
        "heroQuoteAuthor": "— L'électricien",
        "heroTitle": "Une installation *aux normes*, sans approximation.",
        "histoireLead": "Normes respectées, matériel fiable, et le souci d'expliquer ce qu'on installe.",
        "histoireSuptitle": "L'entreprise",
        "histoireTitle": "Une *entreprise* qui ne lésine pas sur la sécurité.",
        "navHistoireLabel": "L'entreprise",
        "navUniversLabel": "Nos prestations",
        "textePresentation": "On intervient sur tous types de chantiers : dépannage, mise aux normes (consuel), rénovation complète, neuf, domotique. Avant chaque intervention, diagnostic et devis détaillé. Le matériel utilisé est choisi pour sa fiabilité, l'installation est faite dans les règles, et on prend le temps d'expliquer ce qui a été fait. Pour les rénovations énergétiques, on conseille les solutions économes adaptées à votre logement.",
        "universSectionIntro": "Du tableau électrique à l'installation domotique, nous intervenons dans les règles de l'art. Devis détaillé, conseils énergie, garantie sur le travail.",
        "universSectionSuptitle": "NOS PRESTATIONS",
        "universSectionTitle": "Mise aux normes, dépannage, rénovation, *tout est possible*.",
      },
      "palette": {
        "accent": "#E8B934",
        "accentLight": "#eecb67",
        "cream": "#F5F4EE",
        "creamLight": "#f9f8f5",
        "creamWarm": "#f8eac2",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#1A2540",
        "primarySoft": "#535c70",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Neuf, rénovation, extension. Tableaux électriques, circuits, prises, éclairage. Travaux conformes NF C 15-100.",
          "name": "Installation électrique",
        },
        {
          "cat": "Sécurité",
          "desc": "Audit installation existante, mise en sécurité, consuel pour vente ou rénovation lourde.",
          "name": "Mise aux normes",
        },
        {
          "cat": "Dépannage",
          "desc": "Disjonctions répétées, court-circuits, prises HS, panne complète. Diagnostic rapide, réparation durable.",
          "name": "Pannes & urgences",
        },
        {
          "cat": "Confort",
          "desc": "Volets roulants connectés, éclairage automatisé, thermostats intelligents. Solutions adaptées à votre quotidien.",
          "name": "Domotique & éclairage",
        },
        {
          "cat": "Pratique",
          "desc": "Devis détaillé sous quelques jours, garantie sur l'installation, conseil énergie pour faire des économies.",
          "name": "Devis & garantie",
        },
      ],
      "valeursItems": [
        {
          "desc": "Installations aux dernières exigences.",
          "title": "Normes respectées",
        },
        {
          "desc": "Détaillé, sans surprise.",
          "title": "Devis transparent",
        },
        {
          "desc": "Pour les urgences comme pour le suivi.",
          "title": "Dépannage rapide",
        },
        {
          "desc": "Solutions économes et durables.",
          "title": "Conseil énergie",
        },
      ],
      "variant": "electricien",
    }
  `) })
  it('peintre',     () => { expect(TEMPLATES.peintre).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *clients*.",
        "brandTagline": "Peintre · Décoration",
        "ctaBannerText": "Pour une pièce, un appartement complet ou une façade extérieure, un appel ou un message et on vient voir.",
        "ctaBannerTitle": "Un *chantier* à étudier ?",
        "footerColonneLabel": "L'entreprise",
        "heroCtaPrimaire": "Voir nos chantiers →",
        "heroEyebrow": [Function],
        "heroLead": "Intérieur, extérieur, décoration. Préparation des supports, conseil couleurs, application soignée — un travail visible quand il est bien fait.",
        "heroQuote": "Une bonne peinture, ça commence avant d'ouvrir le pot. Préparation, sous-couches, conditions de séchage : tout compte si on veut que ça tienne.",
        "heroQuoteAuthor": "— Le peintre",
        "heroTitle": "Un rendu *qui dure*, du sol au plafond.",
        "histoireLead": "Préparation soignée, application précise, et le respect des lieux pendant le chantier.",
        "histoireSuptitle": "L'entreprise",
        "histoireTitle": "Une *entreprise* qui finit ce qu'elle commence.",
        "navHistoireLabel": "L'entreprise",
        "navUniversLabel": "Nos chantiers",
        "textePresentation": "On commence par préparer : ponçage, rebouchage, sous-couches adaptées. C'est invisible mais c'est ce qui fait que la peinture tient. Ensuite l'application : peintures choisies pour leur rendu et leur durabilité, finitions soignées, raccords nets. Pendant le chantier, on protège le mobilier, on bâche les sols, on nettoie en fin de journée. À la fin, un rendu qui se voit et un chantier qu'on a presque oublié.",
        "universSectionIntro": "Préparation des supports, conseil couleurs, application soignée : chaque chantier reçoit la même attention. Le rendu commence avant même de peindre.",
        "universSectionSuptitle": "NOS CHANTIERS",
        "universSectionTitle": "Intérieur, extérieur, *des finitions qui font la différence*.",
      },
      "palette": {
        "accent": "#2C5F6F",
        "accentLight": "#618793",
        "cream": "#F3F2EE",
        "creamLight": "#f8f7f5",
        "creamWarm": "#c0cfd4",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#3A4550",
        "primarySoft": "#6b747c",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Murs, plafonds, boiseries. Préparation complète, choix de finition adapté à chaque pièce.",
          "name": "Peinture intérieure",
        },
        {
          "cat": "Extérieur",
          "desc": "Ravalement, traitement bois extérieurs, peintures spéciales résistantes aux intempéries.",
          "name": "Façades & boiseries ext.",
        },
        {
          "cat": "Décoration",
          "desc": "Patines, effets matières, peintures décoratives, papiers peints. Pour donner du caractère aux pièces.",
          "name": "Décors & finitions",
        },
        {
          "cat": "Rénovation",
          "desc": "Reprise de fissures, traitement humidité, décapage, ponçage de plafonds anciens. Les supports complexes.",
          "name": "Préparation lourde",
        },
        {
          "cat": "Pratique",
          "desc": "Visite, échantillons et nuanciers, conseil couleurs, devis détaillé. Engagement sur la qualité du rendu.",
          "name": "Conseil & devis",
        },
      ],
      "valeursItems": [
        {
          "desc": "Le rendu commence avant la peinture.",
          "title": "Préparation soignée",
        },
        {
          "desc": "Harmonies adaptées à vos pièces.",
          "title": "Conseil couleurs",
        },
        {
          "desc": "Peintures durables, finitions impeccables.",
          "title": "Produits de qualité",
        },
        {
          "desc": "Bâches, masquage, nettoyage en fin de journée.",
          "title": "Chantier propre",
        },
      ],
      "variant": "peintre",
    }
  `) })
  it('paysagiste',  () => { expect(TEMPLATES.paysagiste).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *clients*.",
        "brandTagline": "Paysagiste · Jardins & terrasses",
        "ctaBannerText": "Pour un projet complet, une création ponctuelle ou un contrat d'entretien, on vient voir le terrain et on en parle.",
        "ctaBannerTitle": "Un *jardin* à imaginer ?",
        "footerColonneLabel": "L'entreprise",
        "heroCtaPrimaire": "Voir nos réalisations →",
        "heroEyebrow": [Function],
        "heroLead": "Création, plantation, terrasses, entretien. On part de votre terrain, de vos envies, et on imagine un jardin qui vit dans le temps.",
        "heroQuote": "Un jardin, ce n'est pas une décoration figée. C'est un vivant qui change avec les saisons, et qui doit pouvoir évoluer avec ceux qui l'habitent.",
        "heroQuoteAuthor": "— Le paysagiste",
        "heroTitle": "Un jardin *qui vous ressemble*, qui vit avec vous.",
        "histoireLead": "Conception adaptée, végétaux choisis pour durer, et le souci du jardin qui évolue bien.",
        "histoireSuptitle": "L'entreprise",
        "histoireTitle": "Une *entreprise* qui pense le jardin sur le long terme.",
        "navHistoireLabel": "L'entreprise",
        "navUniversLabel": "Nos réalisations",
        "textePresentation": "Chaque projet part d'une visite : analyser le terrain, l'orientation, le sol, vos usages et vos envies. La conception suit : plans, choix des végétaux, matériaux pour terrasses et chemins. Plantation et création se font ensuite, avec des végétaux adaptés au climat et au sol pour qu'ils prennent vraiment. Pour l'entretien : contrats annuels ou interventions ponctuelles selon ce qui vous arrange.",
        "universSectionIntro": "Conception, plantation, terrasses, entretien : chaque projet part de vos envies et de la réalité du terrain. Pour un jardin qui vit avec vous.",
        "universSectionSuptitle": "NOS RÉALISATIONS",
        "universSectionTitle": "Un jardin à votre image, *pensé pour durer*.",
      },
      "palette": {
        "accent": "#B85C3C",
        "accentLight": "#ca856d",
        "cream": "#F3F1EA",
        "creamLight": "#f8f7f2",
        "creamWarm": "#eacec5",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#2F4A2F",
        "primarySoft": "#637763",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Conception complète, plantations, gazon, allées, éclairage. De la planche au jardin réalisé.",
          "name": "Création de jardin",
        },
        {
          "cat": "Aménagement",
          "desc": "Terrasses bois ou pierre, dallages, murets, piscines naturelles. Coordination avec maçon si besoin.",
          "name": "Terrasses & extérieurs",
        },
        {
          "cat": "Végétal",
          "desc": "Haies, arbres, massifs, potager. Végétaux choisis pour votre sol, votre climat et vos envies d'entretien.",
          "name": "Plantations sur mesure",
        },
        {
          "cat": "Suivi",
          "desc": "Tontes, tailles, désherbage, traitements naturels. Forfaits annuels ou interventions à la demande.",
          "name": "Entretien & contrats",
        },
        {
          "cat": "Pratique",
          "desc": "Visite sur site, conseil végétal et aménagement, devis détaillé. Accompagnement de l'idée jusqu'à l'entretien.",
          "name": "Conseil & devis",
        },
      ],
      "valeursItems": [
        {
          "desc": "Selon votre terrain, vos envies, votre budget.",
          "title": "Création sur mesure",
        },
        {
          "desc": "Choisis pour votre sol et votre climat.",
          "title": "Végétaux adaptés",
        },
        {
          "desc": "Contrats annuels ou interventions ponctuelles.",
          "title": "Entretien régulier",
        },
        {
          "desc": "Un jardin pensé pour évoluer.",
          "title": "Conseil long terme",
        },
      ],
      "variant": "paysagiste",
    }
  `) })
  it('macon',       () => { expect(TEMPLATES.macon).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *clients*.",
        "brandTagline": "Maçon · Construction & rénovation",
        "ctaBannerText": "Pour une visite, un devis ou un simple conseil avant de se lancer, appelez ou laissez un message : on revient vers vous rapidement.",
        "ctaBannerTitle": "Un *projet* à étudier ?",
        "footerColonneLabel": "L'entreprise",
        "heroCtaPrimaire": "Voir nos réalisations →",
        "heroEyebrow": [Function],
        "heroLead": "Construction, rénovation, extension. Devis détaillé en amont, exécution soignée, et un vrai accompagnement de l'idée jusqu'aux finitions.",
        "heroQuote": "Une bonne maçonnerie, c'est invisible. Ça se voit quand c'est mal fait, dix ans plus tard. Notre métier, c'est de faire en sorte qu'on ne nous revoie pas pour les mauvaises raisons.",
        "heroQuoteAuthor": "— Le maçon",
        "heroTitle": "La maçonnerie *bien faite*, sans mauvaise surprise.",
        "histoireLead": "Devis détaillés, délais tenus, finitions soignées : le métier comme il devrait toujours se faire.",
        "histoireSuptitle": "L'entreprise",
        "histoireTitle": "Une *entreprise* qui prend ses chantiers au sérieux.",
        "navHistoireLabel": "L'entreprise",
        "navUniversLabel": "Nos réalisations",
        "textePresentation": "On intervient sur tous types de chantiers : maison individuelle, extension, rénovation lourde, ouverture de mur, terrasse, garage. Chaque projet commence par une visite, un cadrage précis et un devis détaillé. Sur le chantier : équipes formées, matériaux choisis, respect des règles de l'art. À la fin : un travail propre, une facture conforme au devis, et un contact qui reste joignable.",
        "universSectionIntro": "Construction neuve, rénovation, extension, ouverture de mur, terrasse : chaque chantier est cadré en amont avec un devis détaillé. On respecte les délais, on respecte les lieux, et on s'assure que le résultat tienne dans la durée.",
        "universSectionSuptitle": "NOS RÉALISATIONS",
        "universSectionTitle": "De la fondation à la finition, *on construit avec vous*.",
      },
      "palette": {
        "accent": "#B85C3C",
        "accentLight": "#ca856d",
        "cream": "#F4F0E8",
        "creamLight": "#f8f6f1",
        "creamWarm": "#eacec5",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#5C4D3A",
        "primarySoft": "#857a6b",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Murs, fondations, dalles, planchers, ouvertures. Construction neuve et rénovation, toutes échelles.",
          "name": "Maçonnerie générale",
        },
        {
          "cat": "Agrandissement",
          "desc": "Étude technique, raccordement à l'existant, gros œuvre complet jusqu'au clos couvert.",
          "name": "Extensions & surélévations",
        },
        {
          "cat": "Aménagement",
          "desc": "Terrasses sur dalle, escaliers extérieurs, allées et accès. Béton, pierre, ou matériaux décoratifs.",
          "name": "Terrasses & dallages",
        },
        {
          "cat": "Rénovation",
          "desc": "Reprise de fondations, ouverture de mur porteur (avec étude), reprise de fissures, traitement humidité.",
          "name": "Reprise structure",
        },
        {
          "cat": "Pratique",
          "desc": "Visite sur site, devis détaillé sous quelques jours, suivi de chantier régulier jusqu'à la livraison.",
          "name": "Devis & accompagnement",
        },
      ],
      "valeursItems": [
        {
          "desc": "Détaillé, sans surprise à la facture.",
          "title": "Devis clair",
        },
        {
          "desc": "Murs droits, finitions propres.",
          "title": "Travail soigné",
        },
        {
          "desc": "Délais tenus, lieux laissés nets.",
          "title": "Chantier respecté",
        },
        {
          "desc": "On vous accompagne dès l'idée.",
          "title": "Conseil amont",
        },
      ],
      "variant": "macon",
    }
  `) })
  it('couvreur',    () => { expect(TEMPLATES.couvreur).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *clients*.",
        "brandTagline": "Couvreur · Charpentier",
        "ctaBannerText": "Pour un diagnostic, un devis ou un dépannage rapide après tempête, appelez-nous : on intervient dans les meilleurs délais.",
        "ctaBannerTitle": "Une *fuite* ou un projet de toiture ?",
        "footerColonneLabel": "L'entreprise",
        "heroCtaPrimaire": "Voir nos interventions →",
        "heroEyebrow": [Function],
        "heroLead": "Pose neuve, rénovation, dépannage. Diagnostic précis, matériaux durables, travail en sécurité. On voit aussi la charpente, pas que la couverture.",
        "heroQuote": "Un toit, ça se regarde de près avant de monter dessus. La charpente, l'écran, la ventilation : tout compte si on veut que ça tienne.",
        "heroQuoteAuthor": "— Le couvreur",
        "heroTitle": "Une toiture *qui tient*, dans le temps.",
        "histoireLead": "Diagnostic complet, matériaux durables, et le respect des règles de l'art.",
        "histoireSuptitle": "L'entreprise",
        "histoireTitle": "Une *entreprise* qui regarde sous les tuiles.",
        "navHistoireLabel": "L'entreprise",
        "navUniversLabel": "Nos interventions",
        "textePresentation": "On intervient en pose neuve, en rénovation et en dépannage urgent. Avant chaque chantier, diagnostic de la charpente, de l'écran sous-toiture et de la ventilation : pas seulement la couverture. Tuiles canal, plates, ardoises, zinc, bac acier : on travaille tous matériaux selon le besoin et le style du bâti. Échafaudages aux normes, équipes formées, chantier laissé propre.",
        "universSectionIntro": "Pose, rénovation, dépannage : on intervient sur tous types de toitures. Diagnostic complet, matériaux durables, mise en œuvre dans les règles. Pour que votre toit dure et vous protège vraiment.",
        "universSectionSuptitle": "NOS INTERVENTIONS",
        "universSectionTitle": "De la charpente à la dernière tuile, *on couvre tout*.",
      },
      "palette": {
        "accent": "#B07A3E",
        "accentLight": "#c49b6e",
        "cream": "#F2F2EE",
        "creamLight": "#f7f7f5",
        "creamWarm": "#e7d7c5",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#3D4A52",
        "primarySoft": "#6e777d",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Pose neuve et rénovation : tuiles, ardoises, zinc. Gouttières, chéneaux, noues, raccords.",
          "name": "Couverture & zinguerie",
        },
        {
          "cat": "Charpente",
          "desc": "Étude, fabrication et pose. Reprise de charpente, renforts, traitement des bois.",
          "name": "Charpente traditionnelle",
        },
        {
          "cat": "Rénovation",
          "desc": "Dépose, charpente, isolation, écran, couverture neuve. Avec ou sans changement de matériau.",
          "name": "Réfection complète",
        },
        {
          "cat": "Urgence",
          "desc": "Fuites, tempête, tuiles cassées : intervention rapide pour mettre hors d'eau, devis pour la réparation durable.",
          "name": "Dépannage toiture",
        },
        {
          "cat": "Pratique",
          "desc": "Visite sur site, inspection détaillée, devis sous quelques jours avec préconisations claires.",
          "name": "Diagnostic & devis",
        },
      ],
      "valeursItems": [
        {
          "desc": "Inspection complète avant intervention.",
          "title": "Diagnostic toiture",
        },
        {
          "desc": "Tuiles, ardoises, zinguerie de qualité.",
          "title": "Matériaux durables",
        },
        {
          "desc": "On voit aussi sous la couverture.",
          "title": "Charpente comprise",
        },
        {
          "desc": "Échafaudages aux normes, équipes formées.",
          "title": "Travail en sécurité",
        },
      ],
      "variant": "couvreur",
    }
  `) })
  it('carreleur',   () => { expect(TEMPLATES.carreleur).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *clients*.",
        "brandTagline": "Carreleur · Pose & rénovation",
        "ctaBannerText": "Pour un devis, un conseil sur le choix d'un carrelage ou la rénovation d'une salle de bains complète, un message ou un appel.",
        "ctaBannerTitle": "Un *chantier* à étudier ?",
        "footerColonneLabel": "L'entreprise",
        "heroCtaPrimaire": "Voir nos réalisations →",
        "heroEyebrow": [Function],
        "heroLead": "Carrelage sol et mur, faïences, salles de bains, terrasses. Préparation du support, pose précise, joints nets — le souci du détail à chaque étape.",
        "heroQuote": "Le carrelage, c'est l'art de la préparation. Un bon support, un bon plan de calepinage, et la pose se passe sans drame.",
        "heroQuoteAuthor": "— Le carreleur",
        "heroTitle": "Une pose *au cordeau*, des finitions soignées.",
        "histoireLead": "Préparation rigoureuse, pose précise, et le respect du matériau choisi.",
        "histoireSuptitle": "L'entreprise",
        "histoireTitle": "Un *artisan* qui travaille au millimètre.",
        "navHistoireLabel": "L'entreprise",
        "navUniversLabel": "Nos réalisations",
        "textePresentation": "Le carrelage, c'est d'abord du soin avant de poser. On commence par vérifier la planéité du support, le traiter si besoin, calculer le calepinage pour optimiser les découpes et les raccords. Ensuite la pose : alignement au cordeau, joints réguliers, découpes nettes autour des obstacles. À la fin, un sol ou un mur qui tient dans le temps et qui se voit pour les bonnes raisons.",
        "universSectionIntro": "Sols, murs, salles de bains, terrasses, faïences décoratives : la pose se prépare bien avant de poser la première dalle. Choix du matériau, traitement du support, alignement, joints : chaque étape compte pour un rendu net qui dure.",
        "universSectionSuptitle": "NOS RÉALISATIONS",
        "universSectionTitle": "Du sol au plafond, *un carrelage qui dure*.",
      },
      "palette": {
        "accent": "#B89968",
        "accentLight": "#cab38e",
        "cream": "#F4F3EF",
        "creamLight": "#f8f8f5",
        "creamWarm": "#eae0d2",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#3A4550",
        "primarySoft": "#6b747c",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Carrelage neuf ou rénovation, tout format. Grès cérame, terre cuite, pierre naturelle, faïence.",
          "name": "Pose sol & mur",
        },
        {
          "cat": "Salles d'eau",
          "desc": "De la dépose à la pose finale : étanchéité, carrelage, faïence, joints. Coordination avec plombier si besoin.",
          "name": "Salles de bains complètes",
        },
        {
          "cat": "Extérieur",
          "desc": "Pose sur plots, pose collée, dallages extérieurs. Choix matériau adapté au climat et à l'usage.",
          "name": "Terrasses & dallages",
        },
        {
          "cat": "Décoration",
          "desc": "Crédences, frises décoratives, mosaïques, motifs personnalisés. Pose précise et calepinage soigné.",
          "name": "Faïences & mosaïques",
        },
        {
          "cat": "Pratique",
          "desc": "Visite, conseil matériau adapté à votre usage et budget, devis détaillé sous quelques jours.",
          "name": "Conseil & devis",
        },
      ],
      "valeursItems": [
        {
          "desc": "Joints alignés, niveaux parfaits.",
          "title": "Pose précise",
        },
        {
          "desc": "Support traité avant la première dalle.",
          "title": "Préparation soignée",
        },
        {
          "desc": "Le bon carrelage pour le bon usage.",
          "title": "Conseil matériau",
        },
        {
          "desc": "Découpes nettes, lieux préservés.",
          "title": "Chantier propre",
        },
      ],
      "variant": "carreleur",
    }
  `) })
  it('piscinier',   () => { expect(TEMPLATES.piscinier).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *clients*.",
        "brandTagline": "Piscinier · Construction & entretien",
        "ctaBannerText": "Pour une construction neuve, une rénovation ou un contrat d'entretien, on vient voir votre terrain et on en parle.",
        "ctaBannerTitle": "Un *projet* de piscine ?",
        "footerColonneLabel": "L'entreprise",
        "heroCtaPrimaire": "Voir nos piscines →",
        "heroEyebrow": [Function],
        "heroLead": "Construction, rénovation, entretien. Étude du terrain, choix techniques fiables, et un accompagnement qui dure après la mise à l'eau.",
        "heroQuote": "Une piscine, ça se vit dix, vingt, trente ans. C'est pour ça qu'on prend le temps de bien la concevoir au départ.",
        "heroQuoteAuthor": "— Le piscinier",
        "heroTitle": "Une piscine *bien pensée*, pour des années.",
        "histoireLead": "Étude amont, construction soignée, et un suivi qui reste là après la livraison.",
        "histoireSuptitle": "L'entreprise",
        "histoireTitle": "Une *entreprise* qui pense piscine sur le long terme.",
        "navHistoireLabel": "L'entreprise",
        "navUniversLabel": "Nos piscines",
        "textePresentation": "Chaque projet commence par une visite : analyser le terrain, l'orientation, les accès, vos usages. La conception suit : forme, dimensions, équipements (filtration, traitement, chauffage), choix esthétiques. La construction se fait avec des partenaires de confiance : maçonnerie, étanchéité, équipements fiables. Pour l'après : forfaits d'entretien ou interventions ponctuelles, dépannage en saison.",
        "universSectionIntro": "Construction neuve, rénovation, entretien, dépannage : la piscine se pense en amont et s'entretient dans la durée. Étude technique, exécution soignée, et un suivi qui reste là après la livraison.",
        "universSectionSuptitle": "NOS PISCINES",
        "universSectionTitle": "De la conception à l'entretien, *on vous accompagne*.",
      },
      "palette": {
        "accent": "#6FA8C5",
        "accentLight": "#93bed4",
        "cream": "#F2F6F8",
        "creamLight": "#f7fafb",
        "creamWarm": "#d4e5ee",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#1E5A7A",
        "primarySoft": "#56839b",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Étude, terrassement, structure, étanchéité, équipements. Piscines maçonnées, coques, formes libres ou classiques.",
          "name": "Construction neuve",
        },
        {
          "cat": "Rénovation",
          "desc": "Reprise d'étanchéité, remplacement local technique, mise aux normes, changement de revêtement.",
          "name": "Rénovation & rééquipement",
        },
        {
          "cat": "Entretien",
          "desc": "Hivernage, remise en route, traitement de l'eau, nettoyage régulier. Plusieurs formules selon vos besoins.",
          "name": "Forfaits annuels",
        },
        {
          "cat": "Dépannage",
          "desc": "Panne pompe, problème de traitement, équipement défaillant : intervention rapide en saison.",
          "name": "Interventions ponctuelles",
        },
        {
          "cat": "Pratique",
          "desc": "Visite, étude technique, devis détaillé. Suivi de chantier et formation à l'usage à la livraison.",
          "name": "Devis & accompagnement",
        },
      ],
      "valeursItems": [
        {
          "desc": "Implantation pensée selon votre extérieur.",
          "title": "Étude du terrain",
        },
        {
          "desc": "Maçonnerie, étanchéité, équipements fiables.",
          "title": "Construction soignée",
        },
        {
          "desc": "Forfaits saison ou interventions ponctuelles.",
          "title": "Entretien possible",
        },
        {
          "desc": "On vous accompagne au-delà de la livraison.",
          "title": "Conseil long terme",
        },
      ],
      "variant": "piscinier",
    }
  `) })
})

describe('TEMPLATES — snapshots Annexe D (Commerces & services)', () => {
  it('photographe', () => { expect(TEMPLATES.photographe).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent ceux qui m'ont fait *confiance*.",
        "brandTagline": "Photographe · Studio & reportage",
        "ctaBannerText": "Pour un projet précis, un devis, ou simplement échanger sur vos envies, appelez ou laissez un message.",
        "ctaBannerTitle": "Une *séance* à programmer ?",
        "footerColonneLabel": "Le studio",
        "heroCtaPrimaire": "Voir mes séances →",
        "heroEyebrow": [Function],
        "heroLead": "Portrait, famille, mariage, professionnel. Chaque séance se prépare pour vous mettre à l'aise — et le résultat suit, naturel et juste.",
        "heroQuote": "La meilleure image, ce n'est pas la plus posée. C'est celle où la personne s'oublie un instant, et redevient elle-même.",
        "heroQuoteAuthor": "— Le photographe",
        "heroTitle": "Des images *qui vous ressemblent*, vraiment.",
        "histoireLead": "Préparation soignée, écoute pendant la séance, et le souci d'images qui durent.",
        "histoireSuptitle": "Le studio",
        "histoireTitle": "Un *regard* posé sur ce qui compte.",
        "navHistoireLabel": "Le studio",
        "navUniversLabel": "Mes séances",
        "textePresentation": "Chaque séance commence par un échange : votre intention, le lieu, l'ambiance recherchée. Le jour J, on prend le temps : se rencontrer, se mettre à l'aise, laisser venir. Les images sont retouchées avec respect — on garde le naturel, on soigne la lumière, on s'arrête avant la sur-retouche. À la fin : une galerie en ligne, des tirages soignés si vous le souhaitez, et des images qui vous accompagneront longtemps.",
        "universSectionIntro": "Portrait, famille, mariage, professionnel : chaque séance est préparée pour vous mettre à l'aise. Le résultat : des images naturelles, qui vous ressemblent.",
        "universSectionSuptitle": "MES SÉANCES",
        "universSectionTitle": "Des moments vrais, *capturés avec justesse*.",
      },
      "palette": {
        "accent": "#B8A282",
        "accentLight": "#cab9a1",
        "cream": "#F5F3EF",
        "creamLight": "#f9f8f5",
        "creamWarm": "#eae3da",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#1A1A1A",
        "primarySoft": "#535353",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Séances individuelles, en couple, en famille. Studio ou extérieur, selon l'ambiance recherchée.",
          "name": "Portrait & famille",
        },
        {
          "cat": "Grands moments",
          "desc": "Reportage complet : préparatifs, cérémonie, vin d'honneur, soirée. Photos naturelles, livraison soignée.",
          "name": "Mariages & cérémonies",
        },
        {
          "cat": "Vie",
          "desc": "Séances dédiées aux moments uniques : grossesse, nouveau-né, anniversaires. Cadre apaisant, rythme respecté.",
          "name": "Grossesse, naissance, enfance",
        },
        {
          "cat": "Pro",
          "desc": "Portraits corporate, communication entreprise, événementiel pro. Cadrage adapté à votre image.",
          "name": "Photographie professionnelle",
        },
        {
          "cat": "Pratique",
          "desc": "Devis selon la prestation. Galerie en ligne sécurisée, tirages disponibles, formats variés.",
          "name": "Tarifs & livraison",
        },
      ],
      "valeursItems": [
        {
          "desc": "Chaque séance est pensée pour vous.",
          "title": "Approche personnalisée",
        },
        {
          "desc": "Capter les vrais moments, les vraies expressions.",
          "title": "Œil attentif",
        },
        {
          "desc": "Naturel préservé, rendu impeccable.",
          "title": "Retouches soignées",
        },
        {
          "desc": "Galeries en ligne et tirages soignés.",
          "title": "Livraison rapide",
        },
      ],
      "variant": "photographe",
    }
  `) })
  it('fleuriste',   () => { expect(TEMPLATES.fleuriste).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en pensent nos *fidèles*.",
        "brandTagline": "Fleuriste · Création florale",
        "ctaBannerText": "Mariage, deuil, événement, bouquet à livrer : un coup de fil ou un message, et on prépare tout pour vous.",
        "ctaBannerTitle": "Une commande *spéciale* ?",
        "footerColonneLabel": "La boutique",
        "heroCtaPrimaire": "Voir nos compositions →",
        "heroEyebrow": [Function],
        "heroLead": "Compositions de saison, bouquets sur mesure, fleurs choisies chez les producteurs. Pour offrir, pour célébrer, ou juste pour faire du bien.",
        "heroQuote": "Une belle fleur, ça ne se choisit pas au hasard. C'est une intention qu'on offre, et chacune mérite ce soin.",
        "heroQuoteAuthor": "— La fleuriste",
        "heroTitle": "Des fleurs *qui racontent*, chaque jour.",
        "histoireLead": "Des fleurs choisies, des compositions pensées, et le plaisir de partager ce métier avec vous.",
        "histoireSuptitle": "La boutique",
        "histoireTitle": "Une *boutique* qui fait bouquet.",
        "navHistoireLabel": "La boutique",
        "navUniversLabel": "Nos compositions",
        "textePresentation": "On choisit les fleurs au plus près des producteurs, on travaille les couleurs et les textures avec attention, et on adapte chaque bouquet à l'occasion : un anniversaire, un mariage, un hommage, ou simplement l'envie d'embellir son intérieur. La boutique vit au rythme des saisons — venez voir ce qu'on a aujourd'hui.",
        "universSectionIntro": "Bouquets du moment, créations sur mesure, fleurs à la tige : chaque composition part des envies et de ce que la saison nous offre. À retirer en boutique ou à livrer.",
        "universSectionSuptitle": "NOS COMPOSITIONS",
        "universSectionTitle": "Des fleurs choisies, *des bouquets qui parlent*.",
      },
      "palette": {
        "accent": "#D89B9B",
        "accentLight": "#e2b4b4",
        "cream": "#FAF6F1",
        "creamLight": "#fcfaf7",
        "creamWarm": "#f3e1e1",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#4A6B4F",
        "primarySoft": "#77907b",
      },
      "universItems": [
        {
          "cat": "Notre signature",
          "desc": "Compositions de saison, renouvelées chaque semaine. À emporter directement.",
          "name": "Bouquets du moment",
        },
        {
          "cat": "Sur mesure",
          "desc": "Pour offrir : on adapte les couleurs, les fleurs et la taille à votre intention.",
          "name": "Bouquets personnalisés",
        },
        {
          "cat": "Événements",
          "desc": "Décor floral, bouquet de mariée, centres de table. Devis sur demande.",
          "name": "Mariages & cérémonies",
        },
        {
          "cat": "Hommages",
          "desc": "Coussins, gerbes, raquettes — créations sobres et soignées, dans les délais.",
          "name": "Fleurs de deuil",
        },
        {
          "cat": "Pratique",
          "desc": "Livraison locale possible — appelez-nous pour les détails et délais.",
          "name": "Livraison",
        },
      ],
      "valeursItems": [
        {
          "desc": "Sélection chez les producteurs, fraîcheur d'abord.",
          "title": "Fleurs choisies",
        },
        {
          "desc": "Pour vous ou pour offrir, à votre image.",
          "title": "Bouquets sur mesure",
        },
        {
          "desc": "Mariages, cérémonies, deuils — composition soignée.",
          "title": "Événements",
        },
        {
          "desc": "Quelle fleur pour quelle occasion ? On en parle.",
          "title": "Conseil floral",
        },
      ],
      "variant": "fleuriste",
    }
  `) })
  it('bijoutier',   () => { expect(TEMPLATES.bijoutier).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en pensent nos *clients*.",
        "brandTagline": "Bijoutier · Horloger",
        "ctaBannerText": "Pour un cadeau, une alliance, une réparation ou un projet sur mesure, passez nous voir ou appelez pour un rendez-vous.",
        "ctaBannerTitle": "Une *pièce* à choisir ?",
        "footerColonneLabel": "La boutique",
        "heroCtaPrimaire": "Voir nos créations →",
        "heroEyebrow": [Function],
        "heroLead": "Bijoux or et argent, montres, créations sur mesure, réparations. Une boutique où l'on prend le temps, et un atelier sur place pour entretenir vos pièces.",
        "heroQuote": "Un bijou, ça traverse les générations si on en prend soin. Notre rôle, c'est d'aider à choisir, à transmettre, et à entretenir ce qui dure.",
        "heroQuoteAuthor": "— Le bijoutier",
        "heroTitle": "Des pièces *choisies*, un atelier qui suit.",
        "histoireLead": "Sélection rigoureuse, conseil discret, et un atelier qui répare et crée.",
        "histoireSuptitle": "La boutique",
        "histoireTitle": "Une *boutique* à l'ancienne, avec son atelier.",
        "navHistoireLabel": "La boutique",
        "navUniversLabel": "Notre boutique",
        "textePresentation": "La boutique propose une sélection de bijoux en or et argent : alliances, solitaires, créoles, pendentifs, chaînes. Les montres sont choisies avec la même exigence, mécaniques et quartz. L'atelier sur place permet de réparer, redimensionner, redonner vie à des pièces anciennes. Et pour les projets sur mesure : on dessine, on propose, on fabrique. Le tout dans un cadre où l'on prend le temps.",
        "universSectionIntro": "Sélection de bijoux en or et argent, montres choisies, réparations et créations sur mesure dans notre atelier. Pour offrir, pour transmettre, ou pour faire revivre une pièce ancienne.",
        "universSectionSuptitle": "NOTRE BOUTIQUE",
        "universSectionTitle": "Des bijoux, des montres, *un atelier sur place*.",
      },
      "palette": {
        "accent": "#C9A24B",
        "accentLight": "#d7b978",
        "cream": "#FAF6EE",
        "creamLight": "#fcfaf5",
        "creamWarm": "#efe3c9",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#2A2620",
        "primarySoft": "#5f5c58",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Sélection de pièces classiques et tendances. Alliances, solitaires, créoles, chaînes, pendentifs.",
          "name": "Bijoux or & argent",
        },
        {
          "cat": "Horlogerie",
          "desc": "Montres mécaniques et quartz choisies. Changement de pile, entretien, réparation toutes marques.",
          "name": "Montres & entretien",
        },
        {
          "cat": "Sur mesure",
          "desc": "Dessin sur mesure, transformation de pièces anciennes, projets sentimentaux. Devis sur étude.",
          "name": "Créations personnalisées",
        },
        {
          "cat": "Atelier",
          "desc": "Mise à taille, soudure, polissage, restauration de bijoux anciens. Devis transparent avant intervention.",
          "name": "Réparations & rénovations",
        },
        {
          "cat": "Pratique",
          "desc": "Conseil sans engagement, estimation gratuite pour bijoux anciens, prise de rendez-vous pour projets sur mesure.",
          "name": "Rendez-vous & estimation",
        },
      ],
      "valeursItems": [
        {
          "desc": "Or, argent, sélection rigoureuse.",
          "title": "Métaux précieux",
        },
        {
          "desc": "Réparations et créations sur place.",
          "title": "Atelier maison",
        },
        {
          "desc": "Entretien et réparation de montres.",
          "title": "Horlogerie soignée",
        },
        {
          "desc": "Pour offrir ou pour soi, sans pression.",
          "title": "Conseil discret",
        },
      ],
      "variant": "bijoutier",
    }
  `) })
  it('librairie',   () => { expect(TEMPLATES.librairie).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en pensent nos *lecteurs*.",
        "brandTagline": "Librairie · Conseil & découverte",
        "ctaBannerText": "Pour un titre précis, une liste cadeau, des achats pour une école ou une bibliothèque, passez nous voir ou appelez.",
        "ctaBannerTitle": "Une *commande* à passer ?",
        "footerColonneLabel": "La librairie",
        "heroCtaPrimaire": "Voir nos rayons →",
        "heroEyebrow": [Function],
        "heroLead": "Romans, essais, jeunesse, BD, beaux-livres. Un fonds vivant, des coups de cœur affichés, et le plaisir d'échanger autour de ce qu'on lit.",
        "heroQuote": "Une librairie, ce n'est pas juste un stock de livres. C'est un endroit où quelqu'un a lu, choisi, et a envie de partager ce qu'il a trouvé.",
        "heroQuoteAuthor": "— Le libraire",
        "heroTitle": "Des livres *choisis*, des conseils sincères.",
        "histoireLead": "Sélection vivante, conseil sincère, et un lieu où on a envie de revenir.",
        "histoireSuptitle": "La librairie",
        "histoireTitle": "Une *librairie* qui aime ce qu'elle vend.",
        "navHistoireLabel": "La librairie",
        "navUniversLabel": "Nos rayons",
        "textePresentation": "La librairie défend ce qu'elle a aimé : romans français et étrangers, sciences humaines, jeunesse soignée, BD, beaux-livres, livres régionaux. Les coups de cœur sont mis en avant, les sélections renouvelées au fil des actualités et des saisons. On peut venir bouquiner, demander conseil, commander un titre précis, ou simplement traîner dans les rayons. Et de temps en temps, on accueille un auteur pour une rencontre.",
        "universSectionIntro": "Romans, essais, jeunesse, BD, beaux-livres, livres locaux : un fonds choisi, des coups de cœur affichés, et le plaisir d'échanger avec vous sur ce que vous lisez ou cherchez.",
        "universSectionSuptitle": "NOS RAYONS",
        "universSectionTitle": "Des livres, des conseils, *une vraie librairie*.",
      },
      "palette": {
        "accent": "#B85C3C",
        "accentLight": "#ca856d",
        "cream": "#FAF5EC",
        "creamLight": "#fcf9f4",
        "creamWarm": "#eacec5",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#3A2A1F",
        "primarySoft": "#6b5f57",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Rentrées littéraires, romans français et étrangers, poésie, théâtre. Coups de cœur affichés en vitrine.",
          "name": "Romans & littérature",
        },
        {
          "cat": "Idées",
          "desc": "Philosophie, histoire, sociologie, actualité. Sélection vivante au fil des publications marquantes.",
          "name": "Essais & sciences humaines",
        },
        {
          "cat": "Jeunesse",
          "desc": "Du tout-petit à l'ado : albums illustrés, premières lectures, romans, BD, mangas. Conseil pour les cadeaux.",
          "name": "Albums, romans, BD jeunesse",
        },
        {
          "cat": "Local",
          "desc": "Histoire locale, gastronomie régionale, auteurs du coin. Quand on peut, on les invite à dédicacer.",
          "name": "Livres du terroir & auteurs locaux",
        },
        {
          "cat": "Pratique",
          "desc": "Commande de tout titre disponible sous 48h. Cartes cadeaux, listes anniversaires, rencontres et dédicaces.",
          "name": "Commandes & événements",
        },
      ],
      "valeursItems": [
        {
          "desc": "Sélection renouvelée, coups de cœur affichés.",
          "title": "Sélection vivante",
        },
        {
          "desc": "Le bon livre pour le bon lecteur.",
          "title": "Conseil sur mesure",
        },
        {
          "desc": "On commande ce que vous cherchez.",
          "title": "Commandes spéciales",
        },
        {
          "desc": "Rencontres, dédicaces, ateliers.",
          "title": "Lieu vivant",
        },
      ],
      "variant": "librairie",
    }
  `) })
  it('garagiste',   () => { expect(TEMPLATES.garagiste).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *clients*.",
        "brandTagline": "Garagiste · Mécanique & entretien",
        "ctaBannerText": "Pour un diagnostic, un entretien ou un dépannage, passez nous voir ou appelez-nous — on s'organise pour vous prendre rapidement.",
        "ctaBannerTitle": "Un *devis* ou un rendez-vous ?",
        "footerColonneLabel": "Le garage",
        "heroCtaPrimaire": "Voir nos prestations →",
        "heroEyebrow": [Function],
        "heroLead": "Entretien, réparation, diagnostic. Toutes marques, devis clair, et un vrai accompagnement pour vous éviter les mauvaises surprises.",
        "heroQuote": "Un bon garagiste, c'est celui qui vous explique ce qu'il fait, pourquoi il le fait, et combien ça coûte avant de commencer.",
        "heroQuoteAuthor": "— Le garagiste",
        "heroTitle": "Votre voiture *entre de bonnes mains*.",
        "histoireLead": "Diagnostic précis, conseils honnêtes, et le souci du travail bien fait.",
        "histoireSuptitle": "Le garage",
        "histoireTitle": "Un *garage* de confiance, près de chez vous.",
        "navHistoireLabel": "Le garage",
        "navUniversLabel": "Nos prestations",
        "textePresentation": "Notre atelier est équipé pour intervenir sur toutes les marques et tous types de véhicules : entretien courant, distribution, embrayage, freinage, électronique. Chaque intervention commence par un diagnostic et un devis clair. On vous explique avant, on vous montre après. L'objectif : que vous repartiez avec une voiture fiable et la facture annoncée.",
        "universSectionIntro": "Vidange, freinage, embrayage, distribution, pannes électroniques : nous intervenons sur toutes marques et tous types de véhicules. Diagnostic gratuit, devis clair, délais respectés.",
        "universSectionSuptitle": "NOS PRESTATIONS",
        "universSectionTitle": "De l'entretien à la grosse réparation, *on s'occupe de tout*.",
      },
      "palette": {
        "accent": "#B7322C",
        "accentLight": "#c96561",
        "cream": "#F4F5F7",
        "creamLight": "#f8f9fa",
        "creamWarm": "#e9c2c0",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#1F3A5F",
        "primarySoft": "#576b87",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Vidange, filtres, contrôle freinage, distribution. Toutes marques, toutes motorisations.",
          "name": "Entretien & révision",
        },
        {
          "cat": "Réparation",
          "desc": "Embrayage, suspension, échappement, électronique. Diagnostic précis avant intervention.",
          "name": "Mécanique générale",
        },
        {
          "cat": "Sécurité",
          "desc": "Vente et montage tous pneus, équilibrage, géométrie. Stockage saisonnier possible.",
          "name": "Pneumatiques",
        },
        {
          "cat": "Avant CT",
          "desc": "Contre-visite, mise aux normes. On vous accompagne pour passer du premier coup.",
          "name": "Préparation contrôle technique",
        },
        {
          "cat": "Pratique",
          "desc": "Sur place, à domicile ou enlèvement véhicule. Appelez-nous pour les modalités.",
          "name": "Dépannage",
        },
      ],
      "valeursItems": [
        {
          "desc": "Avant intervention, on vous explique tout.",
          "title": "Diagnostic clair",
        },
        {
          "desc": "Entretien, réparation, contrôle.",
          "title": "Toutes marques",
        },
        {
          "desc": "Pas de surprise à la facture.",
          "title": "Devis honnête",
        },
        {
          "desc": "Pièces et main-d'œuvre couvertes.",
          "title": "Travail garanti",
        },
      ],
      "variant": "garagiste",
    }
  `) })
})

describe('TEMPLATES — snapshots Annexe C (Services à la personne)', () => {
  it('coiffeur',            () => { expect(TEMPLATES.coiffeur).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en pensent nos *fidèles*.",
        "brandTagline": "Coiffeur · Salon de coiffure",
        "ctaBannerText": "Pour une coupe, une couleur, un événement à venir ou simplement échanger avant un changement, appelez-nous.",
        "ctaBannerTitle": "Un *rendez-vous* à prendre ?",
        "footerColonneLabel": "Le salon",
        "heroCtaPrimaire": "Voir nos prestations →",
        "heroEyebrow": [Function],
        "heroLead": "Coupes, couleurs, soins. Chaque prestation commence par un échange — comprendre votre style, votre quotidien, ce qui vous va.",
        "heroQuote": "Une bonne coupe, ce n'est pas une tendance plaquée. C'est une coupe qui fonctionne pour vous, votre cheveu, votre vie.",
        "heroQuoteAuthor": "— Le coiffeur",
        "heroTitle": "Une coiffure *qui vous ressemble*, vraiment.",
        "histoireLead": "Conseil sur mesure, gestes précis, et un moment vraiment pour vous.",
        "histoireSuptitle": "Le salon",
        "histoireTitle": "Un *salon* où on prend le temps d'écouter.",
        "navHistoireLabel": "Le salon",
        "navUniversLabel": "Nos prestations",
        "textePresentation": "On commence toujours par un échange : votre routine, votre type de cheveu, votre quotidien, ce que vous aimez ou pas. La coupe suit, pensée pour vous être facile à reprendre chez vous. Les couleurs sont travaillées avec des produits choisis pour leur rendu et leur respect du cheveu. Et entre tout ça, un moment où on prend le temps — parce que c'est aussi ça, le métier.",
        "universSectionIntro": "Coupes, couleurs, soins : chaque prestation commence par un échange pour comprendre votre style et votre quotidien. Le résultat vous appartient.",
        "universSectionSuptitle": "NOS PRESTATIONS",
        "universSectionTitle": "Une coiffure pensée pour vous, *du conseil à la coupe*.",
      },
      "palette": {
        "accent": "#D4A5A5",
        "accentLight": "#dfbcbc",
        "cream": "#FAF6F4",
        "creamLight": "#fcfaf8",
        "creamWarm": "#f2e4e4",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#1F1F1F",
        "primarySoft": "#575757",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Coupes personnalisées selon votre cheveu et votre style. Conseil entretien pour reproduire à la maison.",
          "name": "Coupes femme & homme",
        },
        {
          "cat": "Couleur",
          "desc": "Colorations, balayages, ombrés, méchages. Produits respectueux du cheveu, conseil avant chaque application.",
          "name": "Coloration & mèches",
        },
        {
          "cat": "Soins",
          "desc": "Soins en profondeur, brushings, défrisage doux, soins à domicile recommandés selon votre cheveu.",
          "name": "Soins capillaires",
        },
        {
          "cat": "Événement",
          "desc": "Coiffures de mariée, demoiselles d'honneur, événements pro. Essais inclus, déplacement possible.",
          "name": "Coiffures mariage & cérémonie",
        },
        {
          "cat": "Pratique",
          "desc": "Réservation par téléphone ou en boutique. Conseil produits maison disponibles à la vente.",
          "name": "Rendez-vous & infos",
        },
      ],
      "valeursItems": [
        {
          "desc": "Adaptées à votre style et votre visage.",
          "title": "Coupes personnalisées",
        },
        {
          "desc": "Marques professionnelles, ingrédients respectueux.",
          "title": "Produits soignés",
        },
        {
          "desc": "Soins, coiffure, entretien au quotidien.",
          "title": "Conseils sur mesure",
        },
        {
          "desc": "Un espace pensé pour vous mettre à l'aise.",
          "title": "Moment détente",
        },
      ],
      "variant": "coiffeur",
    }
  `) })
  it('esthetique',          () => { expect(TEMPLATES.esthetique).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en pensent nos *fidèles*.",
        "brandTagline": "Institut · Soins esthétiques",
        "ctaBannerText": "Pour un soin précis, un coffret cadeau ou échanger sur ce qui vous conviendrait, un appel ou un message suffit.",
        "ctaBannerTitle": "Un *rendez-vous bien-être* ?",
        "footerColonneLabel": "L'institut",
        "heroCtaPrimaire": "Découvrir nos soins →",
        "heroEyebrow": [Function],
        "heroLead": "Visage, corps, beauté des mains et des pieds. Chaque protocole est adapté à votre peau, à vos envies, à votre moment.",
        "heroQuote": "Un soin, c'est un moment qu'on s'offre. Mon rôle, c'est de faire en sorte que vous repartiez détendue, et que la peau aussi en bénéficie.",
        "heroQuoteAuthor": "— L'esthéticienne",
        "heroTitle": "Des soins *sur mesure*, pour vraiment prendre soin de vous.",
        "histoireLead": "Soins adaptés, produits choisis, et un cadre où l'on respire vraiment.",
        "histoireSuptitle": "L'institut",
        "histoireTitle": "Un *institut* pensé comme un cocon.",
        "navHistoireLabel": "L'institut",
        "navUniversLabel": "Nos soins",
        "textePresentation": "Chaque soin commence par un échange pour comprendre votre peau, vos préoccupations, vos envies du jour. Les protocoles s'adaptent : visage, corps, mains, pieds, épilations. Les produits sont choisis chez des marques professionnelles soigneusement sélectionnées. L'objectif : un vrai moment pour vous, des résultats visibles, et un suivi attentif si vous souhaitez vous installer dans la durée.",
        "universSectionIntro": "Visage, corps, beauté des mains et des pieds : chaque protocole est adapté à votre peau et à vos envies. Un vrai moment pour soi.",
        "universSectionSuptitle": "NOS SOINS",
        "universSectionTitle": "Des soins sur mesure, *pour prendre soin de vous*.",
      },
      "palette": {
        "accent": "#B07A6D",
        "accentLight": "#c49b92",
        "cream": "#FAF3EE",
        "creamLight": "#fcf8f5",
        "creamWarm": "#e7d7d3",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#C9A88D",
        "primarySoft": "#d7beaa",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Nettoyage, hydratation, anti-âge, traitement ciblé. Diagnostic peau et conseil produits inclus.",
          "name": "Soins du visage",
        },
        {
          "cat": "Corps",
          "desc": "Modelages relaxants, gommages, enveloppements. Pour la détente ou pour des résultats ciblés.",
          "name": "Soins corps & massages",
        },
        {
          "cat": "Beauté",
          "desc": "Manucures, pédicures, beauté du regard, épilations toutes zones. Soins précis et respectueux.",
          "name": "Mains, pieds, épilations",
        },
        {
          "cat": "Cadeaux",
          "desc": "Bons soin à offrir, coffrets sur mesure, formules anniversaire ou détente. Plusieurs gammes disponibles.",
          "name": "Coffrets & bons cadeaux",
        },
        {
          "cat": "Pratique",
          "desc": "Réservation simple, formules d'abonnement avec tarifs préférentiels pour les soins réguliers.",
          "name": "Rendez-vous & abonnements",
        },
      ],
      "valeursItems": [
        {
          "desc": "Adaptés à votre peau et vos besoins.",
          "title": "Soins personnalisés",
        },
        {
          "desc": "Marques professionnelles soigneusement sélectionnées.",
          "title": "Produits experts",
        },
        {
          "desc": "Un cocon pour vraiment décompresser.",
          "title": "Cabine apaisante",
        },
        {
          "desc": "Conseils et soins dans la durée.",
          "title": "Suivi attentif",
        },
      ],
      "variant": "esthetique",
    }
  `) })
  it('kine',                () => { expect(TEMPLATES.kine).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *patients*.",
        "brandTagline": "Kinésithérapeute · Rééducation",
        "ctaBannerText": "Pour une prescription médicale, une douleur récurrente ou un accompagnement sportif, appelez le cabinet ou laissez un message.",
        "ctaBannerTitle": "Un *rendez-vous* à prendre ?",
        "footerColonneLabel": "Le cabinet",
        "heroCtaPrimaire": "Découvrir le cabinet →",
        "heroEyebrow": [Function],
        "heroLead": "Rééducation, posturologie, accompagnement sportif. Bilan précis, techniques adaptées, et un suivi attentif entre les séances.",
        "heroQuote": "La rééducation, ça ne se fait pas à la place du patient. On guide, on adapte, on encourage — mais le travail, c'est lui qui le fait.",
        "heroQuoteAuthor": "— Le kiné",
        "heroTitle": "Une rééducation *pensée pour vous*, et qui avance.",
        "histoireLead": "Bilans rigoureux, techniques adaptées, et l'attention au-delà des séances.",
        "histoireSuptitle": "Le cabinet",
        "histoireTitle": "Un *cabinet* qui mise sur le suivi.",
        "navHistoireLabel": "Le cabinet",
        "navUniversLabel": "Nos prises en charge",
        "textePresentation": "Chaque prise en charge commence par un bilan précis : examen clinique, anamnèse, identification des objectifs. Les techniques utilisées combinent kiné manuelle, exercices, posturologie selon les besoins. Le suivi est attentif : on note les progrès, on ajuste, on échange entre les séances si nécessaire. L'objectif : que vous gagniez en autonomie et que les résultats tiennent dans la durée.",
        "universSectionIntro": "Rééducation, posturologie, accompagnement sportif : chaque prise en charge commence par un bilan précis. L'objectif : vos progrès, durablement.",
        "universSectionSuptitle": "NOS PRISES EN CHARGE",
        "universSectionTitle": "Une approche complète, *adaptée à chaque patient*.",
      },
      "palette": {
        "accent": "#88B5A8",
        "accentLight": "#a6c8be",
        "cream": "#F4F8F7",
        "creamLight": "#f8fbfa",
        "creamWarm": "#dbe9e5",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#4A7A8A",
        "primarySoft": "#779ba7",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Post-opératoire, traumatique, neurologique. Suivi progressif jusqu'à la reprise complète de l'activité.",
          "name": "Rééducation fonctionnelle",
        },
        {
          "cat": "Douleurs chroniques",
          "desc": "Approche globale : examen, traitement manuel, exercices, conseils posturaux pour le quotidien.",
          "name": "Lombalgies, cervicalgies, tendinopathies",
        },
        {
          "cat": "Posturologie",
          "desc": "Analyse fine, traitement adapté. Pertinent pour douleurs récidivantes ou pathologies posturales.",
          "name": "Bilan postural",
        },
        {
          "cat": "Sportifs",
          "desc": "Prévention, récupération, post-blessure. Accompagnement de la reprise jusqu'à la performance.",
          "name": "Kiné du sport",
        },
        {
          "cat": "Pratique",
          "desc": "Prise de rendez-vous par téléphone ou en ligne. Conventionné, tiers payant possible selon mutuelle.",
          "name": "Rendez-vous & infos",
        },
      ],
      "valeursItems": [
        {
          "desc": "Diagnostic précis avant chaque prise en charge.",
          "title": "Bilan personnalisé",
        },
        {
          "desc": "Manuel, posturologie, exercices adaptés.",
          "title": "Techniques variées",
        },
        {
          "desc": "Plateau technique pensé pour vos progrès.",
          "title": "Cabinet équipé",
        },
        {
          "desc": "On reste à votre écoute entre les séances.",
          "title": "Suivi attentif",
        },
      ],
      "variant": "kine",
    }
  `) })
  it('cabinet',             () => { expect(TEMPLATES.cabinet).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *clients*.",
        "brandTagline": "Cabinet · Expertise & conseil",
        "ctaBannerText": "Pour exposer votre situation, demander un devis ou simplement échanger sur une question, prenez contact par téléphone ou par message.",
        "ctaBannerTitle": "Un *premier échange* ?",
        "footerColonneLabel": "Le cabinet",
        "heroCtaPrimaire": "Découvrir le cabinet →",
        "heroEyebrow": [Function],
        "heroLead": "Chaque situation est unique. Notre rôle : comprendre, conseiller, accompagner — avec rigueur et avec une vraie disponibilité.",
        "heroQuote": "Le métier, c'est d'abord d'écouter. Comprendre vraiment ce dont la personne ou l'entreprise a besoin, avant de proposer quoi que ce soit.",
        "heroQuoteAuthor": "— L'équipe",
        "heroTitle": "Un accompagnement *sur mesure*, dans la durée.",
        "histoireLead": "Écoute attentive, compétences solides, et un accompagnement qui s'installe dans la durée.",
        "histoireSuptitle": "Le cabinet",
        "histoireTitle": "Un *cabinet* qui mise sur la relation.",
        "navHistoireLabel": "Le cabinet",
        "navUniversLabel": "Nos domaines",
        "textePresentation": "Chaque dossier commence par un échange approfondi : votre situation, vos enjeux, vos objectifs. L'analyse suit, rigoureuse et structurée. Les recommandations sont formulées clairement, avec leurs implications. L'accompagnement se poursuit ensuite : on reste disponible, on adapte, on suit. La confiance se construit dossier après dossier — et c'est elle qui fait la différence.",
        "universSectionIntro": "Nous intervenons dans plusieurs domaines de compétence. Chaque dossier est traité avec rigueur, dans le respect des délais et avec une vraie écoute.",
        "universSectionSuptitle": "NOS DOMAINES",
        "universSectionTitle": "Un accompagnement sur mesure, *pour chaque situation*.",
      },
      "palette": {
        "accent": "#A8A8A8",
        "accentLight": "#bebebe",
        "cream": "#F5F5F5",
        "creamLight": "#f9f9f9",
        "creamWarm": "#e5e5e5",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#2C3E5C",
        "primarySoft": "#616e85",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Analyse de votre situation, recommandations claires, accompagnement dans la mise en œuvre des décisions.",
          "name": "Conseil sur mesure",
        },
        {
          "cat": "Expertise",
          "desc": "Nos domaines de compétence couvrent les sujets les plus fréquents de notre métier. Précisions sur demande.",
          "name": "Domaines d'intervention",
        },
        {
          "cat": "Particuliers",
          "desc": "Conseil et suivi pour les questions personnelles. Premier rendez-vous d'évaluation possible.",
          "name": "Accompagnement particuliers",
        },
        {
          "cat": "Entreprises",
          "desc": "Conseil aux dirigeants, suivi récurrent, intervention ponctuelle sur projet. Selon votre structure.",
          "name": "Accompagnement entreprises",
        },
        {
          "cat": "Pratique",
          "desc": "Prise de rendez-vous par téléphone ou message. Honoraires précisés avant tout engagement.",
          "name": "Rendez-vous & honoraires",
        },
      ],
      "valeursItems": [
        {
          "desc": "Comprendre avant de proposer.",
          "title": "Écoute attentive",
        },
        {
          "desc": "Chaque situation est unique.",
          "title": "Approche personnalisée",
        },
        {
          "desc": "Formation continue et expérience.",
          "title": "Compétences reconnues",
        },
        {
          "desc": "Une relation de confiance qui s'installe.",
          "title": "Suivi dans la durée",
        },
      ],
      "variant": "cabinet",
    }
  `) })
  it('osteopathe',          () => { expect(TEMPLATES.osteopathe).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *patients*.",
        "brandTagline": "Ostéopathe · Soins manuels",
        "ctaBannerText": "Pour une douleur, un suivi régulier, un bilan post-accident ou en accompagnement de grossesse, appelez ou laissez un message.",
        "ctaBannerTitle": "Un *rendez-vous* à prendre ?",
        "footerColonneLabel": "Le cabinet",
        "heroCtaPrimaire": "Découvrir le cabinet →",
        "heroEyebrow": [Function],
        "heroLead": "Adultes, enfants, sportifs, femmes enceintes. Chaque consultation commence par un bilan attentif et propose des gestes adaptés à votre situation.",
        "heroQuote": "L'ostéopathie, c'est avant tout de l'écoute : du corps, de l'histoire du patient, des signaux qu'il envoie. Les gestes viennent après.",
        "heroQuoteAuthor": "— L'ostéopathe",
        "heroTitle": "Une approche *manuelle et globale*, attentive.",
        "histoireLead": "Écoute attentive, approche globale, et le souci de chercher la cause au-delà du symptôme.",
        "histoireSuptitle": "Le cabinet",
        "histoireTitle": "Un *cabinet* qui prend le temps.",
        "navHistoireLabel": "Le cabinet",
        "navUniversLabel": "Nos prises en charge",
        "textePresentation": "Chaque consultation commence par un échange et un bilan complet : antécédents, mode de vie, examen clinique. L'approche est globale — on cherche les causes au-delà du seul symptôme. Les techniques utilisées (structurelles, fonctionnelles, douces selon les patients) s'adaptent à votre âge, votre situation, votre demande. Pour conclure, des conseils concrets pour le quotidien : posture, gestes, étirements.",
        "universSectionIntro": "Douleurs aiguës ou chroniques, troubles fonctionnels, suivi de grossesse, sportifs : chaque consultation commence par un bilan complet pour comprendre l'origine des symptômes. Les techniques s'adaptent à votre situation, votre âge, votre histoire.",
        "universSectionSuptitle": "NOS PRISES EN CHARGE",
        "universSectionTitle": "Une approche *globale*, pour chaque patient.",
      },
      "palette": {
        "accent": "#A8B5A8",
        "accentLight": "#bec8be",
        "cream": "#F4F7F6",
        "creamLight": "#f8fafa",
        "creamWarm": "#e5e9e5",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#3A5A6B",
        "primarySoft": "#6b8390",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Lombalgies, sciatiques, cervicalgies, tendinopathies, douleurs récidivantes. Bilan et prise en charge adaptée.",
          "name": "Douleurs aiguës & chroniques",
        },
        {
          "cat": "Spécifique",
          "desc": "Grossesse, post-partum, nourrissons (coliques, plagiocéphalie, troubles du sommeil). Techniques douces.",
          "name": "Suivi périnatal & nourrissons",
        },
        {
          "cat": "Sportifs",
          "desc": "Préparation, récupération, prévention des blessures, optimisation des appuis. Pour amateurs comme confirmés.",
          "name": "Ostéopathie du sport",
        },
        {
          "cat": "Global",
          "desc": "Migraines, troubles digestifs, stress, troubles ORL. Approche globale qui dépasse le symptôme isolé.",
          "name": "Troubles fonctionnels",
        },
        {
          "cat": "Pratique",
          "desc": "Prise de rendez-vous simple, durée 45-60 min, tarifs affichés. Remboursement mutuelle possible selon contrats.",
          "name": "Rendez-vous & tarifs",
        },
      ],
      "valeursItems": [
        {
          "desc": "Diagnostic précis avant tout geste.",
          "title": "Bilan attentif",
        },
        {
          "desc": "On regarde le corps dans son ensemble.",
          "title": "Approche globale",
        },
        {
          "desc": "Adultes, enfants, sportifs, femmes enceintes.",
          "title": "Tous publics",
        },
        {
          "desc": "Pour que les bénéfices durent.",
          "title": "Conseils quotidien",
        },
      ],
      "variant": "osteopathe",
    }
  `) })
  it('praticien_bien_etre', () => { expect(TEMPLATES.praticien_bien_etre).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent celles et ceux que *l'on accompagne*.",
        "brandTagline": "Bien-être · Accompagnement",
        "ctaBannerText": "Pour prendre rendez-vous, échanger sur votre situation ou poser une question, un message ou un appel suffit.",
        "ctaBannerTitle": "Une *première séance* ?",
        "footerColonneLabel": "Le cabinet",
        "heroCtaPrimaire": "Découvrir nos accompagnements →",
        "heroEyebrow": [Function],
        "heroLead": "Sophrologie, naturopathie, accompagnement bien-être : un espace d'écoute et de pratiques douces, pour avancer là où vous en avez besoin.",
        "heroQuote": "Chaque personne arrive avec son histoire. Le rôle du praticien, c'est d'écouter, de proposer, et de laisser le chemin se faire.",
        "heroQuoteAuthor": "— La praticienne",
        "heroTitle": "Prendre soin, *à votre rythme*.",
        "histoireLead": "Un espace pensé pour le calme, des pratiques choisies pour ce qu'elles apportent vraiment.",
        "histoireSuptitle": "Le cabinet",
        "histoireTitle": "Un *cabinet* à l'écoute.",
        "navHistoireLabel": "Le cabinet",
        "navUniversLabel": "Nos accompagnements",
        "textePresentation": "Le cabinet est un lieu où l'on prend le temps : d'échanger, d'observer, de comprendre. Les séances combinent écoute, technique et propositions concrètes pour le quotidien. Pas de promesse miracle, pas d'injonction — juste un accompagnement pensé pour vous, dans la durée si vous le souhaitez.",
        "universSectionIntro": "Chaque pratique commence par un échange : comprendre où vous en êtes, ce qui vous traverse, ce vers quoi vous voulez aller. Les séances s'adaptent à votre cheminement, sans forcer.",
        "universSectionSuptitle": "NOS ACCOMPAGNEMENTS",
        "universSectionTitle": "Un accompagnement *à votre rythme*.",
      },
      "palette": {
        "accent": "#C99B7A",
        "accentLight": "#d7b49b",
        "cream": "#F6F2EC",
        "creamLight": "#faf7f4",
        "creamWarm": "#efe1d7",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#6B7B6F",
        "primarySoft": "#909c93",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Un échange, une pratique adaptée, des outils à emporter. Durée et fréquence ajustées à votre situation.",
          "name": "Séances individuelles",
        },
        {
          "cat": "Pour démarrer",
          "desc": "Une séance d'écoute pour comprendre votre demande et voir ce qu'on peut faire ensemble.",
          "name": "Première rencontre",
        },
        {
          "cat": "Suivi",
          "desc": "Pour avancer sur un sujet précis : stress, sommeil, transition, mieux-être global.",
          "name": "Accompagnement régulier",
        },
        {
          "cat": "Ateliers",
          "desc": "Sessions thématiques en petit groupe — relaxation, gestion du stress, ateliers découverte.",
          "name": "Groupes & ateliers",
        },
        {
          "cat": "Pratique",
          "desc": "Au cabinet ou en visio selon les pratiques. Tarifs et conditions précisés à la prise de contact.",
          "name": "Modalités",
        },
      ],
      "valeursItems": [
        {
          "desc": "Le temps qu'il faut pour comprendre.",
          "title": "Écoute attentive",
        },
        {
          "desc": "Techniques choisies, gestes mesurés.",
          "title": "Approche douce",
        },
        {
          "desc": "Un espace pensé pour se poser.",
          "title": "Cabinet apaisant",
        },
        {
          "desc": "Au rythme qui vous convient.",
          "title": "Suivi adapté",
        },
      ],
      "variant": "praticien_bien_etre",
    }
  `) })
})

describe('TEMPLATES — snapshots Annexe E (Hébergement)', () => {
  it('gite',    () => { expect(TEMPLATES.gite).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *hôtes*.",
        "brandTagline": "Gîte · Chambres d'hôtes",
        "ctaBannerText": "Pour un séjour, un week-end, une question sur les disponibilités ou le coin, appelez ou laissez un message — réponse rapide.",
        "ctaBannerTitle": "Une *réservation* ?",
        "footerColonneLabel": "La maison",
        "heroCtaPrimaire": "Voir l'hébergement →",
        "heroEyebrow": [Function],
        "heroLead": "Gîte, chambres d'hôtes, accueil personnel. Un cadre soigné, des conseils locaux, et le calme qui fait du bien quand on en a besoin.",
        "heroQuote": "Recevoir, c'est s'occuper des détails qu'on ne voit pas. Pour que l'invité, lui, n'ait qu'à profiter du lieu et du moment.",
        "heroQuoteAuthor": "— Les hôtes",
        "heroTitle": "Un *vrai séjour*, dans un vrai lieu.",
        "histoireLead": "Cadre soigné, accueil chaleureux, et l'envie de partager ce qu'on aime du coin.",
        "histoireSuptitle": "La maison",
        "histoireTitle": "Une *maison* qui sait recevoir.",
        "navHistoireLabel": "La maison",
        "navUniversLabel": "L'hébergement",
        "textePresentation": "La maison est pensée pour le séjour : équipements complets, literie soignée, espaces de vie agréables, extérieur arrangé. On accueille en personne, on prend le temps de présenter, on partage les bonnes adresses : restaurants, marchés, balades, sites à voir. Le reste du temps, on reste discrets — vous êtes chez vous. Un cadre pour souffler, retrouver le calme, ou rayonner dans la région.",
        "universSectionIntro": "Gîte ou chambres d'hôtes, séjour court ou semaine complète : la maison est pensée pour vous mettre à l'aise. Cadre soigné, équipements complets, accueil personnel — et de vraies adresses du coin à partager.",
        "universSectionSuptitle": "L'HÉBERGEMENT",
        "universSectionTitle": "Un lieu *pour souffler*, dans un vrai cadre.",
      },
      "palette": {
        "accent": "#C9853D",
        "accentLight": "#d7a46e",
        "cream": "#FAF5EC",
        "creamLight": "#fcf9f4",
        "creamWarm": "#efdac5",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#4A5C3A",
        "primarySoft": "#77856b",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Gîte indépendant ou chambres d'hôtes selon formule. Capacité, équipements et tarifs détaillés sur demande.",
          "name": "L'hébergement",
        },
        {
          "cat": "Confort",
          "desc": "Literie soignée, linge fourni, cuisine équipée, wifi, parking. Petit-déjeuner selon formule.",
          "name": "Équipements & services",
        },
        {
          "cat": "À côté",
          "desc": "Sites à voir, restaurants conseillés, marchés, randonnées, vignobles. Carte personnalisée à l'arrivée.",
          "name": "Le coin & ses richesses",
        },
        {
          "cat": "Selon vos envies",
          "desc": "Week-ends, semaines, séjours thématiques. Tarifs dégressifs selon durée, formules adaptables.",
          "name": "Formules & séjours",
        },
        {
          "cat": "Pratique",
          "desc": "Réservation directe (sans frais de plateforme), accueil personnalisé, conseil pré-séjour.",
          "name": "Réservation & arrivée",
        },
      ],
      "valeursItems": [
        {
          "desc": "Maison entretenue, équipements pensés.",
          "title": "Cadre soigné",
        },
        {
          "desc": "On vous reçoit, on prend le temps.",
          "title": "Accueil personnel",
        },
        {
          "desc": "Bonnes adresses du coin partagées.",
          "title": "Conseils locaux",
        },
        {
          "desc": "Loin de l'agitation, près de l'essentiel.",
          "title": "Calme assuré",
        },
      ],
      "variant": "gite",
    }
  `) })
  it('camping', () => { expect(TEMPLATES.camping).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *campeurs*.",
        "brandTagline": "Camping · Nature & loisirs",
        "ctaBannerText": "Pour réserver un emplacement, un hébergement, demander des disponibilités ou poser une question, appelez ou écrivez-nous.",
        "ctaBannerTitle": "Une *réservation* ?",
        "footerColonneLabel": "Le camping",
        "heroCtaPrimaire": "Découvrir le camping →",
        "heroEyebrow": [Function],
        "heroLead": "Emplacements, mobil-homes, chalets. Cadre naturel, services pensés, animations en saison. L'envie de vacances vraies, sans usine à touristes.",
        "heroQuote": "Un bon camping, ce n'est pas une usine. C'est un lieu où on se reconnaît d'un séjour à l'autre, où on revient parce qu'on s'y est senti bien.",
        "heroQuoteAuthor": "— L'équipe",
        "heroTitle": "Des vacances *au grand air*, à taille humaine.",
        "histoireLead": "Cadre nature préservé, services soignés, et l'accueil qui fait revenir.",
        "histoireSuptitle": "Le camping",
        "histoireTitle": "Un *camping* qui prend soin de ses campeurs.",
        "navHistoireLabel": "Le camping",
        "navUniversLabel": "Le camping",
        "textePresentation": "Le camping propose plusieurs formules d'hébergement : emplacements pour tentes et caravanes, mobil-homes équipés, chalets bois. Les espaces sont pensés pour préserver la tranquillité : ombrage, distances, zones de jeux séparées. Sur place : sanitaires, espace piscine selon saison, animations pour enfants et adultes. Et autour, des choses à faire — randonnées, baignades, marchés, sites à visiter.",
        "universSectionIntro": "Emplacements pour tentes et caravanes, mobil-homes, chalets : plusieurs formules pour s'adapter à votre séjour. Cadre naturel préservé, services pensés, animations en saison et accueil personnel.",
        "universSectionSuptitle": "LE CAMPING",
        "universSectionTitle": "Des vacances *en pleine nature*, à taille humaine.",
      },
      "palette": {
        "accent": "#E8893E",
        "accentLight": "#eea76e",
        "cream": "#F4F7F1",
        "creamLight": "#f8faf7",
        "creamWarm": "#f8dcc5",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#2F5C3F",
        "primarySoft": "#63856f",
      },
      "universItems": [
        {
          "cat": "Le cœur du métier",
          "desc": "Tentes et caravanes sur emplacements ombragés, mobil-homes équipés, chalets. Plusieurs gammes et tarifs.",
          "name": "Emplacements & hébergements",
        },
        {
          "cat": "Sur place",
          "desc": "Sanitaires soignés, espace piscine en saison, aire de jeux, laverie, wifi, snack selon période.",
          "name": "Services & équipements",
        },
        {
          "cat": "Animations",
          "desc": "Animations enfants, soirées à thème, activités sportives selon période. Programme variable été/hors saison.",
          "name": "Activités en saison",
        },
        {
          "cat": "À côté",
          "desc": "Randonnées, sites naturels, villages à visiter, marchés locaux. Conseils personnalisés à votre arrivée.",
          "name": "À découvrir autour",
        },
        {
          "cat": "Pratique",
          "desc": "Réservation en ligne ou par téléphone. Ouverture saisonnière, tarifs dégressifs selon durée.",
          "name": "Réservation & saison",
        },
      ],
      "valeursItems": [
        {
          "desc": "Emplacements ombragés, espaces préservés.",
          "title": "Cadre nature",
        },
        {
          "desc": "Tentes, caravanes, mobil-homes, chalets.",
          "title": "Hébergements variés",
        },
        {
          "desc": "Activités selon la saison, pour tous âges.",
          "title": "Animations",
        },
        {
          "desc": "À taille humaine, on prend le temps.",
          "title": "Accueil familial",
        },
      ],
      "variant": "camping",
    }
  `) })
})

describe('TEMPLATES — snapshot Annexe F (Fallback générique)', () => {
  it('autre', () => { expect(TEMPLATES.autre).toMatchInlineSnapshot(`
    {
      "defaults": {
        "avisSectionTitre": "Ce qu'en disent nos *clients*.",
        "brandTagline": "Artisan · Savoir-faire local",
        "ctaBannerText": "Un coup de fil ou un message, et on revient vers vous rapidement pour en parler.",
        "ctaBannerTitle": "Une *question*, un projet ?",
        "footerColonneLabel": "L'entreprise",
        "heroCtaPrimaire": "Découvrir notre offre →",
        "heroEyebrow": [Function],
        "heroLead": "Une expertise affirmée, une approche personnalisée, et l'envie de bien faire à chaque rendez-vous. Notre métier, on l'aime — et ça se sent.",
        "heroQuote": "Notre métier, c'est avant tout une relation de confiance. On prend le temps qu'il faut pour faire les choses bien.",
        "heroQuoteAuthor": "— L'équipe",
        "heroTitle": "Un *savoir-faire*, au service de vos projets.",
        "histoireLead": "Une approche simple et soignée, au plus près de vos besoins.",
        "histoireSuptitle": "L'entreprise",
        "histoireTitle": "Une *maison* à votre écoute.",
        "navHistoireLabel": "L'entreprise",
        "navUniversLabel": "Notre offre",
        "textePresentation": "Notre métier, c'est de répondre à vos demandes avec attention et précision. Écoute, conseil, qualité du travail : on met le même soin dans chaque projet. Le but : que vous soyez accompagné sereinement, du premier échange au résultat final.",
        "universSectionIntro": "Notre métier, c'est de vous accompagner avec sérieux et proximité. Découvrez nos prestations, pensées pour répondre concrètement à vos besoins.",
        "universSectionSuptitle": "NOTRE OFFRE",
        "universSectionTitle": "Un savoir-faire, *au service de vos projets*.",
      },
      "palette": {
        "accent": "#95A5A6",
        "accentLight": "#b0bcbc",
        "cream": "#F8F8F8",
        "creamLight": "#fbfbfb",
        "creamWarm": "#dfe4e4",
        "ink": "#1A1612",
        "inkMuted": "#7A6E60",
        "inkSoft": "#4A3F35",
        "primary": "#2C3E50",
        "primarySoft": "#616e7c",
      },
      "universItems": [
        {
          "cat": "Notre signature",
          "desc": "Le cœur de notre métier, ce qui nous distingue et ce qu'on fait au quotidien.",
          "name": "Notre spécialité",
        },
        {
          "cat": "Sur mesure",
          "desc": "Chaque demande est unique : on s'adapte à votre situation et à vos contraintes.",
          "name": "Adapté à vos besoins",
        },
        {
          "cat": "Conseil",
          "desc": "Avant, pendant, après : on prend le temps de l'échange à chaque étape.",
          "name": "Accompagnement personnalisé",
        },
        {
          "cat": "Suivi",
          "desc": "Une relation qui s'installe dans la durée, pas juste une transaction.",
          "name": "Avant et après",
        },
        {
          "cat": "Pratique",
          "desc": "Par téléphone, par message ou en venant nous voir : c'est comme vous préférez.",
          "name": "Prise de contact",
        },
      ],
      "valeursItems": [
        {
          "desc": "Une expertise affirmée dans notre métier.",
          "title": "Savoir-faire",
        },
        {
          "desc": "À votre écoute, au plus près de vos besoins.",
          "title": "Proximité",
        },
        {
          "desc": "Des prestations soignées et durables.",
          "title": "Qualité",
        },
        {
          "desc": "Un accompagnement honnête et fiable.",
          "title": "Engagement",
        },
      ],
      "variant": "autre",
    }
  `) })
})
