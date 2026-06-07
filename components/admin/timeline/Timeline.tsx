import type { EmailSend, ProspectTimelineEvent } from '@/types'
import { createClient } from '@/lib/supabase/server'
import {
  buildUnifiedTimeline,
  filterTimelineByChannel,
  isEmailGroup,
  type TimelineItem as AggTimelineItem,
} from '@/lib/crm/timeline-aggregator'
import StatusChangedCard from './StatusChangedCard'
import EmailCardGrouped from './EmailCardGrouped'
import TimelineFilter from './TimelineFilter'

interface Props {
  prospectId: string
  /** Query param `?canal=` lu côté server. */
  activeChannel: AggTimelineItem['channel'] | null
}

/**
 * Timeline d'événements d'un prospect (CRM v3 Phase 2).
 *
 * Server Component qui orchestre :
 *   1. Fetch parallèle des 2 sources Supabase (events + emails)
 *   2. Appel de l'aggregator pur `buildUnifiedTimeline` (option B :
 *      les emails sont groupés en 1 carte avec mini-timeline interne)
 *   3. Filtrage côté serveur si `?canal=` actif
 *   4. Délégation du rendu à `StatusChangedCard` ou `EmailCardGrouped`
 *      selon le type d'item (discriminated union `kind`)
 *
 * Mobile-first : liste verticale de cards compactes (aucune table).
 */
export default async function Timeline({ prospectId, activeChannel }: Props) {
  const supabase = await createClient()

  // Fetch parallèle — gain de latence vs séquentiel
  const [eventsRes, emailsRes] = await Promise.all([
    supabase
      .from('prospect_timeline_events')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('occurred_at', { ascending: false }),
    supabase
      .from('email_sends')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false }),
  ])

  const events = (eventsRes.data ?? []) as ProspectTimelineEvent[]
  const emails = (emailsRes.data ?? []) as EmailSend[]

  // Aggregator pur — pas d'IO ici
  const all = buildUnifiedTimeline({ events, emails })

  // Calcul des compteurs par canal pour les chips (sur la timeline
  // ENTIÈRE, avant filtrage — sinon les compteurs reflètent juste le
  // filtre actif, ce qui est absurde).
  const counts = countByChannel(all)
  const items = filterTimelineByChannel(all, activeChannel)

  return (
    <section
      aria-label="Historique des événements"
      className="rounded-md border border-border bg-surface p-4 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-base font-bold text-ink">
          Historique{' '}
          <span className="font-body text-sm font-normal text-muted">
            ({all.length})
          </span>
        </h2>
      </div>

      {/* Chips de filtre — masqués si moins de 2 items pour ne pas
          encombrer un prospect tout neuf */}
      {all.length > 1 && (
        <div className="mb-4">
          <TimelineFilter channels={counts} total={all.length} active={activeChannel} />
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-sm border border-border/60 bg-surface-soft px-4 py-6 text-center font-body text-sm text-muted">
          {activeChannel
            ? 'Aucun événement de ce type pour ce prospect.'
            : 'Aucun événement pour ce prospect. Envoyez un email ou changez le statut pour voir apparaître la timeline ici.'}
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              {isEmailGroup(item) ? (
                <EmailCardGrouped item={item} />
              ) : (
                <StatusChangedCard item={item} />
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/**
 * Compteurs par canal pour les chips. Ne retourne que les channels qui
 * ont au moins 1 item (Option A validée Phase 2 : pas de chips morts).
 * L'ordre est figé : `email` puis `statut` puis (Phase 3-4) maquette, etc.
 */
function countByChannel(items: AggTimelineItem[]): ReadonlyArray<{
  key: AggTimelineItem['channel']
  count: number
}> {
  const counts = new Map<AggTimelineItem['channel'], number>()
  for (const item of items) {
    counts.set(item.channel, (counts.get(item.channel) ?? 0) + 1)
  }

  const order: ReadonlyArray<AggTimelineItem['channel']> = [
    'email',
    'statut',
    'maquette',
    'telephone',
    'terrain',
    'note',
  ]

  return order
    .filter((key) => (counts.get(key) ?? 0) > 0)
    .map((key) => ({ key, count: counts.get(key)! }))
}
