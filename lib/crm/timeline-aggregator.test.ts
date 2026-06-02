import { describe, expect, it } from 'vitest'
import type {
  EmailSend,
  ProspectTimelineEvent,
  StatusChangedMetadata,
} from '@/types'
import {
  buildUnifiedTimeline,
  filterTimelineByChannel,
  isEmailGroup,
  type EmailSendGroup,
  type PlainTimelineItem,
} from './timeline-aggregator'

// ─── Helpers de construction de fixtures ─────────────────────────────

function makeEmail(overrides: Partial<EmailSend> = {}): EmailSend {
  return {
    id: 'email-1',
    created_at: '2026-05-01T10:00:00Z',
    prospect_id: 'p-1',
    campaign_id: null,
    variant: 'sans-site',
    to_email: 'commercant@example.fr',
    from_email: 'sebastien@sigweb.fr',
    subject: 'Une simulation de site pour votre boulangerie',
    body_html: '<p>...</p>',
    body_text: '...',
    preview_image_url: null,
    maquette_url: null,
    resend_id: 're_xxx',
    status: 'sent',
    sent_at: '2026-05-01T10:00:00Z',
    delivered_at: null,
    first_opened_at: null,
    last_opened_at: null,
    open_count: 0,
    first_clicked_at: null,
    click_count: 0,
    bounced_at: null,
    bounce_reason: null,
    unsubscribed_at: null,
    ...overrides,
  }
}

function makeStatusChangedEvent(
  overrides: Partial<ProspectTimelineEvent> = {}
): ProspectTimelineEvent {
  const metadata: StatusChangedMetadata = {
    from: 'qualifie',
    to: 'contacte',
  }
  return {
    id: 'event-1',
    created_at: '2026-05-15T14:00:00Z',
    prospect_id: 'p-1',
    event_type: 'status_changed',
    event_subtype: null,
    source: 'manual',
    occurred_at: '2026-05-15T14:00:00Z',
    metadata,
    notes: null,
    created_by_user_id: null,
    is_test: false,
    ...overrides,
  }
}

// ─── Aggregator : groupage des emails ────────────────────────────────

