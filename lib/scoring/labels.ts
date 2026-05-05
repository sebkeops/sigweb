/**
 * Libellés affichés à l'utilisateur pour expliquer chaque sous-score.
 * Centralisés ici pour faciliter une éventuelle reformulation, traduction,
 * ou personnalisation (ex: tutoiement vs vouvoiement) sans toucher à la logique.
 */

export const PROXIMITE_LABELS = {
  TRES_PROCHE: 'Très proche',
  DISTANCE_MOYENNE: 'Distance moyenne',
  DISTANCE_IMPORTANTE: 'Distance importante',
  HORS_ZONE: 'Hors zone',
  DISTANCE_NON_RENSEIGNEE: 'Distance non renseignée',
} as const

export const BESOIN_WEB_LABELS = {
  PAS_DE_SITE: 'Pas de site web',
  RESEAU_SOCIAL_SEUL: 'Présence uniquement sur réseau social',
  PLATEFORME_GENERIQUE: 'Site sur plateforme générique',
  VRAI_SITE: 'Site web existant',
} as const

export const ACTIVITE_LABELS = {
  CONFIRMEE: 'Activité confirmée (50+ avis)',
  LIMITEE: 'Activité limitée ou inconnue',
  FERMEE: 'Commerce fermé',
} as const

export const MALUS_LABELS = {
  FERME_TEMPORAIREMENT: 'Commerce fermé temporairement',
  FERME_DEFINITIVEMENT: 'Commerce fermé définitivement',
} as const
