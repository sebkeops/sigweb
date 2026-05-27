import type { ProspectCategorie } from '@/types'

/**
 * Mots-clés Unsplash structurés **par bloc de rendu** pour le générateur
 * de simulations publiques (Phase 5).
 *
 * Histoire et intention :
 *
 * En première version (Phase 5 v1), on faisait 1-2 appels Unsplash par
 * catégorie globale et on dispatchait les 7 photos retournées au hasard
 * dans les 7 slots. Résultat : une photo de boulanger se retrouvait
 * dans le bloc "Pâtisseries", une viennoiserie dans "Pains au levain",
 * etc. — incohérence totale entre l'image et son sous-thème éditorial.
 *
 * Refactor (Phase 5 v2) : un pool de mots-clés DEDIE par slot de rendu,
 * pour que `unsplash.ts` puisse faire un appel ciblé bloc par bloc.
 * Structure :
 *
 *   - `hero`     : devanture / vue d'ensemble du commerce
 *   - `histoire` : artisan au travail, équipe, savoir-faire
 *   - `univers`  : tuple **positionnel** à 5 entrées, aligné sur l'ordre
 *                  des `template.universItems[]` de la catégorie. Le slot
 *                  `univers_N` consomme `univers[N-1]`.
 *
 * Garde-fou contre la dérive : un test unitaire (`unsplashKeywords.test.ts`)
 * vérifie que `univers.length === template.universItems.length === 5` pour
 * les 34 catégories. Si un jour on reorganise un preset (ex: passer à 6
 * univers), le test pète au build/CI au lieu de laisser des images
 * silencieusement décalées d'un cran côté visiteur.
 */

/** Pool de mots-clés Unsplash pour un slot donné — 2 à 5 keywords. */
type KeywordPool = readonly string[]

/** Tuple positionnel des 5 pools `univers`, aligné sur `template.universItems`. */
type UniversKeywords = readonly [KeywordPool, KeywordPool, KeywordPool, KeywordPool, KeywordPool]

export interface CategoryUnsplashKeywords {
  hero: KeywordPool
  histoire: KeywordPool
  univers: UniversKeywords
}

/**
 * Map central : 34 catégories × {hero, histoire, univers[5]}.
 *
 * Convention : 2-3 mots-clés par pool, anglais (couverture API meilleure),
 * concrets (`bakery interior` plutôt que `artisanal`).
 *
 * IMPORTANT : l'ordre des entrées `univers` doit correspondre exactement
 * à l'ordre des `universItems` du preset. Un commentaire `// 1.` à `// 5.`
 * rappelle le titre attendu pour chaque slot, vérifié par le test
 * `unsplashKeywords.test.ts`.
 */
