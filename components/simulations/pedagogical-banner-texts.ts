import type { ProspectCategorie } from '@/types'

/**
 * Texte pédagogique du bandeau "Simulation SIGWEB" affiché en haut des
 * pages `/simulations/[slug]`. Une entrée par catégorie (34 valeurs,
 * exhaustif sur `ProspectCategorie`).
 *
 * Style : ~250-350 caractères, structure constante :
 *   "Voici un exemple de site que je peux créer pour [type-commerce].
 *    [3-4 éléments-clés du site] : tout ce que vos clients cherchent
 *    avant de [verbe d'engagement adapté]. Ce type de site convient à
 *    [cible précise] souhaitant être visible en ligne simplement,
 *    entre Toulouse et le Gers."
 *
 * Format : phrase complète SANS le préfixe "Simulation SIGWEB —"
 * (ajouté en dur dans le composant `PedagogicalBanner` pour ne pas le
 * dupliquer × 34).
 *
 * Méthode de génération : les 4 textes Famille 2 (boulangerie, boucherie,
 * pizzeria, coiffure) sont alignés sur ce qui existait en prod sur
 * sigweb.fr avant la refonte Phase 3. Les 30 autres sont composés dans
 * le même ton et structure (option C validée user) — à relire et ajuster
 * catégorie par catégorie après livraison.
 */
