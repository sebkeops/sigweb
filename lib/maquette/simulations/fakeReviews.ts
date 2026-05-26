import type { ProspectCategorie, GoogleReviewItem, MaquetteAvisItem } from '@/types'
import type { Prng } from './prng'

/**
 * Générateur d'avis fictifs pour les simulations publiques.
 *
 * Stratégie "templates 3 niveaux" : chaque avis est composé d'une phrase
 * d'**opening** (générique), d'une phrase de **body** (spécifique au métier),
 * et d'une phrase de **closing** (générique). On varie les longueurs (1, 2
 * ou 3 phrases) et on évite la répétition d'opening dans une même simulation.
 *
 * Pas d'appel LLM : suffisamment crédible pour de la démonstration et
 * 100 % reproductible via PRNG seedable.
 *
 * Sortie : à la fois le format `GoogleReviewItem[]` (stocké dans
 * `prospect.google_reviews` du payload simulation) ET le format
 * `MaquetteAvisItem[]` (stocké dans `maquette.avis_items`, ce qui prend
 * le pas sur les google_reviews côté rendu — cf. `Avis.tsx:50`).
 */

// ─── Pools d'auteurs (différents de fakeBusiness pour varier) ──────────

const AUTEURS = [
  'Sophie L.', 'Marc D.', 'Caroline B.', 'Pierre M.', 'Élodie P.',
  'Jean-Luc R.', 'Nathalie C.', 'Sébastien V.', 'Aurélie T.', 'Thomas G.',
  'Marie-Claude D.', 'Stéphanie F.', 'Olivier H.', 'Céline B.', 'Jérôme P.',
  'Sandrine M.', 'Hugo L.', 'Mathilde R.', 'Alexandre D.', 'Laetitia G.',
  'Bruno T.', 'Émilie C.', 'Christophe B.', 'Anne-Sophie M.', 'Vincent L.',
  'Florence P.', 'Damien D.', 'Pauline R.', 'Frédéric G.', 'Léa T.',
] as const

// ─── Pools de phrases 3 niveaux ────────────────────────────────────────

const OPENINGS = [
  'Excellente expérience',
  'Je recommande vivement',
  'Très satisfaite',
  'Une adresse incontournable',
  'Très bon accueil',
  'Service impeccable',
  'Rien à redire',
  'Une vraie découverte',
  'Une excellente adresse',
  'Que du plaisir',
  'Bravo pour le sérieux',
  'Très professionnels',
  'Un grand merci',
  'Coup de cœur',
] as const

const CLOSINGS = [
  'Je reviendrai sans hésiter.',
  'À recommander sans hésiter.',
  'Un grand merci !',
  'Merci pour votre professionnalisme.',
  'C\'est devenu une habitude.',
  'On y revient avec plaisir.',
  'Adresse à conserver.',
  'Une équipe à l\'écoute, bravo.',
  'Continuez ainsi !',
  'Vraiment top.',
] as const

/**
 * Pools de phrases de corps par catégorie. ~6-10 par métier exposé.
 * Pour les catégories sans pool dédié, on tombe sur DEFAULT_BODIES.
 */
