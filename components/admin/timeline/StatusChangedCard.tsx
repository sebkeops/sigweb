import type { PlainTimelineItem } from '@/lib/crm/timeline-aggregator'
import type { ProspectStatut, StatusChangedMetadata } from '@/types'
import { STATUT_LABELS } from '@/lib/crm/constants'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatRelativeTime } from '@/lib/maquette/render/formatRelativeTime'

interface Props {
  item: PlainTimelineItem
}

/**
 * Carte timeline pour un événement `status_changed` (CRM v3 Phase 2).
 *
 * Affiche : icône, libellé, transition lisible (ancien → nouveau via 2
 * `<StatusBadge>` côte à côte), date relative, et un sous-titre qui
 * distingue automatique (« via envoi d'email ») de manuel (« changement
 * manuel »).
 *
 * Mobile-first : layout vertical par défaut, horizontal seulement à
 * partir de `sm:`. Tap targets respectés via padding généreux.
 */
export default function StatusChangedCard({ item }: Props) {
  const metadata = (item.event.metadata as StatusChangedMetadata | null) ?? null
  const from = metadata?.from
  const to = metadata?.to

  return (
    <article className="rounded-md border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700"
        >
          🔄
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h3 className="font-body text-sm font-semibold text-ink">
              Statut modifié
            </h3>
            <time
              className="shrink-0 font-body text-xs text-muted"
              dateTime={item.event.occurred_at}
            >
              {formatRelativeTime(item.event.occurred_at) ?? '—'}
            </time>
          </div>

          <p className="mt-0.5 font-body text-xs text-muted">
            {item.event.source === 'automatic'
              ? 'Via envoi d’email'
              : 'Changement manuel'}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {from ? (
              <StatusBadge statut={from as ProspectStatut} />
            ) : (
              <span className="font-body text-xs text-muted">
                État initial inconnu
              </span>
            )}
            <span aria-hidden="true" className="text-muted">
              →
            </span>
            {to ? (
              <StatusBadge statut={to as ProspectStatut} />
            ) : (
              <span className="font-body text-xs text-muted">—</span>
            )}
          </div>

          {item.event.notes && (
            <p className="mt-2 font-body text-xs italic text-muted">
              {item.event.notes}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

// Re-export pour usage facile depuis Timeline.tsx
export { STATUT_LABELS }
