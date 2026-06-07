import type { EmailMilestone, EmailSendGroup } from '@/lib/crm/timeline-aggregator'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/maquette/render/formatRelativeTime'

interface Props {
  item: EmailSendGroup
}

/**
 * Carte timeline groupée pour 1 email envoyé (CRM v3 Phase 2, option B).
 *
 * Absorbe 100 % de ce qu'affichait `EmailHistorySection` :
 *   - Sujet de l'email (titre principal)
 *   - Variante (sans-site / avec-site) — chip dans le header
 *   - Mini-timeline interne verticale : sent → delivered → opened ×N → clicked ×N
 *   - Compteur ×N pour ouvert et cliqué
 *   - Bandeau rouge si bounced (avec raison) ou plainte spam
 *   - Mention discrète si désinscription après cet email
 *
 * Mobile-first : la mini-timeline est verticale (pas horizontale qui
 * scrollerait sur mobile). Chaque jalon = ligne courte avec icône
 * colorée + label + date relative en gris.
 */
export default function EmailCardGrouped({ item }: Props) {
  return (
    <article
      className={`rounded-md border bg-surface p-4 shadow-sm ${
        item.failed ? 'border-red-300' : 'border-border'
      }`}
    >
      {/* Header — icône email + sujet + variante */}
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700"
        >
          ✉️
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h3
              className="min-w-0 truncate font-body text-sm font-semibold text-ink"
              title={item.subject}
            >
              {item.subject}
            </h3>
            <time
              className="shrink-0 font-body text-xs text-muted"
              dateTime={item.sortedAt}
            >
              {formatRelativeTime(item.sortedAt) ?? '—'}
            </time>
          </div>

          <div className="mt-1.5">
            <Badge variant={item.variant === 'avec-site' ? 'gray' : 'purple'}>
              {item.variant === 'avec-site'
                ? 'Variante : avec site'
                : 'Variante : sans site'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Mini-timeline interne — jalons atteints */}
      {item.milestones.length > 0 && (
        <ol className="mt-4 space-y-2 border-l-2 border-border pl-4">
          {item.milestones.map((m, i) => (
            <MilestoneRow key={`${m.type}-${i}`} milestone={m} />
          ))}
        </ol>
      )}

      {/* Bandeau bounce / plainte spam */}
      {item.failed && (
        <div
          role="status"
          className="mt-3 rounded-sm border border-red-200 bg-red-50 px-3 py-2 font-body text-xs text-red-700"
        >
          <strong className="font-semibold">Email non délivré.</strong>{' '}
          {item.milestones.find((m) => m.type === 'bounced')?.reason ??
            'Plainte spam ou rebond définitif.'}
        </div>
      )}

      {/* Mention désinscription */}
      {item.unsubscribed && !item.failed && (
        <div
          role="status"
          className="mt-3 rounded-sm border border-yellow-200 bg-yellow-50 px-3 py-2 font-body text-xs text-yellow-800"
        >
          Le destinataire s’est désinscrit après cet email.
        </div>
      )}
    </article>
  )
}

// ─── Jalon interne ───────────────────────────────────────────────────

const MILESTONE_LABEL: Record<EmailMilestone['type'], string> = {
  sent: 'Envoyé',
  delivered: 'Délivré',
  opened: 'Ouvert',
  clicked: 'Cliqué',
  bounced: 'Rebond',
  unsubscribed: 'Désinscription',
}

const MILESTONE_DOT_COLOR: Record<EmailMilestone['type'], string> = {
  sent: 'bg-blue-500',
  delivered: 'bg-indigo-500',
  opened: 'bg-yellow-500',
  clicked: 'bg-primary',
  bounced: 'bg-red-500',
  unsubscribed: 'bg-orange-500',
}

function MilestoneRow({ milestone }: { milestone: EmailMilestone }) {
  const label = MILESTONE_LABEL[milestone.type]
  const dot = MILESTONE_DOT_COLOR[milestone.type]
  const showCount = (milestone.type === 'opened' || milestone.type === 'clicked') &&
    typeof milestone.count === 'number' &&
    milestone.count > 1

  return (
    <li className="relative -ml-[18px] flex items-baseline gap-2">
      {/* Petit dot coloré qui chevauche la barre verticale gauche */}
      <span
        aria-hidden="true"
        className={`relative top-1 inline-block h-2 w-2 shrink-0 rounded-full ${dot}`}
      />
      <span className="font-body text-xs font-medium text-ink">
        {label}
        {showCount && (
          <span className="ml-1 font-normal text-muted">
            (×{milestone.count})
          </span>
        )}
      </span>
      <time
        className="ml-auto shrink-0 font-body text-[11px] text-muted"
        dateTime={milestone.occurredAt}
      >
        {formatRelativeTime(milestone.occurredAt) ?? ''}
      </time>
    </li>
  )
}