export const UNSPLASH_KEYWORDS_BY_CATEGORIE: Record<ProspectCategorie, CategoryUnsplashKeywords> = {
  // ── Famille bouche ────────────────────────────────────────────────

  boulangerie: {
    hero:     ['french bakery storefront', 'artisan bakery interior', 'bakery display'],
    histoire: ['baker kneading dough', 'baker at work', 'flour artisan hands'],
    univers: [
      ['sourdough bread', 'levain bread', 'rustic bread loaves'],            // 1. Pains au levain
      ['croissant', 'pain au chocolat', 'french viennoiserie'],              // 2. Viennoiseries
      ['french pastry', 'eclair pastry', 'mille feuille tart'],              // 3. Pâtisseries
      ['birthday cake', 'celebration cake', 'layer cake'],                   // 4. Gâteaux d'événement
      ['sandwich quiche', 'savory snack bakery', 'baguette sandwich'],       // 5. Snacks & sandwichs
    ],
  },

  boucherie: {
    hero:     ['butcher shop storefront', 'butcher shop interior', 'meat display counter'],
    histoire: ['butcher at work', 'butcher cutting meat', 'butcher artisan'],
    univers: [
      ['aged beef steak', 'beef cuts ribeye', 'matured meat'],               // 1. Bœuf maturé
      ['free range chicken', 'poultry farm', 'roast duck'],                  // 2. Volaille fermière
      ['homemade charcuterie', 'sausages terrine', 'pate rillettes'],        // 3. Charcuterie maison
      ['bbq platter meat', 'meat assortment platter', 'barbecue selection'], // 4. Lots & plateaux
      ['cooked stew dish', 'beef bourguignon', 'lasagna home cooking'],      // 5. Plats préparés
    ],
  },

  restaurant: {
    hero:     ['french restaurant interior', 'bistro dining room', 'restaurant table setting'],
    histoire: ['chef cooking', 'restaurant kitchen team', 'chef plating dish'],
    univers: [
      ['plated french dish', 'gourmet dish restaurant', 'seasonal menu plate'],     // 1. Notre carte
      ['daily special blackboard', 'restaurant chalkboard menu', 'plat du jour'],   // 2. Plat du jour
      ['business lunch plate', 'lunch menu bistro', 'quick lunch dish'],            // 3. Menu midi
      ['restaurant private event', 'wine tasting dinner', 'themed dinner'],         // 4. Soirées spéciales
      ['takeaway food box', 'restaurant takeout container', 'food to go'],          // 5. À emporter
    ],
  },

  pizzeria: {
    hero:     ['pizzeria interior', 'wood fired pizza oven', 'italian restaurant'],
    histoire: ['pizzaiolo at work', 'pizza dough stretching', 'chef preparing pizza'],
    univers: [
      ['margherita pizza', 'wood fired pizza', 'italian pizza signature'],         // 1. Nos pizzas signatures
      ['italian antipasti', 'burrata appetizer', 'parma ham platter'],             // 2. Antipasti
      ['tiramisu dessert', 'panna cotta', 'italian dessert'],                      // 3. Desserts maison
      ['pizza takeout box', 'pizza to go', 'takeaway pizza'],                      // 4. À emporter
      ['pizza delivery moped', 'pizza delivery box', 'food delivery'],             // 5. Livraison
    ],
  },

  primeur: {
    hero:     ['greengrocer storefront', 'fruit shop display', 'vegetable market'],
    histoire: ['greengrocer arranging produce', 'fresh produce market', 'farmer at market'],
    univers: [
      ['seasonal vegetables crate', 'heirloom tomatoes', 'fresh vegetables market'],   // 1. Fruits & légumes de saison
      ['local farm vegetables', 'farmer market produce', 'farm fresh harvest'],        // 2. Circuits courts
      ['gourmet grocery shelf', 'eggs cheese counter', 'local honey jars'],            // 3. Épicerie complémentaire
      ['gift fruit basket', 'gourmet hamper', 'fruit gift box'],                       // 4. Paniers & événements
      ['cooking vegetables fresh', 'kitchen herbs preparation', 'home cooking veg'],   // 5. Conseils cuisine
    ],
  },

  fromager: {
    hero:     ['cheese shop interior', 'cheese counter display', 'fromager storefront'],
    histoire: ['cheese affineur at work', 'aging cheese cellar', 'cheesemonger'],
    univers: [
      ['aged cheese wheel', 'cheese cave aging', 'comte gruyere'],                     // 1. Fromages affinés sur place
      ['farm cheese goat', 'artisan cheese maker', 'fresh chevre'],                    // 2. Fromages fermiers
      ['cheese platter', 'cheese board assortment', 'cheese tasting plate'],           // 3. Plateaux de fromages
      ['wine and cheese pairing', 'bread cheese honey', 'cheese accompaniment'],       // 4. Vins & accompagnements
      ['cheese tasting counter', 'cheesemonger advising', 'cheese sampling'],          // 5. Conseil & dégustation
    ],
  },

  caviste: {
    hero:     ['wine shop interior', 'wine cellar shelves', 'caviste storefront'],
    histoire: ['sommelier at work', 'wine merchant tasting', 'caviste advising'],
    univers: [
      ['wine bottles selection', 'wine shop display', 'wine cellar'],                  // 1. Notre sélection
      ['vineyard wine grape', 'winemaker vineyard', 'organic wine producer'],          // 2. Vignerons engagés
      ['new wine arrivals', 'fresh wine release', 'wine bottle display'],              // 3. Nouveautés du mois
      ['craft beer selection', 'whisky bottles', 'spirits bar shelf'],                 // 4. Spiritueux & bières
      ['wine tasting glass', 'wine sommelier serving', 'wine flight tasting'],         // 5. Conseils & dégustations
    ],
  },

  bar_cafe: {
    hero:     ['french cafe terrace', 'parisian cafe', 'cafe storefront'],
    histoire: ['barista pouring coffee', 'bartender cocktail', 'cafe staff'],
    univers: [
      ['espresso cappuccino latte', 'coffee cup foam', 'latte art'],                   // 1. Cafés & boissons
      ['lunch plate cafe', 'daily lunch special', 'cafe menu plate'],                  // 2. Formule du jour
      ['charcuterie board appetizer', 'tapas platter', 'small plates wine'],           // 3. Planches & tapas
      ['wine bar glasses', 'craft beer tap', 'cocktail mixology'],                     // 4. Vins, bières & spiritueux
      ['private event cafe', 'birthday party cafe', 'wedding cocktail venue'],         // 5. Privatisation & événements
    ],
  },

  traiteur: {
    hero:     ['catering buffet display', 'gourmet platter spread', 'event catering setup'],
    histoire: ['caterer preparing food', 'chef plating canapes', 'catering kitchen team'],
    univers: [
      ['cocktail canapes', 'buffet hors d oeuvres', 'finger food platter'],            // 1. Cocktails & buffets
      ['wedding catering table', 'wedding buffet elegant', 'reception food'],          // 2. Mariages & cérémonies
      ['corporate lunch boxes', 'business buffet', 'seminar catering'],                // 3. Repas pro & séminaires
      ['gourmet meal box', 'catering lunch box', 'food platter delivery'],             // 4. Plateaux & box
      ['caterer planning event', 'catering quote meeting', 'event consultation'],      // 5. Devis & rendez-vous
    ],
  },

  chocolatier: {
    hero:     ['chocolate shop interior', 'chocolatier storefront', 'chocolate display case'],
    histoire: ['chocolatier crafting truffles', 'chocolate making artisan', 'chocolate tempering'],
    univers: [
      ['chocolate gift box', 'pralines assortment', 'chocolate ballotin'],             // 1. Ballotins & assortiments
      ['easter chocolate eggs', 'christmas chocolate', 'seasonal chocolate'],          // 2. Collections saisonnières
      ['caramel candy artisan', 'marshmallow nougat', 'french confectionery'],         // 3. Confiseries maison
      ['personalized chocolate', 'chocolate sculpture', 'custom chocolate logo'],      // 4. Pièces personnalisées
      ['chocolate tasting flight', 'chocolatier advising', 'cocoa tasting'],           // 5. Conseil & dégustation
    ],
  },

  epicerie_fine: {
    hero:     ['gourmet grocery interior', 'delicatessen storefront', 'fine food shop'],
    histoire: ['shopkeeper artisan products', 'gourmet shop owner', 'deli counter staff'],
    univers: [
      ['terroir products jars', 'french gourmet specialties', 'regional artisan food'], // 1. Spécialités du terroir
      ['olive oil bottles', 'spice jars selection', 'vinegar bottles'],                // 2. Huiles, vinaigres & épices
      ['local wine bottles', 'craft spirits artisan', 'regional wine selection'],      // 3. Vins & spiritueux locaux
      ['gourmet gift hamper', 'food gift basket', 'custom food box'],                  // 4. Coffrets sur mesure
      ['food tasting counter', 'gourmet sampling', 'shopkeeper advising customer'],    // 5. Dégustations & conseil
    ],
  },

  // ── Services à la personne ────────────────────────────────────────

  coiffeur: {
    hero:     ['hair salon interior', 'modern hair salon', 'salon styling chair'],
    histoire: ['hairdresser at work', 'hair stylist cutting', 'salon hairdresser'],
    univers: [
      ['haircut woman man', 'hair styling client', 'salon haircut scissors'],          // 1. Coupes femme & homme
      ['hair coloring foil', 'hair highlights', 'hair dye salon'],                     // 2. Coloration & mèches
      ['hair treatment mask', 'hair care products', 'shampoo bowl salon'],             // 3. Soins capillaires
      ['bridal hairstyle', 'wedding hair updo', 'elegant hair styling'],               // 4. Coiffures mariage & cérémonie
      ['salon appointment booking', 'salon receptionist', 'hair salon waiting'],       // 5. Rendez-vous & infos
    ],
  },

  esthetique: {
    hero:     ['beauty salon interior', 'spa lounge', 'esthetic clinic'],
    histoire: ['esthetician facial treatment', 'beautician at work', 'spa therapist'],
    univers: [
      ['facial treatment spa', 'face mask skincare', 'beauty facial'],                 // 1. Soins du visage
      ['body massage spa', 'relaxing massage', 'spa body treatment'],                  // 2. Soins corps & massages
      ['manicure pedicure salon', 'nail polish salon', 'waxing salon'],                // 3. Mains, pieds, épilations
      ['beauty gift box', 'spa gift card', 'beauty products gift'],                    // 4. Coffrets & bons cadeaux
      ['spa booking calendar', 'beauty salon reception', 'spa membership'],            // 5. Rendez-vous & abonnements
    ],
  },

  kine: {
    hero:     ['physiotherapy clinic', 'physical therapy room', 'rehabilitation studio'],
    histoire: ['physiotherapist treating patient', 'physio session', 'therapist hands'],
    univers: [
      ['rehabilitation exercise', 'physical therapy session', 'recovery training'],    // 1. Rééducation fonctionnelle
      ['back pain treatment', 'neck pain therapy', 'spine treatment'],                 // 2. Lombalgies, cervicalgies
      ['posture assessment', 'spine alignment check', 'body posture analysis'],        // 3. Bilan postural
      ['sports physiotherapy', 'athlete physio treatment', 'sports injury therapy'],   // 4. Kiné du sport
      ['medical appointment booking', 'clinic reception desk', 'patient consultation'], // 5. Rendez-vous & infos
    ],
  },

  osteopathe: {
    hero:     ['osteopathy clinic', 'osteopath treatment room', 'holistic clinic'],
    histoire: ['osteopath manual therapy', 'osteopath session', 'holistic practitioner'],
    univers: [
      ['back pain manual therapy', 'chronic pain treatment', 'spinal manipulation'],    // 1. Douleurs aiguës & chroniques
      ['pregnancy massage', 'infant osteopathy', 'pediatric therapy'],                  // 2. Suivi périnatal & nourrissons
      ['sports therapy session', 'athlete recovery', 'sports injury treatment'],        // 3. Ostéopathie du sport
      ['relaxation therapy session', 'tension release treatment', 'wellness session'],  // 4. Troubles fonctionnels
      ['practitioner appointment', 'healthcare booking calendar', 'medical reception'], // 5. Rendez-vous & tarifs
    ],
  },

  praticien_bien_etre: {
    hero:     ['wellness studio', 'meditation room', 'holistic wellness space'],
    histoire: ['wellness practitioner', 'therapist welcoming client', 'holistic guide'],
    univers: [
      ['one on one therapy session', 'individual coaching', 'personal wellness session'], // 1. Séances individuelles
      ['first meeting consultation', 'introductory wellness session', 'client welcome'],   // 2. Première rencontre
      ['ongoing therapy support', 'regular wellness practice', 'mindfulness routine'],     // 3. Accompagnement régulier
      ['group meditation', 'wellness workshop circle', 'yoga group studio'],               // 4. Groupes & ateliers
      ['wellness pricing brochure', 'practitioner schedule', 'session calendar'],          // 5. Modalités
    ],
  },

  cabinet: {
    hero:     ['professional office', 'consulting office interior', 'modern workplace'],
    histoire: ['consultant meeting client', 'professional advisor', 'office team'],
    univers: [
      ['client consultation meeting', 'advisor explaining strategy', 'business consultation'], // 1. Conseil sur mesure
      ['business documents folder', 'professional paperwork', 'office desk planning'],          // 2. Domaines d'intervention
      ['personal advisor meeting', 'private consultation', 'individual coaching'],              // 3. Accompagnement particuliers
      ['team business meeting', 'corporate boardroom', 'company workshop'],                     // 4. Accompagnement entreprises
      ['office appointment calendar', 'business meeting handshake', 'professional reception'],  // 5. Rendez-vous & honoraires
    ],
  },

  // ── Bâtiment & artisanat ──────────────────────────────────────────

  menuisier: {
    hero:     ['woodworking workshop', 'carpenter workbench', 'wood furniture display'],
    histoire: ['carpenter working wood', 'woodworker artisan hands', 'joiner crafting'],
    univers: [
      ['custom wood furniture', 'handcrafted wooden table', 'wood furniture maker'],            // 1. Mobilier sur mesure
      ['custom kitchen wood', 'wooden cabinets installation', 'built in wardrobe'],             // 2. Cuisines & rangements
      ['wooden staircase', 'wood and glass interior', 'custom staircase'],                      // 3. Escaliers & verrières
      ['wooden deck terrace', 'wood cladding facade', 'timber deck'],                           // 4. Terrasses & bardages
      ['carpenter blueprint workshop', 'wood project plan', 'craftsman estimating'],            // 5. Devis & atelier
    ],
  },

  plombier: {
    hero:     ['plumber tools workshop', 'plumbing pipes installation', 'plumber working'],
    histoire: ['plumber at work', 'plumber repairing pipe', 'plumber fixing sink'],
    univers: [
      ['plumber emergency repair', 'leaking pipe fix', 'plumber tools box'],                    // 1. Dépannage plomberie
      ['modern bathroom installation', 'bathtub installation', 'shower installation'],          // 2. Sanitaires & salles d'eau
      ['water heater installation', 'gas boiler', 'home heating system'],                       // 3. Chaudières & chauffe-eau
      ['copper pipes plumbing', 'plumbing network install', 'pipe fittings work'],              // 4. Réseaux & raccordements
      ['plumber writing quote', 'emergency plumber call', 'plumber estimating job'],            // 5. Devis & urgence
    ],
  },

  electricien: {
    hero:     ['electrician at work', 'electrical wiring installation', 'electric panel'],
    histoire: ['electrician with tools', 'electrician inspecting wiring', 'electrical work'],
    univers: [
      ['home electrical wiring', 'new electrical install', 'electrician working wires'],        // 1. Installation électrique
      ['electrical compliance check', 'circuit breaker panel', 'electrical inspection'],        // 2. Mise aux normes
      ['electrical fault repair', 'emergency electrical work', 'electrician troubleshooting'],  // 3. Pannes & urgences
      ['home automation system', 'smart home device install', 'modern lighting design'],        // 4. Domotique & éclairage
      ['electrician writing quote', 'electrical project plan', 'wiring blueprint'],             // 5. Devis & garantie
    ],
  },

  peintre: {
    hero:     ['painter at work', 'wall painting roller', 'painted modern interior'],
    histoire: ['painter painting wall', 'painter with brushes', 'craftsman painter'],
    univers: [
      ['interior wall painting', 'room paint roller', 'home interior renovation'],              // 1. Peinture intérieure
      ['facade painting house', 'wood window painting', 'exterior house paint'],                // 2. Façades & boiseries ext.
      ['decorative wall finish', 'stencil wall decoration', 'fresco decorative paint'],         // 3. Décors & finitions
      ['wall preparation sanding', 'plastering wall repair', 'priming wall'],                   // 4. Préparation lourde
      ['painter color samples', 'paint sample palette', 'home interior consultation'],          // 5. Conseil & devis
    ],
  },

  paysagiste: {
    hero:     ['landscape garden design', 'beautiful garden', 'professional landscaping'],
    histoire: ['landscaper at work', 'gardener planting', 'landscape designer garden'],
    univers: [
      ['garden design new', 'modern landscape garden', 'landscaped backyard'],                  // 1. Création de jardin
      ['outdoor terrace patio', 'garden pathway stones', 'wooden garden deck'],                 // 2. Terrasses & extérieurs
      ['garden flower planting', 'planting flowers landscape', 'plant nursery'],                // 3. Plantations sur mesure
      ['lawn mowing service', 'hedge trimming', 'garden maintenance'],                          // 4. Entretien & contrats
      ['garden planning blueprint', 'landscape consultation', 'garden design sketch'],          // 5. Conseil & devis
    ],
  },

  macon: {
    hero:     ['mason at work', 'construction site', 'stonemason building'],
    histoire: ['mason laying bricks', 'stonemason crafting', 'mason building wall'],
    univers: [
      ['masonry brick wall', 'concrete construction', 'stone wall building'],                   // 1. Maçonnerie générale
      ['house extension construction', 'home addition build', 'second floor addition'],         // 2. Extensions & surélévations
      ['stone patio construction', 'paving stones installation', 'concrete patio'],             // 3. Terrasses & dallages
      ['foundation repair structural', 'load bearing wall', 'structural masonry'],              // 4. Reprise structure
      ['mason blueprint planning', 'construction site estimate', 'mason quote'],                // 5. Devis & accompagnement
    ],
  },

  couvreur: {
    hero:     ['roofer at work', 'house roof tiles', 'roofing professional'],
    histoire: ['roofer installing tiles', 'roof worker', 'roofer on roof'],
    univers: [
      ['roof tile installation', 'metal roofing zinc', 'roof gutters install'],                 // 1. Couverture & zinguerie
      ['wooden roof framing', 'traditional timber frame', 'roof beams construction'],           // 2. Charpente traditionnelle
      ['new roof installation', 'roof renovation', 'complete roof replacement'],                // 3. Réfection complète
      ['roof leak repair', 'storm damage roof', 'roofer emergency'],                            // 4. Dépannage toiture
      ['roof inspection report', 'roof assessment', 'roofer estimating job'],                   // 5. Diagnostic & devis
    ],
  },

  carreleur: {
    hero:     ['tile installer at work', 'modern tiled bathroom', 'tile flooring'],
    histoire: ['tile setter laying tiles', 'tiler working', 'craftsman tiling'],
    univers: [
      ['floor tile installation', 'wall tile installation', 'tiling work'],                     // 1. Pose sol & mur
      ['modern bathroom tiles', 'walk in shower tiles', 'bathroom renovation'],                 // 2. Salles de bains complètes
      ['outdoor tiled terrace', 'patio tile installation', 'stone tile patio'],                 // 3. Terrasses & dallages
      ['mosaic tile floor', 'subway tile pattern', 'ceramic tile design'],                      // 4. Faïences & mosaïques
      ['tile samples palette', 'tile catalog selection', 'tile shop consultation'],             // 5. Conseil & devis
    ],
  },

  piscinier: {
    hero:     ['backyard swimming pool', 'modern pool design', 'pool construction'],
    histoire: ['pool builder at work', 'pool installation crew', 'pool craftsman'],
    univers: [
      ['new swimming pool construction', 'pool installation', 'inground pool build'],           // 1. Construction neuve
      ['pool renovation cleaning', 'pool refurbishment', 'pool equipment upgrade'],             // 2. Rénovation & rééquipement
      ['pool maintenance service', 'pool cleaning technician', 'pool care annual'],             // 3. Forfaits annuels
      ['pool repair technician', 'pool pump repair', 'pool service call'],                      // 4. Interventions ponctuelles
      ['pool design blueprint', 'pool quote estimate', 'pool planning meeting'],                // 5. Devis & accompagnement
    ],
  },

  // ── Commerces & services ──────────────────────────────────────────

  photographe: {
    hero:     ['photographer studio', 'professional camera setup', 'photo studio interior'],
    histoire: ['photographer shooting', 'photographer with camera', 'studio photographer'],
    univers: [
      ['portrait photo session', 'family portrait outdoor', 'studio portrait'],                 // 1. Portrait & famille
      ['wedding photographer', 'wedding ceremony photo', 'bride groom photo'],                  // 2. Mariages & cérémonies
      ['pregnancy maternity photo', 'newborn baby photoshoot', 'child portrait'],               // 3. Grossesse, naissance, enfance
      ['corporate headshot', 'product photography setup', 'commercial photography'],            // 4. Photographie professionnelle
      ['photo album book', 'photo printing service', 'photographer pricing brochure'],          // 5. Tarifs & livraison
    ],
  },

  fleuriste: {
    hero:     ['florist shop interior', 'flower shop storefront', 'flower arrangement display'],
    histoire: ['florist arranging flowers', 'florist at work', 'flower designer hands'],
    univers: [
      ['fresh flower bouquet', 'colorful flower arrangement', 'seasonal bouquet'],              // 1. Bouquets du moment
      ['custom flower bouquet', 'bespoke floral design', 'personalized bouquet'],               // 2. Bouquets personnalisés
      ['wedding flowers ceremony', 'bridal bouquet', 'wedding floral arrangement'],             // 3. Mariages & cérémonies
      ['funeral flower arrangement', 'sympathy bouquet', 'memorial wreath'],                    // 4. Fleurs de deuil
      ['flower delivery van', 'flower delivery service', 'flowers gift delivery'],              // 5. Livraison
    ],
  },

  bijoutier: {
    hero:     ['jewelry shop interior', 'jeweler storefront', 'jewelry display case'],
    histoire: ['jeweler at work', 'jewelry maker', 'goldsmith crafting'],
    univers: [
      ['gold silver rings', 'fine jewelry display', 'gemstone necklace'],                       // 1. Bijoux or & argent
      ['luxury watch display', 'watchmaker repair', 'wristwatch fine'],                         // 2. Montres & entretien
      ['custom jewelry making', 'bespoke ring design', 'goldsmith bench'],                      // 3. Créations personnalisées
      ['jewelry repair workshop', 'jeweler restoring ring', 'jewelry polishing'],               // 4. Réparations & rénovations
      ['jeweler advising customer', 'jewelry appraisal', 'jeweler appointment'],                // 5. Rendez-vous & estimation
    ],
  },

  librairie: {
    hero:     ['bookstore interior', 'independent bookshop', 'library shelves books'],
    histoire: ['bookseller in library', 'librarian advising reader', 'bookstore owner'],
    univers: [
      ['novel literature stack', 'fiction book display', 'literary classics'],                  // 1. Romans & littérature
      ['nonfiction books history', 'philosophy books shelf', 'science books library'],          // 2. Essais & sciences humaines
      ['children books picture', 'kids reading library', 'children bookshelf'],                 // 3. Albums, romans, BD jeunesse
      ['regional history books', 'local author writing', 'travel guide books'],                 // 4. Livres du terroir & auteurs locaux
      ['author book signing', 'literary reading event', 'bookstore event'],                     // 5. Commandes & événements
    ],
  },

  garagiste: {
    hero:     ['car mechanic garage', 'auto repair shop', 'mechanic workshop'],
    histoire: ['mechanic working on car', 'car mechanic hands', 'auto mechanic at work'],
    univers: [
      ['car maintenance oil change', 'mechanic inspecting car', 'auto service'],                // 1. Entretien & révision
      ['car engine repair', 'mechanic fixing engine', 'auto mechanic work'],                    // 2. Mécanique générale
      ['tire change service', 'car tires garage', 'wheel alignment'],                           // 3. Pneumatiques
      ['car inspection test', 'vehicle technical check', 'auto inspection'],                    // 4. Préparation contrôle technique
      ['tow truck service', 'roadside assistance', 'broken down car'],                          // 5. Dépannage
    ],
  },

  // ── Hébergement ───────────────────────────────────────────────────

  gite: {
    hero:     ['french countryside cottage', 'rural guesthouse exterior', 'gite gite stone house'],
    histoire: ['cottage owner welcoming', 'innkeeper hosting', 'guesthouse host'],
    univers: [
      ['cozy cottage interior', 'rustic stone house bedroom', 'charming guest room'],           // 1. L'hébergement
      ['cottage kitchen amenities', 'guesthouse common room', 'rural retreat amenities'],      // 2. Équipements & services
      ['french countryside landscape', 'occitanie rural village', 'rural french hills'],        // 3. Le coin & ses richesses
      ['romantic weekend retreat', 'family vacation house', 'getaway cottage stay'],            // 4. Formules & séjours
      ['cottage check in welcome', 'guesthouse arrival', 'booking innkeeper'],                  // 5. Réservation & arrivée
    ],
  },

  camping: {
    hero:     ['campsite france', 'camping ground', 'camping pitch nature'],
    histoire: ['campsite owner welcoming', 'camping host', 'campsite manager'],
    univers: [
      ['tent pitch camping', 'mobile home camping', 'glamping cabin'],                          // 1. Emplacements & hébergements
      ['campsite facilities pool', 'campsite shower block', 'campsite reception'],              // 2. Services & équipements
      ['campsite swimming pool', 'campsite kids playground', 'camping activities summer'],      // 3. Activités en saison
      ['hiking trail nature', 'cycling countryside', 'tourism rural france'],                   // 4. À découvrir autour
      ['camping reception booking', 'campsite check in', 'camping reservation'],                // 5. Réservation & saison
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────

  autre: {
    hero:     ['small local shop', 'french storefront', 'artisan workshop'],
    histoire: ['craftsman at work', 'small business owner', 'artisan welcoming'],
    univers: [
      ['artisan specialty product', 'handmade craft', 'local artisan shop'],                    // 1. Notre spécialité
      ['custom product order', 'tailored service', 'personalized craft'],                       // 2. Adapté à vos besoins
      ['business owner advising', 'customer service personal', 'shopkeeper meeting'],           // 3. Accompagnement personnalisé
      ['before after renovation', 'transformation project', 'comparison results'],              // 4. Avant et après
      ['business meeting handshake', 'shop owner welcoming', 'first appointment'],              // 5. Prise de contact
    ],
  },
}

/**
 * Helper qui retourne le pool de mots-clés pour un slot donné, avec
 * fallback en cas de slot inconnu (ne devrait pas arriver vu que le
 * type oblige les 5 univers à être renseignés).
 */
export function getKeywordsForSlot(
  categoryId: ProspectCategorie,
  slot: 'hero' | 'histoire' | 'univers_1' | 'univers_2' | 'univers_3' | 'univers_4' | 'univers_5'
): KeywordPool {
  const cat = UNSPLASH_KEYWORDS_BY_CATEGORIE[categoryId]
  if (slot === 'hero') return cat.hero
  if (slot === 'histoire') return cat.histoire
  const index = parseInt(slot.split('_')[1] as string, 10) - 1
  return cat.univers[index] ?? cat.histoire // fallback paranoid sur histoire si index invalide
}
