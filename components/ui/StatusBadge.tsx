import type { ProspectStatut } from '@/types'
import { STATUT_BADGE, STATUT_LABELS } from '@/lib/crm/constants'
import { Badge } from './Badge'

interface StatusBadgeProps {
  statut: ProspectStatut
  /** Classes Tailwind additionnelles (ex: `text-sm` pour la fiche). */
  className?: string
}

/**
 * Badge spécialisé pour afficher un statut prospect.
 *
 * Wrapper sur `<Badge>` qui derive automatiquement la variant de couleur
 * et le label depuis les constantes `STATUT_BADGE` et `STATUT_LABELS` —
 * une seule source de vérité côté `lib/crm/constants.ts`.
 *
 * À utiliser partout où on affiche un statut (liste, fiche, dashboard,
 * timeline) pour garantir la cohérence visuelle.
 */
export function StatusBadge({ statut, className }: StatusBadgeProps) {
  return (
    <Badge variant={STATUT_BADGE[statut]} className={className}>
      {STATUT_LABELS[statut]}
    </Badge>
  )
}