describe('buildUnifiedTimeline — groupage email (option B)', () => {
  it('1 email envoyé non délivré → 1 EmailSendGroup avec 1 milestone "sent"', () => {
    const timeline = buildUnifiedTimeline({
      events: [],
      emails: [makeEmail({ sent_at: '2026-05-01T10:00:00Z' })],
    })

    expect(timeline).toHaveLength(1)
    const first = timeline[0]!
    expect(first.kind).toBe('email')
    if (!isEmailGroup(first)) throw new Error('expected email group')
    expect(first.milestones).toHaveLength(1)
    expect(first.milestones[0]!.type).toBe('sent')
    expect(first.subject).toBe('Une simulation de site pour votre boulangerie')
  })

  it('1 email envoyé + délivré + ouvert ×3 + cliqué ×2 → 1 group avec 4 milestones', () => {
    const email = makeEmail({
      sent_at: '2026-05-01T10:00:00Z',
      delivered_at: '2026-05-01T10:00:30Z',
      first_opened_at: '2026-05-02T09:15:00Z',
      last_opened_at: '2026-05-03T18:00:00Z',
      open_count: 3,
      first_clicked_at: '2026-05-03T18:05:00Z',
      click_count: 2,
      status: 'clicked',
    })

    const timeline = buildUnifiedTimeline({ events: [], emails: [email] })

    expect(timeline).toHaveLength(1)
    const group = timeline[0]! as EmailSendGroup
    expect(group.milestones).toHaveLength(4)
    expect(group.milestones.map((m) => m.type)).toEqual([
      'sent',
      'delivered',
      'opened',
      'clicked',
    ])
    expect(group.milestones[2]!.count).toBe(3)
    expect(group.milestones[3]!.count).toBe(2)
  })

  it('email bounced → milestone "bounced" + flag failed', () => {
    const email = makeEmail({
      sent_at: '2026-05-01T10:00:00Z',
      bounced_at: '2026-05-01T10:01:00Z',
      bounce_reason: 'Mailbox does not exist',
      status: 'bounced',
    })

    const timeline = buildUnifiedTimeline({ events: [], emails: [email] })
    const group = timeline[0]! as EmailSendGroup

    expect(group.failed).toBe(true)
    expect(group.milestones.at(-1)!.type).toBe('bounced')
    expect(group.milestones.at(-1)!.reason).toBe('Mailbox does not exist')
  })

  it('email unsubscribed → milestone + flag unsubscribed', () => {
    const email = makeEmail({
      sent_at: '2026-05-01T10:00:00Z',
      delivered_at: '2026-05-01T10:00:30Z',
      unsubscribed_at: '2026-05-02T11:00:00Z',
    })

    const timeline = buildUnifiedTimeline({ events: [], emails: [email] })
    const group = timeline[0]! as EmailSendGroup

    expect(group.unsubscribed).toBe(true)
    expect(group.milestones.at(-1)!.type).toBe('unsubscribed')
  })

  it('email pending sans sent_at → fallback sur created_at pour le milestone "sent"', () => {
    const email = makeEmail({
      created_at: '2026-05-01T09:59:00Z',
      sent_at: null,
      status: 'pending',
    })

    const timeline = buildUnifiedTimeline({ events: [], emails: [email] })
    const group = timeline[0]! as EmailSendGroup

    expect(group.milestones).toHaveLength(1)
    expect(group.milestones[0]!.type).toBe('sent')
    expect(group.milestones[0]!.occurredAt).toBe('2026-05-01T09:59:00Z')
  })

  it('jamais plus de 1 item par email — quel que soit le nombre de milestones', () => {
    // Anti-régression — l'option A produisait 5 events pour 1 email,
    // l'option B en produit toujours 1.
    const email = makeEmail({
      sent_at: '2026-05-01T10:00:00Z',
      delivered_at: '2026-05-01T10:00:30Z',
      first_opened_at: '2026-05-02T09:15:00Z',
      first_clicked_at: '2026-05-03T18:05:00Z',
      bounced_at: '2026-05-04T12:00:00Z',
      unsubscribed_at: '2026-05-04T12:01:00Z',
      status: 'bounced',
    })

    const timeline = buildUnifiedTimeline({ events: [], emails: [email] })

    expect(timeline).toHaveLength(1)
    expect(timeline[0]!.kind).toBe('email')
  })
})

// ─── Aggregator : tri chronologique ──────────────────────────────────

describe('buildUnifiedTimeline — tri par sortedAt desc', () => {
  it("trie sur la date du dernier milestone d'un email (pas la date d'envoi)", () => {
    // Email envoyé le 1er mai mais cliqué le 10 mai. Doit apparaître
    // AVANT un status_changed du 5 mai.
    const oldEmailRecentlyClicked = makeEmail({
      id: 'email-old-clicked',
      sent_at: '2026-05-01T10:00:00Z',
      delivered_at: '2026-05-01T10:00:30Z',
      first_opened_at: '2026-05-09T09:00:00Z',
      first_clicked_at: '2026-05-10T16:00:00Z',
      open_count: 1,
      click_count: 1,
      status: 'clicked',
    })

    const mediumStatusChange = makeStatusChangedEvent({
      id: 'event-status-5may',
      occurred_at: '2026-05-05T12:00:00Z',
    })

    const timeline = buildUnifiedTimeline({
      events: [mediumStatusChange],
      emails: [oldEmailRecentlyClicked],
    })

    expect(timeline).toHaveLength(2)
    expect(timeline[0]!.id).toBe('email-old-clicked')
    expect(timeline[1]!.id).toBe('event-status-5may')
  })

  it('mélange plain events + email groups dans le bon ordre', () => {
    const items = buildUnifiedTimeline({
      events: [
        makeStatusChangedEvent({ id: 'ev-3', occurred_at: '2026-05-20T10:00:00Z' }),
        makeStatusChangedEvent({ id: 'ev-1', occurred_at: '2026-05-10T10:00:00Z' }),
      ],
      emails: [
        makeEmail({ id: 'em-2', sent_at: '2026-05-15T10:00:00Z' }),
      ],
    })

    expect(items.map((i) => i.id)).toEqual(['ev-3', 'em-2', 'ev-1'])
  })
})