const BODIES_BY_CATEGORIE: Partial<Record<ProspectCategorie, readonly string[]>> = {
  boulangerie: [
    'Le pain est croustillant et savoureux.',
    'Les viennoiseries sont un délice, vraiment fraîches.',
    'Une vraie boulangerie artisanale.',
    'Les baguettes tradition sont parfaites.',
    'La galette des rois était excellente cette année.',
    'Le pain au levain a un goût incomparable.',
    'Les pâtisseries sont fines et bien dosées en sucre.',
    'Belle gamme de pains spéciaux.',
  ],
  boucherie: [
    'La viande est de très bonne qualité.',
    'Les conseils pour la cuisson sont précieux.',
    'Le bœuf du Gers est fondant à souhait.',
    'Charcuterie maison délicieuse.',
    'La traçabilité est rassurante, on sait d\'où ça vient.',
    'Sélection de produits du terroir au top.',
    'Les saucisses sont parfaites pour les barbecues.',
  ],
  restaurant: [
    'La cuisine est inventive et les produits frais.',
    'Une carte qui change avec les saisons, c\'est appréciable.',
    'Le rapport qualité-prix est imbattable.',
    'Le chef sait mettre en valeur les produits du terroir.',
    'Le menu du jour est toujours une belle surprise.',
    'Cadre agréable et service attentionné.',
    'Belle sélection de vins locaux.',
  ],
  pizzeria: [
    'Les pizzas sont fines et bien garnies.',
    'Cuisson au feu de bois, on sent la différence.',
    'La pâte est délicieuse, légère et croustillante.',
    'Les produits sont frais et bien dosés.',
    'Pizza margherita fidèle aux saveurs italiennes.',
    'Service rapide même en plein coup de feu.',
  ],
  primeur: [
    'Des fruits et légumes de qualité, souvent locaux.',
    'On sent que les produits sont sélectionnés avec soin.',
    'Beaucoup de produits du Gers et des environs.',
    'Conseils précieux sur les variétés de saison.',
    'Les tomates anciennes sont incroyables.',
  ],
  fromager: [
    'Belle sélection de fromages affinés.',
    'Le fromager connaît parfaitement ses produits.',
    'Conseils précieux sur les accords.',
    'On y trouve de vraies pépites artisanales.',
  ],
  caviste: [
    'Belle sélection de vins, surtout en local.',
    'Conseils avisés selon le budget et les goûts.',
    'On y fait toujours de belles découvertes.',
    'Le sommelier sait écouter et orienter.',
  ],
  bar_cafe: [
    'Cadre chaleureux et café de qualité.',
    'Belle terrasse, idéal en été.',
    'Ambiance conviviale, on s\'y sent bien.',
    'Le café est savoureux et le service rapide.',
  ],
  traiteur: [
    'Les plats sont délicieux et bien présentés.',
    'Une prestation soignée pour notre événement.',
    'Le service est ponctuel et professionnel.',
    'La qualité des produits se ressent dans chaque bouchée.',
  ],
  chocolatier: [
    'Les chocolats sont d\'une grande finesse.',
    'On sent le travail d\'artisan, c\'est rare.',
    'Belle créativité dans les saveurs.',
    'Les ballotins sont parfaits pour offrir.',
  ],
  epicerie_fine: [
    'Belle sélection de produits du terroir.',
    'On y trouve toujours des cadeaux gourmands originaux.',
    'Conseils précieux pour bien choisir.',
  ],
  coiffeur: [
    'Très à l\'écoute de mes envies.',
    'La coupe correspond parfaitement à ce que je voulais.',
    'Un salon zen et soigné.',
    'Bons conseils sur les soins capillaires.',
    'Coloration impeccable, naturelle.',
  ],
  esthetique: [
    'L\'institut est propre, l\'accueil très agréable.',
    'Soins du visage de grande qualité.',
    'L\'esthéticienne est douce et professionnelle.',
    'Cadre apaisant, vraiment relaxant.',
  ],
  kine: [
    'Diagnostic précis et prise en charge sérieuse.',
    'Soulagement notable après quelques séances.',
    'À l\'écoute et pédagogue dans les explications.',
    'Cabinet bien équipé et propre.',
  ],
  osteopathe: [
    'Soulagé après une seule séance, un vrai pro.',
    'Approche douce mais très efficace.',
    'À l\'écoute, prend vraiment le temps.',
    'Très bons conseils pour la suite.',
  ],
  praticien_bien_etre: [
    'Vraie bulle de détente, je me sens beaucoup mieux.',
    'Approche bienveillante et personnalisée.',
    'Cadre apaisant, professionnel à l\'écoute.',
  ],
  cabinet: [
    'Accueil chaleureux et prise en charge sérieuse.',
    'On se sent en confiance dès la première visite.',
    'Locaux modernes et bien tenus.',
  ],
  menuisier: [
    'Travail soigné, finitions impeccables.',
    'Les délais ont été parfaitement respectés.',
    'Belle créativité sur le sur-mesure.',
    'À l\'écoute du besoin, bons conseils.',
  ],
  plombier: [
    'Intervention rapide et propre.',
    'Diagnostic clair et tarif honnête.',
    'A su résoudre mon problème en urgence.',
    'Très réactif, je recommande.',
    'Devis détaillé et respecté à la lettre.',
  ],
  electricien: [
    'Travail bien fait dans les règles de l\'art.',
    'Le devis a été respecté à l\'euro près.',
    'Intervention rapide et chantier propre.',
    'Conseils précieux pour optimiser l\'installation.',
  ],
  peintre: [
    'Finitions impeccables, on ne voit aucune reprise.',
    'Chantier propre, équipe ponctuelle.',
    'Bon conseil sur les nuances de couleurs.',
  ],
  paysagiste: [
    'Le jardin a été métamorphosé.',
    'Suggestions créatives et adaptées à notre terrain.',
    'Équipe pro et chantier propre.',
    'L\'entretien régulier est très bien fait.',
  ],
  macon: [
    'Chantier mené dans les règles, travail propre.',
    'Délais respectés, équipe ponctuelle.',
    'Belle qualité de finition.',
  ],
  couvreur: [
    'Toiture refaite à neuf, travail soigné.',
    'Devis clair, pas de mauvaise surprise.',
    'Réactif sur les petites réparations aussi.',
  ],
  carreleur: [
    'Travail très propre, alignements parfaits.',
    'A su nous conseiller sur le choix du carrelage.',
    'Délais respectés.',
  ],
  piscinier: [
    'Belle réalisation, exactement ce qu\'on voulait.',
    'Bons conseils sur l\'entretien.',
    'SAV impeccable, toujours disponible.',
  ],
  photographe: [
    'Photos magnifiques, vraiment au-dessus de nos attentes.',
    'Mise à l\'aise instantanée pendant la séance.',
    'Beau sens artistique et grande patience.',
    'Livraison rapide, qualité au rendez-vous.',
  ],
  fleuriste: [
    'Bouquets toujours frais et joliment composés.',
    'À l\'écoute pour les compositions sur mesure.',
    'Belle variété et qualité au rendez-vous.',
  ],
  bijoutier: [
    'Belle sélection et conseils avisés.',
    'Service après-vente impeccable.',
    'On y trouve des pièces qui sortent du commun.',
  ],
  librairie: [
    'Belle sélection, conseils éclairés.',
    'On y trouve toujours son bonheur.',
    'Accueil chaleureux et bons conseils.',
  ],
  garagiste: [
    'Mécanicien sérieux et honnête.',
    'Devis clair, pas de prestation inutile.',
    'Voiture rendue propre et dans les délais.',
    'À l\'écoute du besoin réel, pas de survente.',
  ],
  gite: [
    'Hébergement de charme, parfaitement équipé.',
    'Accueil chaleureux et nombreux conseils sur la région.',
    'Cadre paisible, on s\'y ressource.',
    'Propreté irréprochable et literie confortable.',
  ],
  camping: [
    'Emplacements ombragés et bien dimensionnés.',
    'Sanitaires propres et bien entretenus.',
    'Animations sympas pour les enfants.',
    'Ambiance familiale et accueil au top.',
  ],
}

