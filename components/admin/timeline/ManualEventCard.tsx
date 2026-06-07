import type { PlainTimelineItem } from '@/lib/crm/timeline-aggregator'
import type {
  DmSentMetadata,
  ManualTimelineEventType,
  MeetingScheduledMetadata,
  PhoneCallSubtype,
} from '@/types'
import { formatRelativeTime } from '@/lib/maquette/render/formatRelativeTime'

interface Props {
  item: PlainTimelineItem
}

/**
 * Carte timeline unifiée pour les 6 types d'events manuels (CRM v3 Phase 4).
 *
 * Pattern DRY : tous ces events partagent la même structure visuelle
 * (icône circulaire + titre + date + chip de meta + notes), seuls
 * varient l'icône, la couleur, le titre, et un petit body conditionnel.
 *
 * Faire 6 fichiers de 30 lignes pour ça serait de la duplication pure ;
 * la config par type est centralisée dans `TYPE_CONFIG` ci-dessous.
 *
 * Mobile-first : layout vertical par défaut, pas de hover-only. Le bloc
 * notes utilise un `whitespace-pre-line` pour conserver les retours à
 * la ligne saisis par l'admin (utile pour une note libre multi-lignes).
 */
export default function ManualEventCard({ item }: Props) {
  const eventType = item.event.event_type as ManualTimelineEventType
  const cfg = TYPE_CONFIG[eventType]
  if (!cfg) return null

  const meta = item.event.metadata as Record<string, unknown> | null
  const notes = item.event.notes

  return (
    <article className="rounded-md border border-border bg-surface p-3 shadow-sm sm:p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.iconBg}`}
        >
          {cfg.icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="font-body text-sm font-semibold text-ink">
              {cfg.title}
            </h3>
            <time
              className="shrink-0 font-body text-xs text-muted"
              dateTime={item.event.occurred_at}
            >
              {formatRelativeTime(item.event.occurred_at) ?? '—'}
            </time>
          </div>

          {/* Chip de meta — sous-type, plateforme, date RDV selon le type */}
          {renderMeta(eventType, item.event.event_subtype, meta)}

          {/* Notes : en italique muted pour les events « secondaires »
              (appel/affiche/terrain/DM/RDV), en bloc lisible pour les
              events `note` où c'est LE contenu principal. */}
          {notes &&
            (eventType === 'note' ? (
              <p className="mt-2 whitespace-pre-line font-body text-sm text-ink">
                {notes}
              </p>
            ) : (
              <p className="mt-2 whitespace-pre-line font-body text-xs italic text-muted">
                {notes}
              </p>
            ))}
        </div>
      </div>
    </article>
  )
}

function renderMeta(
  type: ManualTimelineEventType,
  subtype: string | null,
  meta: Record<string, unknown> | null
) {
  if (type === 'phone_call' && subtype) {
    const sub = subtype as PhoneCallSubtype
    return (
      <p className="mt-1 font-body text-xs text-muted">
        Résultat :{' '}
        <span className="font-medium text-ink">{PHONE_CALL_LABEL[sub]}</span>
      </p>
    )
  }

  if (type === 'dm_sent' && meta && typeof meta.plateforme === 'string') {
    const platLabel = DM_PLATFORM_LABEL[meta.plateforme] ?? meta.plateforme
    return (
      <p className="mt-1 font-body text-xs text-muted">
        Plateforme : <span className="font-medium text-ink">{platLabel}</span>
      </p>
    )
  }

  if (type === 'meeting_scheduled' && meta && typeof meta.date_rdv === 'string') {
    const m = meta as unknown as MeetingScheduledMetadata
    return (
      <p className="mt-1 font-body text-xs text-muted">
        RDV le{' '}
        <span className="font-medium text-ink">{formatRdv(m.date_rdv)}</span>
      </p>
    )
  }

  return null
}

const PHONE_CALL_LABEL: Record<PhoneCallSubtype, string> = {
  sans_reponse: 'Sans réponse',
  parle: 'Conversation aboutie',
  message_vocal: 'Message vocal laissé',
}

const DM_PLATFORM_LABEL: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
}

function formatRdv(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface TypeConfig {
  title: string
  icon: string
  iconBg: string
}

const TYPE_CONFIG: Partial<Record<ManualTimelineEventType, TypeConfig>> = {
  phone_call: {
    title: 'Appel téléphonique',
    icon: '📞',
    iconBg: 'bg-green-100 text-green-700',
  },
  affiche_deposited: {
    title: 'Affiche déposée',
    icon: '📍',
    iconBg: 'bg-yellow-100 text-yellow-800',
  },
  terrain_visit: {
    title: 'Visite terrain',
    icon: '👣',
    iconBg: 'bg-yellow-100 text-yellow-800',
  },
  dm_sent: {
    title: 'DM envoyé',
    icon: '💬',
    iconBg: 'bg-blue-100 text-blue-700',
  },
  meeting_scheduled: {
    title: 'RDV programmé',
    icon: '📅',
    iconBg: 'bg-indigo-100 text-indigo-700',
  },
  note: {
    title: 'Note',
    icon: '📝',
    iconBg: 'bg-gray-100 text-gray-700',
  },
}

// Re-export utile pour Timeline.tsx (savoir si un event_type est manuel)
export const MANUAL_EVENT_TYPES = Object.keys(TYPE_CONFIG) as ManualTimelineEventType[]
