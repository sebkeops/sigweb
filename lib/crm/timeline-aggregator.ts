import type {
  EmailSend,
  ProspectTimelineEvent,
  StatusChangedMetadata,
} from '@/types'

/**
 * Agrégateur pur de timeline CRM v3 (Phase 2).
 *
 * Objectif : produire la timeline unifiée d'un prospect en fusionnant
 *   - les events explicites stockés dans `prospect_timeline_events`
 *     (statut, et à terme : maquette, terrain, téléphone, etc.)
 *   - les emails de `email_sends` dérivés à la volée en groupes
 *     compacts (option B validée : 1 carte par email avec mini-timeline
 *     interne sent → delivered → opened ×N → clicked ×N, plutôt que
 *     1 ligne par état atteint)
 *
 * Pas d'IO, pas de side effect : fonction pure prenant les 2 listes
 * brutes et retournant une liste unifiée triée chronologiquement.
 *
 * Tri : par `sortedAt` desc (date la plus récente en premier). Pour un
 * `EmailSendGroup`, c'est la date du DERNIER état atteint (clicked si
 * cliqué, sinon opened si ouvert, etc.). Cela fait remonter naturellement
 * les emails encore "vivants" en tête de timeline.
 */

/**
 * Item de timeline issu d'un `prospect_timeline_events` row (Phase 2 :
 * uniquement `status_changed` ; Phase 3-4 : autres types).
 */
export interface PlainTimelineItem {
  kind: 'plain'
  id: string
  sortedAt: string
  channel: 'statut' | 'maquette' | 'telephone' | 'terrain' | 'note'
  event: ProspectTimelineEvent
}

/**
 * Sous-évènement d'un email : un des 4-5 jalons atteints (envoyé,
 * délivré, ouvert, cliqué, bounced, désinscrit). Le composant UI itère
 * sur cette liste pour rendre la mini-timeline interne de la carte email.
 */
export interface EmailMilestone {
  type:
    | 'sent'
    | 'delivered'
    | 'opened'
    | 'clicked'
    | 'bounced'
    | 'unsubscribed'
  occurredAt: string
  /** Compteur pour `opened` (= open_count) et `clicked` (= click_count). */
  count?: number
  /** Raison du bounce — uniquement pour `type='bounced'`. */
  reason?: string | null
}

/**
 * Item de timeline = un email entier avec sa mini-timeline interne.
 * Le sujet, la variante (sans-site / avec-site) et la raison de bounce
 * sont conservés pour que la carte UI absorbe 100 % de ce qu'affichait
 * `EmailHistorySection` (dépréciée en fin de Phase 2).
 */
export interface EmailSendGroup {
  kind: 'email'
  id: string
  sortedAt: string
  channel: 'email'
  subject: string
  variant: EmailSend['variant']
  /** Ordonnés chronologiquement (sent → delivered → opened → clicked → …). */
  milestones: EmailMilestone[]
  /** `true` si l'email a fini en bounce ou plainte spam. */
  failed: boolean
  /** `true` si le destinataire s'est désinscrit après cet email. */
  unsubscribed: boolean
}

export type TimelineItem = PlainTimelineItem | EmailSendGroup

// ─── Helpers internes ────────────────────────────────────────────────

/**
 * Mappe un `event_type` de la table vers une "channel" pour les chips
 * de filtre. Les channels Phase 3-4 sont déjà mappées pour éviter une
 * dérive plus tard.
 */
function channelOfPlainEvent(eventType: ProspectTimelineEvent['event_type']): PlainTimelineItem['channel'] {
  switch (eventType) {
    case 'status_changed':
      return 'statut'
    case 'maquette_visited':
      return 'maquette'
    case 'phone_call':
      return 'telephone'
    case 'affiche_deposited':
    case 'terrain_visit':
    case 'dm_sent':
    case 'meeting_scheduled':
      return 'terrain'
    case 'note':
      return 'note'
  }
}

/**
 * Construit la liste ordonnée des milestones d'un email à partir des
 * colonnes timestamps de `email_sends`. Skippe les jalons non atteints.
 *
 * Convention de tri : `sent < delivered < opened < clicked < bounced`,
 * mais on respecte l'horodatage réel — un open peut techniquement
 * arriver avant un delivered si le webhook a du retard (peu probable
 * mais le tri par `occurredAt` reste correct).
 */
