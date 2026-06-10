import type { EtatAdministratif, Prospect } from '@/types'

/**
 * Helpers centralisés autour de `prospects.etat_administratif`.
 *
 * Source : INSEE Sirene (via data.gouv.fr). Valeurs possibles :
 *   - 'A' (Active) — entreprise en activité, OK pour prospection
 *   - 'F' (Fermée) — fermeture définitive, à dépriorier
 *   - 'C' (Cessée) — cessation d'activité, à dépriorier
 *   - null — info pas encore récupérée (prospect non enrichi Sirene)
 *
 * Règle métier (CONTEXT.md, brief Lot 2) : un prospect F ou C doit être :
 *   1. Signalé visuellement (badge) en liste et carte
 *   2. Bloqué par défaut sur génération maquette / affiche / envoi email
 *      (override possible avec confirmation explicite via flag `force`)
 *   3. Exclu du scoring (score → null)
 *
 * Distinction F vs C : conservée en BDD (info légale) mais souvent unifiée
 * en "Fermé" à l'affichage. `formatEtatAdministratif` retourne les deux
 * libellés distincts pour rester factuel.
 */

export function isProspectClosed(p: Pick<Prospect, 'etat_administratif'>): boolean {
  return p.etat_administratif === 'F' || p.etat_administratif === 'C'
}

/**
 * Libellé court pour le badge / affichage. `null` si l'info n'a rien à
 * signaler (Actif ou non renseigné — pas de badge dans ces cas).
 *
 * Le suffixe "· Sirene" rappelle la source pour que l'admin sache qu'il
 * s'agit d'une donnée officielle (potentiellement en retard sur la réalité
 * terrain) et pas d'un statut interne.
 */
export function formatEtatAdministratif(
  etat: EtatAdministratif
): { label: string; tone: 'closed' } | null {
  if (etat === 'F') return { label: 'Fermé · Sirene', tone: 'closed' }
  if (etat === 'C') return { label: 'Cessé · Sirene', tone: 'closed' }
  return null
}
