import type {
  EmailSend,
  MeetingScheduledMetadata,
  Prospect,
  ProspectStatut,
  ProspectTimelineEvent,
} from '@/types'
import { STATUT_LABELS, STATUT_OPTIONS } from '@/lib/crm/constants'

/**
 * Calcul des 4 KPIs du dashboard admin (CRM v3 Phase 6).
 *
 * Toutes les fonctions ici sont PURES — elles prennent des données déjà
 * lues côté server component et retournent des structures prêtes à
 * afficher. Pas d'IO, pas de side effect, testables exhaustivement.
 *
 * Convention `is_test` : ces fonctions ASSUMENT que le caller a déjà
 * filtré les lignes de test (cf. dashboard-data.ts qui pose `.eq('is_test', false)`
 * dans les queries Supabase). Si tu réutilises ces fonctions ailleurs,
 * pense à filtrer en amont.
 */

// ─── 1. Entonnoir des statuts ────────────────────────────────────────

export interface StatusFunnelRow {
  statut: ProspectStatut
  label: string
  count: number
  /** Pourcentage du total — déjà arrondi. 0 si total = 0. */
  pct: number
}

/**
 * Compte les prospects par statut, dans l'ordre canonique de
 * `STATUT_OPTIONS`. Les statuts à zero sont CONSERVÉS dans la liste
 * pour montrer l'entonnoir entier (« 0 signés cette période » est une
 * info utile, pas un bug à masquer).
 */
export function computeStatusFunnel(prospects: Pick<Prospect, 'statut'>[]): StatusFunnelRow[] {
  const counts = new Map<ProspectStatut, number>()
  for (const p of prospects) {
    counts.set(p.statut, (counts.get(p.statut) ?? 0) + 1)
  }
  const total = prospects.length

  return STATUT_OPTIONS.map(({ value }) => {
    const count = counts.get(value) ?? 0
    return {
      statut: value,
      label: STATUT_LABELS[value],
      count,
      pct: total === 0 ? 0 : Math.round((count * 100) / total),
    }
  })
}

// ─── 2. Activité 7 derniers jours ────────────────────────────────────

export type ActivityChannel =
  | 'email'
  | 'phone_call'
  | 'terrain'
  | 'note'
  | 'maquette'
  | 'statut'

export interface ActivityDayRow {
  /** Date locale YYYY-MM-DD (00:00 local) — pour clé/affichage. */
  date: string
  /** Date ISO du début de la journée locale en UTC — pour aria-label. */
  isoDate: string
  /** Total tous canaux confondus pour cette journée. */
  total: number
  /** Décompte par canal. Une journée sans activité = total 0. */
  counts: Record<ActivityChannel, number>
}

export interface Activity7dResult {
  /** Toujours 7 entrées, du plus ancien (J-6) au plus récent (aujourd'hui). */
  days: ActivityDayRow[]
  /** Somme des `total` sur les 7 jours. */
  weekTotal: number
}

const EMPTY_CHANNEL_COUNTS = (): Record<ActivityChannel, number> => ({
  email: 0,
  phone_call: 0,
  terrain: 0,
  note: 0,
  maquette: 0,
  statut: 0,
})

/**
 * Range un event timeline vers son canal d'activité agrégé. Les events
 * « terrain » regroupent affiche_deposited / terrain_visit / dm_sent /
 * meeting_scheduled — cohérent avec le filtre canal de la timeline
 * (cf. `channelOfPlainEvent` dans timeline-aggregator).
 */
function eventToChannel(eventType: ProspectTimelineEvent['event_type']): ActivityChannel | null {
  switch (eventType) {
    case 'status_changed':       return 'statut'
    case 'maquette_visited':     return 'maquette'
    case 'phone_call':           return 'phone_call'
    case 'affiche_deposited':
    case 'terrain_visit':
    case 'dm_sent':
    case 'meeting_scheduled':    return 'terrain'
    case 'note':                 return 'note'
  }
}

/** YYYY-MM-DD à partir d'une Date, en TIME LOCAL. */
function localDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Construit la liste des 7 dernières journées locales (J-6 → J0), bucket
 * par canal :
 *   - 1 event timeline = 1 incrément sur son canal
 *   - 1 email = 1 incrément sur 'email' (peu importe son état Resend —
 *     ce qui compte ici c'est « j'ai envoyé un email ce jour-là »)
 *
 * Une journée sans activité reste présente dans le résultat avec total 0.
 * L'admin doit voir les trous (= jours où il n'a rien fait).
 */
export function computeActivity7d(input: {
  events: Pick<ProspectTimelineEvent, 'event_type' | 'occurred_at'>[]
  emails: Pick<EmailSend, 'created_at'>[]
  /** Référence « maintenant » — paramétrable pour rendre la fonction pure et testable. */
  now: Date
}): Activity7dResult {
  const { events, emails, now } = input

  // Construit les 7 buckets dans l'ordre J-6 → J0.
  const days: ActivityDayRow[] = []
  const indexByKey = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0)
    const key = localDateKey(d)
    indexByKey.set(key, days.length)
    days.push({
      date: key,
      isoDate: d.toISOString(),
      total: 0,
      counts: EMPTY_CHANNEL_COUNTS(),
    })
  }

  // Borne basse = début du jour J-6 (inclus).
  const lowerBound = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0)

  for (const event of events) {
    const occurredAt = new Date(event.occurred_at)
    if (Number.isNaN(occurredAt.getTime()) || occurredAt < lowerBound) continue
    const channel = eventToChannel(event.event_type)
    if (!channel) continue
    const key = localDateKey(occurredAt)
    const idx = indexByKey.get(key)
    if (idx === undefined) continue
    days[idx].counts[channel] += 1
    days[idx].total += 1
  }

  for (const email of emails) {
    const createdAt = new Date(email.created_at)
    if (Number.isNaN(createdAt.getTime()) || createdAt < lowerBound) continue
    const key = localDateKey(createdAt)
    const idx = indexByKey.get(key)
    if (idx === undefined) continue
    days[idx].counts.email += 1
    days[idx].total += 1
  }

  const weekTotal = days.reduce((s, d) => s + d.total, 0)
  return { days, weekTotal }
}