const DEFAULT_BODIES = [
  'Service de qualité, je recommande.',
  'Personnel à l\'écoute et professionnel.',
  'Très satisfait de la prestation.',
] as const

// ─── Génération ────────────────────────────────────────────────────────

export interface FakeReviewsResult {
  /** Avis prêts à afficher (snapshot stable, c'est ce que voit le visiteur). */
  maquetteAvis: MaquetteAvisItem[]
  /** Avis bruts au format Google Places — sert au fallback + rating display. */
  googleReviews: GoogleReviewItem[]
  /** Note moyenne (1 décimale). */
  averageRating: number
  /** Compteur d'avis à afficher en hero (toujours > nb d'avis générés). */
  reviewsCount: number
}

/**
 * Construit 4 à 6 avis fictifs avec une distribution réaliste de notes
 * et de dates. La sortie est déterministe pour un même PRNG.
 *
 * Distribution :
 *   - Notes : 70% 5 étoiles, 30% 4 étoiles (la majorité de "5" donnerait
 *     un rendu suspect, le mix 5/4 est plus crédible)
 *   - Dates : étalées sur les 30 à 365 derniers jours
 *   - Longueurs : 1 phrase (corps seul) / 2 phrases (opening + corps) /
 *     3 phrases (opening + corps + closing)
 *   - Openings : pas de répétition d'opening dans une même simulation
 *
 * `reviewsCount` retourné est légèrement supérieur au nombre d'avis
 * générés (entre +5 et +30) pour rendre crédible un "X avis Google" qui
 * dépasse les avis affichés.
 */