function buildMilestones(email: EmailSend): EmailMilestone[] {
  const milestones: EmailMilestone[] = []

  if (email.sent_at) {
    milestones.push({ type: 'sent', occurredAt: email.sent_at })
  } else if (email.created_at) {
    // L'email a été inséré mais pas encore confirmé envoyé par Resend.
    // On affiche quand même un jalon "Envoyé" basé sur created_at pour
    // ne pas avoir une carte vide en cas de pending qui traîne.
    milestones.push({ type: 'sent', occurredAt: email.created_at })
  }

  if (email.delivered_at) {
    milestones.push({ type: 'delivered', occurredAt: email.delivered_at })
  }

  if (email.first_opened_at) {
    milestones.push({
      type: 'opened',
      occurredAt: email.first_opened_at,
      count: email.open_count,
    })
  }

  if (email.first_clicked_at) {
    milestones.push({
      type: 'clicked',
      occurredAt: email.first_clicked_at,
      count: email.click_count,
    })
  }

  if (email.bounced_at) {
    milestones.push({
      type: 'bounced',
      occurredAt: email.bounced_at,
      reason: email.bounce_reason,
    })
  }

  if (email.unsubscribed_at) {
    milestones.push({
      type: 'unsubscribed',
      occurredAt: email.unsubscribed_at,
    })
  }

  // Tri chronologique. En cas de timestamps identiques, on conserve
  // l'ordre d'insertion (les `if` ci-dessus respectent la séquence
  // logique sent → delivered → opened → clicked → bounced).
  milestones.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
  return milestones
}

function emailToGroup(email: EmailSend): EmailSendGroup {
  const milestones = buildMilestones(email)
  const last = milestones[milestones.length - 1]
  return {
    kind: 'email',
    id: email.id,
    sortedAt: last?.occurredAt ?? email.created_at,
    channel: 'email',
    subject: email.subject,
    variant: email.variant,
    milestones,
    failed: email.status === 'bounced' || email.status === 'complained',
    unsubscribed: email.unsubscribed_at !== null,
  }
}

function plainEventToItem(event: ProspectTimelineEvent): PlainTimelineItem {
  return {
    kind: 'plain',
    id: event.id,
    sortedAt: event.occurred_at,
    channel: channelOfPlainEvent(event.event_type),
    event,
  }
}

// ─── API publique ────────────────────────────────────────────────────

export interface BuildUnifiedTimelineOptions {
  /** Lignes brutes de `prospect_timeline_events`, dans n'importe quel ordre. */
  events: ProspectTimelineEvent[]
  /** Lignes brutes de `email_sends`, dans n'importe quel ordre. */
  emails: EmailSend[]
  /** Si `true`, exclut les events flaggés `is_test` (cas dashboard). */
  excludeTests?: boolean
}

/**
 * Fusionne les deux sources en une timeline unifiée triée
 * chronologiquement (plus récent en premier).
 *
 * Pour chaque email : 1 seul item de type `EmailSendGroup` (jamais 5).
 * Pour chaque plain event : 1 item de type `PlainTimelineItem`.
 */
export function buildUnifiedTimeline(
  opts: BuildUnifiedTimelineOptions
): TimelineItem[] {
  const eventsFiltered = opts.excludeTests
    ? opts.events.filter((e) => !e.is_test)
    : opts.events

  const plainItems: TimelineItem[] = eventsFiltered.map(plainEventToItem)
  const emailItems: TimelineItem[] = opts.emails.map(emailToGroup)

  const all = [...plainItems, ...emailItems]

  // Tri desc par date du jalon le plus récent (pour un email) ou
  // de l'event (pour un plain event).
  all.sort((a, b) => b.sortedAt.localeCompare(a.sortedAt))

  return all
}

/**
 * Type-guard pour distinguer les 2 variantes de TimelineItem côté UI.
 * Pratique côté composant pour éviter les casts.
 */
export function isEmailGroup(item: TimelineItem): item is EmailSendGroup {
  return item.kind === 'email'
}

/**
 * Filtre une timeline déjà construite par channel — utilisé par le
 * composant `<TimelineFilter>` quand l'admin sélectionne un chip
 * (ex: « Email » seulement).
 *
 * `null` = pas de filtre actif (cas chip `[Tout]`).
 */
export function filterTimelineByChannel(
  items: TimelineItem[],
  channel: TimelineItem['channel'] | null
): TimelineItem[] {
  if (channel === null) return items
  return items.filter((i) => i.channel === channel)
}
