import type { Prospect } from '@/types'

/**
 * Dérivation du canal d'approche commercial recommandé pour un prospect
 * (chantier Sirene/PageSpeed — Lot 1 étape 6).
 *
 * Principe : on ne crée PAS de colonne dédiée en BDD. Le canal est
 * déduit dynamiquement de la présence/absence des champs de contact.
 *
 * Distinction CRITIQUE rappelée par le brief :
 *   - BESOIN (score_besoin_web) = potentiel commercial du prospect
 *   - JOIGNABILITÉ (cette fonction) = comment l'aborder
 *   Un commerce neuf Sirene peut avoir un besoin fort ET aucun canal
 *   de contact distance → forte joignabilité terrain.
 *
 * Logique :
 *   - Aucun email/téléphone/site → terrain/réseau (cas Sirene typique)
 *   - Email + autres → distance possible (canal email prioritaire)
 *   - Téléphone seul → mix (appel direct possible)
 *   - Web seul (site sans email exposé) → terrain ou réseau requis
 */

export type CanalRecommande = 'terrain' | 'distance' | 'mixte'

export interface CanalDerivation {
  canal: CanalRecommande
  /** Libellé court pour badge UI. */
  label: string
  /** Couleur Tailwind suggérée (variant de Badge). */
  variant: 'orange' | 'green' | 'blue' | 'gray'
  /** Explication 1 phrase pour tooltip / sous-titre. */
  description: string
}

/**
 * Dérive le canal recommandé à partir des champs de contact d'un prospect.
 *
 * Accepte un `Pick<Prospect, ...>` pour pouvoir appeler depuis n'importe
 * quel contexte (liste qui n'a que quelques colonnes, fiche complète).
 */
export function deriveCanalRecommande(
  prospect: Pick<Prospect, 'email' | 'telephone' | 'site_existant_url' | 'instagram_url' | 'facebook_url'>
): CanalDerivation {
  const hasEmail = Boolean(prospect.email && prospect.email.trim())
  const hasPhone = Boolean(prospect.telephone && prospect.telephone.trim())
  const hasWeb = Boolean(prospect.site_existant_url && prospect.site_existant_url.trim())
  const hasSocial = Boolean(
    (prospect.instagram_url && prospect.instagram_url.trim()) ||
      (prospect.facebook_url && prospect.facebook_url.trim())
  )

  // Aucune voie de contact moderne → terrain/réseau obligatoire
  if (!hasEmail && !hasPhone && !hasWeb && !hasSocial) {
    return {
      canal: 'terrain',
      label: 'Terrain / réseau',
      variant: 'orange',
      description:
        'Aucun email, téléphone, site ni réseau social détecté. À démarcher en physique (visite, affiche, réseau).',
    }
  }

  // Email présent = canal distance privilégié
  if (hasEmail) {
    return {
      canal: 'distance',
      label: 'Distance OK',
      variant: 'green',
      description: 'Email disponible. Démarchage à distance possible (campagne email).',
    }
  }

  // Pas d'email mais téléphone → appel direct
  if (hasPhone) {
    return {
      canal: 'mixte',
      label: 'Appel direct',
      variant: 'blue',
      description: 'Pas d\'email mais téléphone disponible. Appel direct possible.',
    }
  }

  // Site/réseau seul = visibilité web mais pas de contact direct
  return {
    canal: 'mixte',
    label: 'Web seul · canal à choisir',
    variant: 'gray',
    description:
      'Présence web (site ou réseau social) mais pas de contact direct. Recherche email à faire, sinon terrain/réseau.',
  }
}