export const PEDAGOGICAL_BANNER_TEXT_BY_CATEGORIE: Record<ProspectCategorie, string> = {
  // ── Famille bouche ────────────────────────────────────────────────

  boulangerie:
    "Voici un exemple de site que je peux créer pour une boulangerie artisanale. Produits du jour, horaires, galerie et coordonnées : tout ce que vos clients cherchent avant de pousser la porte. Ce type de site convient à toute boulangerie souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  boucherie:
    "Voici un exemple de site que je peux créer pour une boucherie artisanale. Spécialités maison, élevages partenaires, charcuterie et plats préparés : tout ce que vos clients aimeraient connaître avant de passer commande. Ce type de site convient à toute boucherie souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  restaurant:
    "Voici un exemple de site que je peux créer pour un restaurant. Carte, plat du jour, menu midi et soirées spéciales : tout ce que vos clients cherchent avant de réserver leur table. Ce type de site convient à tout restaurant souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  pizzeria:
    "Voici un exemple de site que je peux créer pour une pizzeria. Pizzas signatures, antipasti, desserts maison et service de livraison : tout ce que vos clients aimeraient voir avant de commander. Ce type de site convient à toute pizzeria souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  primeur:
    "Voici un exemple de site que je peux créer pour un primeur. Fruits et légumes de saison, producteurs locaux, paniers et conseils cuisine : tout ce que vos clients cherchent avant de passer chez vous. Ce type de site convient à tout primeur souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  fromager:
    "Voici un exemple de site que je peux créer pour une fromagerie. Sélection affinée maison, fromages fermiers, plateaux sur mesure et conseils dégustation : tout ce que vos clients aimeraient découvrir avant de venir choisir. Ce type de site convient à toute fromagerie souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  caviste:
    "Voici un exemple de site que je peux créer pour un caviste. Sélection de vins, vignerons engagés, nouveautés du mois et conseils de dégustation : tout ce que vos clients cherchent avant de venir au comptoir. Ce type de site convient à tout caviste souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  bar_cafe:
    "Voici un exemple de site que je peux créer pour un bar ou un café. Cafés et boissons, formule du jour, planches à partager et privatisation : tout ce que vos clients aimeraient savoir avant de pousser la porte. Ce type d'établissement souhaitant être visible en ligne simplement le trouvera utile, entre Toulouse et le Gers.",

  traiteur:
    "Voici un exemple de site que je peux créer pour un traiteur. Cocktails, mariages, repas pro et plateaux sur mesure : tout ce que vos clients aimeraient découvrir avant de demander un devis. Ce type de site convient à tout traiteur souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  chocolatier:
    "Voici un exemple de site que je peux créer pour un chocolatier. Ballotins, collections saisonnières, confiseries maison et pièces personnalisées : tout ce que vos clients aimeraient voir avant de venir choisir. Ce type de site convient à tout chocolatier souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  epicerie_fine:
    "Voici un exemple de site que je peux créer pour une épicerie fine. Spécialités du terroir, huiles et épices, vins locaux et coffrets sur mesure : tout ce que vos clients aimeraient parcourir avant de pousser la porte. Ce type de site convient à toute épicerie fine souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  // ── Services à la personne ────────────────────────────────────────

  coiffeur:
    "Voici un exemple de site que je peux créer pour un salon de coiffure. Prestations, soins, coiffures de mariage et prise de rendez-vous : tout ce que vos clients cherchent avant de réserver leur passage. Ce type de site convient à tout salon souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  esthetique:
    "Voici un exemple de site que je peux créer pour un institut de beauté. Soins du visage, soins du corps, épilations et bons cadeaux : tout ce que vos clients aimeraient voir avant de prendre rendez-vous. Ce type de site convient à tout institut souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  kine:
    "Voici un exemple de site que je peux créer pour un cabinet de kinésithérapie. Rééducation, prises en charge spécifiques, kiné du sport et prise de rendez-vous : tout ce que vos patients cherchent avant de vous appeler. Ce type de site convient à tout kinésithérapeute souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  osteopathe:
    "Voici un exemple de site que je peux créer pour un ostéopathe. Douleurs aiguës, suivi périnatal, ostéopathie du sport et prise de rendez-vous : tout ce que vos patients aimeraient savoir avant de consulter. Ce type de site convient à tout ostéopathe souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  praticien_bien_etre:
    "Voici un exemple de site que je peux créer pour un praticien bien-être. Séances individuelles, première rencontre, accompagnement régulier et ateliers : tout ce que vos clients aimeraient comprendre avant de prendre rendez-vous. Ce type de site convient à tout praticien souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  cabinet:
    "Voici un exemple de site que je peux créer pour un cabinet de conseil. Domaines d'intervention, accompagnement particuliers, accompagnement entreprises et modalités : tout ce que vos clients cherchent avant de vous contacter. Ce type de site convient à tout cabinet souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  // ── Bâtiment & artisanat ──────────────────────────────────────────

  menuisier:
    "Voici un exemple de site que je peux créer pour un menuisier. Mobilier sur mesure, cuisines et rangements, escaliers et terrasses : tout ce que vos clients aimeraient voir avant de vous demander un devis. Ce type de site convient à tout menuisier souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  plombier:
    "Voici un exemple de site que je peux créer pour un plombier. Prestations, sanitaires, chauffage, zones d'intervention et urgences : tout ce que vos clients cherchent avant de vous appeler. Ce type de site convient à tout plombier souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  electricien:
    "Voici un exemple de site que je peux créer pour un électricien. Installation, mise aux normes, pannes et urgences, domotique : tout ce que vos clients cherchent avant de vous appeler. Ce type de site convient à tout électricien souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  peintre:
    "Voici un exemple de site que je peux créer pour un peintre en bâtiment. Peinture intérieure, façades extérieures, décors et finitions, préparation lourde : tout ce que vos clients aimeraient voir avant de demander un devis. Ce type de site convient à tout peintre souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  paysagiste:
    "Voici un exemple de site que je peux créer pour un paysagiste. Création de jardin, terrasses, plantations et entretien : tout ce que vos clients aimeraient voir avant de vous contacter. Ce type de site convient à tout paysagiste souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  macon:
    "Voici un exemple de site que je peux créer pour un maçon. Maçonnerie générale, extensions, terrasses et reprise de structure : tout ce que vos clients aimeraient voir avant de demander un devis. Ce type de site convient à tout maçon souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  couvreur:
    "Voici un exemple de site que je peux créer pour un couvreur. Couverture et zinguerie, charpente, réfection complète et dépannage : tout ce que vos clients cherchent avant de vous appeler. Ce type de site convient à tout couvreur souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  carreleur:
    "Voici un exemple de site que je peux créer pour un carreleur. Pose sol et mur, salles de bains complètes, terrasses et faïences : tout ce que vos clients aimeraient voir avant de vous contacter. Ce type de site convient à tout carreleur souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  piscinier:
    "Voici un exemple de site que je peux créer pour un piscinier. Construction neuve, rénovation, forfaits d'entretien et interventions ponctuelles : tout ce que vos clients aimeraient découvrir avant de demander un devis. Ce type de site convient à tout piscinier souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  // ── Commerces & services ──────────────────────────────────────────

  photographe:
    "Voici un exemple de site que je peux créer pour un photographe. Portraits, mariages, grossesse et photographie professionnelle : tout ce que vos clients aimeraient voir avant de vous contacter. Ce type de site convient à tout photographe souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  fleuriste:
    "Voici un exemple de site que je peux créer pour un fleuriste. Bouquets du moment, créations personnalisées, mariages et livraison : tout ce que vos clients cherchent avant de passer commande. Ce type de site convient à tout fleuriste souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  bijoutier:
    "Voici un exemple de site que je peux créer pour un bijoutier. Bijoux or et argent, montres, créations personnalisées et réparations : tout ce que vos clients aimeraient découvrir avant de pousser la porte. Ce type de site convient à tout bijoutier souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  librairie:
    "Voici un exemple de site que je peux créer pour une librairie. Romans, essais, livres jeunesse, auteurs locaux et événements : tout ce que vos clients aimeraient voir avant de venir flâner. Ce type de site convient à toute librairie souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  garagiste:
    "Voici un exemple de site que je peux créer pour un garagiste. Entretien, mécanique, pneumatiques, contrôle technique et dépannage : tout ce que vos clients cherchent avant de vous appeler. Ce type de site convient à tout garage souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  // ── Hébergement ───────────────────────────────────────────────────

  gite:
    "Voici un exemple de site que je peux créer pour un gîte. Ambiance, équipements, points d'intérêt autour et formules de séjour : tout ce que vos clients cherchent avant de réserver leur séjour. Ce type de site convient à tout gîte souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  camping:
    "Voici un exemple de site que je peux créer pour un camping. Emplacements, services, activités en saison et points d'intérêt autour : tout ce que vos clients aimeraient découvrir avant de réserver leur séjour. Ce type de site convient à tout camping souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",

  // ── Fallback ──────────────────────────────────────────────────────

  autre:
    "Voici un exemple de site que je peux créer pour votre activité. Spécialités, accompagnement personnalisé, références et prise de contact : tout ce que vos clients cherchent avant de vous contacter. Ce type de site convient à tout commerce ou artisan souhaitant être visible en ligne simplement, entre Toulouse et le Gers.",
}