export function generateFakeReviews(
  categoryId: ProspectCategorie,
  now: Date,
  prng: Prng
): FakeReviewsResult {
  const nbAvis = prng.intBetween(4, 6)
  const bodiesPool = BODIES_BY_CATEGORIE[categoryId] ?? DEFAULT_BODIES

  // PickN d'openings + auteurs pour éviter les répétitions dans la
  // même simulation. Les bodies peuvent se répéter (peu probable vu
  // les pools).
  const openingsSelectionnees = prng.pickN(OPENINGS, nbAvis)
  const auteursSelectionnees = prng.pickN(AUTEURS, nbAvis)

  const maquetteAvis: MaquetteAvisItem[] = []
  const googleReviews: GoogleReviewItem[] = []
  let sommeNotes = 0

  for (let i = 0; i < nbAvis; i++) {
    const rating = prng.chance(0.7) ? 5 : 4
    sommeNotes += rating

    const opening = openingsSelectionnees[i] as string
    const body = prng.pick(bodiesPool)
    const closing = prng.pick(CLOSINGS)

    // Longueur de l'avis — 3 niveaux pondérés (court, moyen, long)
    const longueur = prng.intBetween(1, 3)
    let texte: string
    if (longueur === 1) {
      texte = body
    } else if (longueur === 2) {
      texte = `${opening}. ${body}`
    } else {
      texte = `${opening}. ${body} ${closing}`
    }

    // Date entre 30 et 365 jours en arrière
    const joursOffset = prng.intBetween(30, 365)
    const date = new Date(now.getTime() - joursOffset * 24 * 60 * 60 * 1000)
    const dateISO = date.toISOString()

    const auteur = auteursSelectionnees[i] as string
    const initialMatch = auteur.match(/^([A-ZÀ-Ý])/)
    const initiale = initialMatch ? initialMatch[1] ?? null : null

    maquetteAvis.push({
      author: auteur,
      author_initial: initiale ?? undefined,
      rating,
      text: texte,
      date: dateISO,
      edited: false,
    })

    googleReviews.push({
      name: `places/fake-${i}/reviews/${i}`,
      rating,
      text: texte,
      author_name: auteur,
      author_initial: initiale,
      publish_time: dateISO,
    })
  }

  const averageRating = Math.round((sommeNotes / nbAvis) * 10) / 10

  // Compteur "X avis Google" — gonflé pour la crédibilité (un commerce
  // n'affiche pas que les 4-6 avis qu'on a sélectionnés en démo).
  const reviewsCount = nbAvis + prng.intBetween(5, 30)

  return {
    maquetteAvis,
    googleReviews,
    averageRating,
    reviewsCount,
  }
}