// ─── Aggregator : channels ───────────────────────────────────────────

describe('buildUnifiedTimeline — mapping des channels', () => {
  it("status_changed → channel 'statut'", () => {
    const timeline = buildUnifiedTimeline({
      events: [makeStatusChangedEvent()],
      emails: [],
    })
    expect((timeline[0] as PlainTimelineItem).channel).toBe('statut')
  })

  it("email → channel 'email'", () => {
    const timeline = buildUnifiedTimeline({
      events: [],
      emails: [makeEmail()],
    })
    expect(timeline[0]!.channel).toBe('email')
  })

  it("maquette_visited → channel 'maquette' (préparé Phase 3)", () => {
    const timeline = buildUnifiedTimeline({
      events: [
        makeStatusChangedEvent({
          event_type: 'maquette_visited',
          metadata: null,
        }),
      ],
      emails: [],
    })
    expect((timeline[0] as PlainTimelineItem).channel).toBe('maquette')
  })
})

// ─── filterTimelineByChannel ─────────────────────────────────────────

describe('filterTimelineByChannel', () => {
  const fixtures: ReturnType<typeof buildUnifiedTimeline> = buildUnifiedTimeline({
    events: [
      makeStatusChangedEvent({ id: 'ev-1', occurred_at: '2026-05-10T10:00:00Z' }),
    ],
    emails: [makeEmail({ id: 'em-1', sent_at: '2026-05-15T10:00:00Z' })],
  })

  it('null → renvoie tous les items', () => {
    expect(filterTimelineByChannel(fixtures, null)).toHaveLength(2)
  })

  it("'email' → ne garde que les EmailSendGroup", () => {
    const filtered = filterTimelineByChannel(fixtures, 'email')
    expect(filtered).toHaveLength(1)
    expect(filtered[0]!.id).toBe('em-1')
  })

  it("'statut' → ne garde que les events statut", () => {
    const filtered = filterTimelineByChannel(fixtures, 'statut')
    expect(filtered).toHaveLength(1)
    expect(filtered[0]!.id).toBe('ev-1')
  })
})

// ─── excludeTests ────────────────────────────────────────────────────

describe('buildUnifiedTimeline — excludeTests', () => {
  it('par défaut, les events is_test=true sont inclus', () => {
    const timeline = buildUnifiedTimeline({
      events: [
        makeStatusChangedEvent({ id: 'ev-real', is_test: false }),
        makeStatusChangedEvent({ id: 'ev-test', is_test: true }),
      ],
      emails: [],
    })
    expect(timeline).toHaveLength(2)
  })

  it('avec excludeTests=true, les events is_test sont filtrés', () => {
    const timeline = buildUnifiedTimeline({
      events: [
        makeStatusChangedEvent({ id: 'ev-real', is_test: false }),
        makeStatusChangedEvent({ id: 'ev-test', is_test: true }),
      ],
      emails: [],
      excludeTests: true,
    })
    expect(timeline).toHaveLength(1)
    expect(timeline[0]!.id).toBe('ev-real')
  })

  it('excludeTests ne filtre pas les emails (Phase 5 traitera leur is_test)', () => {
    // Note : `EmailSend` n'a pas encore de is_test en Phase 2, c'est
    // Phase 5 qui l'ajoutera. L'aggregator ne filtre donc rien côté
    // emails — ils passent tous. Ce test verrouille le comportement
    // pour qu'on n'introduise pas une régression silencieuse.
    const timeline = buildUnifiedTimeline({
      events: [],
      emails: [makeEmail()],
      excludeTests: true,
    })
    expect(timeline).toHaveLength(1)
  })
})