// ─── 3. RDV à venir ──────────────────────────────────────────────────

export interface UpcomingMeetingRow {
  eventId: string
  prospectId: string
  prospectName: string
  dateRdv: string  // ISO
  notes: string | null
}

interface UpcomingMeetingsInput {
  events: Pick<
    ProspectTimelineEvent,
    'id' | 'event_type' | 'metadata' | 'notes' | 'prospect_id'
  >[]
  prospectsById: Map<string, Pick<Prospect, 'id' | 'nom_commerce'>>
  now: Date
}

/**
 * Filtre les events `meeting_scheduled` dont la `metadata.date_rdv` est
 * STRICTEMENT future (now < date_rdv). Trie par date ascendante (le
 * plus proche en premier — l'admin veut voir ce qui arrive bientôt).
 *
 * Les events orphelins (prospect supprimé entre-temps) sont droppés.
 */
export function computeUpcomingMeetings(input: UpcomingMeetingsInput): UpcomingMeetingRow[] {
  const { events, prospectsById, now } = input
  const rows: UpcomingMeetingRow[] = []

  for (const event of events) {
    if (event.event_type !== 'meeting_scheduled') continue
    const meta = event.metadata as MeetingScheduledMetadata | null
    if (!meta?.date_rdv) continue
    const date = new Date(meta.date_rdv)
    if (Number.isNaN(date.getTime()) || date <= now) continue

    const prospect = prospectsById.get(event.prospect_id)
    if (!prospect) continue

    rows.push({
      eventId: event.id,
      prospectId: event.prospect_id,
      prospectName: prospect.nom_commerce,
      dateRdv: meta.date_rdv,
      notes: event.notes,
    })
  }

  rows.sort((a, b) => a.dateRdv.localeCompare(b.dateRdv))
  return rows
}

// ─── 4. Relances à faire ────────────────────────────────────────────

export type RelanceUrgency = 'today' | 'overdue'

export interface RelancePendingRow {
  prospectId: string
  prospectName: string
  statut: ProspectStatut
  dateRelancePrevue: string  // ISO
  urgency: RelanceUrgency
  /** Nombre de jours de retard (0 si aujourd'hui). Positif uniquement. */
  daysOverdue: number
}

const RELANCE_STATUTS: ReadonlySet<ProspectStatut> = new Set([
  'relance_1',
  'relance_2',
  'relance_3',
])

/**
 * Liste les prospects en statut `relance_X` dont `date_relance_prevue`
 * est aujourd'hui (urgency=today) ou dépassée (urgency=overdue). Trie
 * par urgence DESC puis par date ASC — les + en retard en haut.
 *
 * Les prospects sans `date_relance_prevue` sont ignorés (la date est
 * nullable en BDD et un statut relance sans date programmée est
 * ambigu — on ne va pas inventer).
 */
export function computeRelancesPending(input: {
  prospects: Pick<
    Prospect,
    'id' | 'nom_commerce' | 'statut' | 'date_relance_prevue'
  >[]
  now: Date
}): RelancePendingRow[] {
  const { prospects, now } = input
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const rows: RelancePendingRow[] = []

  for (const p of prospects) {
    if (!RELANCE_STATUTS.has(p.statut)) continue
    if (!p.date_relance_prevue) continue
    const date = new Date(p.date_relance_prevue)
    if (Number.isNaN(date.getTime())) continue

    let urgency: RelanceUrgency
    let daysOverdue = 0
    if (date < startOfToday) {
      urgency = 'overdue'
      // Compte les jours CIVILS de retard (minuit local à minuit local),
      // pas le delta en heures — sinon en heure d'été UTC+2 un retard de
      // 3 jours civils renvoie 2 (les 22h de décalage écrasent le 3e jour).
      // `Math.round` amortit aussi les +/- 1h DST des week-ends de switch.
      const dateLocalMidnight = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, 0, 0, 0
      )
      daysOverdue = Math.round(
        (startOfToday.getTime() - dateLocalMidnight.getTime()) / 86_400_000
      )
    } else if (date <= endOfToday) {
      urgency = 'today'
    } else {
      continue  // futur lointain — pas dans la liste
    }

    rows.push({
      prospectId: p.id,
      prospectName: p.nom_commerce,
      statut: p.statut,
      dateRelancePrevue: p.date_relance_prevue,
      urgency,
      daysOverdue,
    })
  }

  // Plus en retard en premier (overdue avant today), puis date ASC.
  rows.sort((a, b) => {
    if (a.urgency !== b.urgency) return a.urgency === 'overdue' ? -1 : 1
    return a.dateRelancePrevue.localeCompare(b.dateRelancePrevue)
  })

  return rows
}
