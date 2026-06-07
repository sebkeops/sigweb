import { describe, expect, it } from 'vitest'
import type {
  EmailSend,
  Prospect,
  ProspectStatut,
  ProspectTimelineEvent,
} from '@/types'
import {
  computeActivity7d,
  computeRelancesPending,
  computeStatusFunnel,
  computeUpcomingMeetings,
} from './dashboard-stats'

// ─── computeStatusFunnel ─────────────────────────────────────────────

describe('computeStatusFunnel', () => {
  function p(statut: ProspectStatut): { statut: ProspectStatut } {
    return { statut }
  }

  it('liste vide → tous statuts à 0, pct=0', () => {
    const rows = computeStatusFunnel([])
    expect(rows).toHaveLength(13) // STATUT_OPTIONS = 13 entrées
    expect(rows.every((r) => r.count === 0 && r.pct === 0)).toBe(true)
  })

  it('compte par statut + pct sur le total', () => {
    const rows = computeStatusFunnel([
      p('a_qualifier'), p('a_qualifier'), p('qualifie'),
      p('signe'),
    ])
    const byStatut = Object.fromEntries(rows.map((r) => [r.statut, r]))
    expect(byStatut.a_qualifier.count).toBe(2)
    expect(byStatut.a_qualifier.pct).toBe(50)
    expect(byStatut.qualifie.count).toBe(1)
    expect(byStatut.qualifie.pct).toBe(25)
    expect(byStatut.signe.count).toBe(1)
    expect(byStatut.signe.pct).toBe(25)
  })

  it('conserve les statuts à 0 dans la liste (entonnoir entier)', () => {
    const rows = computeStatusFunnel([p('signe')])
    expect(rows.find((r) => r.statut === 'a_qualifier')?.count).toBe(0)
    expect(rows.find((r) => r.statut === 'perdu')?.count).toBe(0)
  })

  it('ordre = STATUT_OPTIONS canonique', () => {
    const rows = computeStatusFunnel([p('signe'), p('a_qualifier')])
    expect(rows[0].statut).toBe('a_qualifier')
    expect(rows[rows.length - 1].statut).toBe('ecarte')
  })
})

// ─── computeActivity7d ───────────────────────────────────────────────

describe('computeActivity7d', () => {
  const NOW = new Date('2026-06-07T15:00:00Z')

  function ev(
    type: ProspectTimelineEvent['event_type'],
    occurredAt: string
  ): Pick<ProspectTimelineEvent, 'event_type' | 'occurred_at'> {
    return { event_type: type, occurred_at: occurredAt }
  }

  function em(createdAt: string): Pick<EmailSend, 'created_at'> {
    return { created_at: createdAt }
  }

  it('renvoie toujours 7 jours dans l\'ordre J-6 → J0', () => {
    const result = computeActivity7d({ events: [], emails: [], now: NOW })
    expect(result.days).toHaveLength(7)
    expect(result.weekTotal).toBe(0)
    // Le dernier jour est aujourd'hui (local)
    expect(result.days[6].date).toBe('2026-06-07')
  })

  it('compte les events dans le bon bucket', () => {
    const result = computeActivity7d({
      events: [
        ev('phone_call', '2026-06-07T10:00:00Z'),
        ev('phone_call', '2026-06-07T11:00:00Z'),
        ev('terrain_visit', '2026-06-06T09:00:00Z'),
      ],
      emails: [],
      now: NOW,
    })
    const today = result.days[6]
    expect(today.counts.phone_call).toBe(2)
    expect(today.total).toBe(2)
    const yesterday = result.days[5]
    expect(yesterday.counts.terrain).toBe(1)
  })

  it('groupe affiche_deposited / terrain_visit / dm_sent / meeting_scheduled sous "terrain"', () => {
    const result = computeActivity7d({
      events: [
        ev('affiche_deposited', '2026-06-07T08:00:00Z'),
        ev('terrain_visit', '2026-06-07T09:00:00Z'),
        ev('dm_sent', '2026-06-07T10:00:00Z'),
        ev('meeting_scheduled', '2026-06-07T11:00:00Z'),
      ],
      emails: [],
      now: NOW,
    })
    expect(result.days[6].counts.terrain).toBe(4)
  })

  it('compte chaque email comme +1 sur le canal email', () => {
    const result = computeActivity7d({
      events: [],
      emails: [em('2026-06-07T10:00:00Z'), em('2026-06-07T11:00:00Z')],
      now: NOW,
    })
    expect(result.days[6].counts.email).toBe(2)
    expect(result.weekTotal).toBe(2)
  })

  it('ignore les events hors fenêtre 7j', () => {
    const result = computeActivity7d({
      events: [
        ev('phone_call', '2026-05-01T10:00:00Z'),  // > 7j
        ev('phone_call', '2026-06-07T10:00:00Z'),  // dans la fenêtre
      ],
      emails: [],
      now: NOW,
    })
    expect(result.weekTotal).toBe(1)
  })

  it('ignore les dates invalides', () => {
    const result = computeActivity7d({
      events: [ev('phone_call', 'pas-une-date')],
      emails: [em('aussi-invalide')],
      now: NOW,
    })
    expect(result.weekTotal).toBe(0)
  })
})

// ─── computeUpcomingMeetings ─────────────────────────────────────────

describe('computeUpcomingMeetings', () => {
  const NOW = new Date('2026-06-07T15:00:00Z')

  function evMeeting(
    id: string,
    prospectId: string,
    dateRdv: string | null,
    notes: string | null = null
  ): Parameters<typeof computeUpcomingMeetings>[0]['events'][number] {
    return {
      id,
      event_type: 'meeting_scheduled',
      prospect_id: prospectId,
      metadata: dateRdv ? { date_rdv: dateRdv } : null,
      notes,
    }
  }

  function buildMap(entries: Array<[string, string]>) {
    return new Map(entries.map(([id, name]) => [id, { id, nom_commerce: name }]))
  }

  it('filtre les RDV futurs uniquement', () => {
    const rows = computeUpcomingMeetings({
      events: [
        evMeeting('e1', 'p1', '2026-06-10T14:00:00Z'),  // futur
        evMeeting('e2', 'p2', '2026-06-01T10:00:00Z'),  // passé → exclu
        evMeeting('e3', 'p1', '2026-06-07T14:59:59Z'),  // passé d'1 sec → exclu
      ],
      prospectsById: buildMap([['p1', 'Boulangerie A'], ['p2', 'Cabinet B']]),
      now: NOW,
    })
    expect(rows).toHaveLength(1)
    expect(rows[0].eventId).toBe('e1')
  })

  it('trie par date ASC (le plus proche en premier)', () => {
    const rows = computeUpcomingMeetings({
      events: [
        evMeeting('far', 'p1', '2026-07-01T10:00:00Z'),
        evMeeting('near', 'p1', '2026-06-08T10:00:00Z'),
      ],
      prospectsById: buildMap([['p1', 'Cabinet']]),
      now: NOW,
    })
    expect(rows[0].eventId).toBe('near')
    expect(rows[1].eventId).toBe('far')
  })

  it('drop les events orphelins (prospect inconnu)', () => {
    const rows = computeUpcomingMeetings({
      events: [evMeeting('e1', 'p-fantome', '2026-06-10T10:00:00Z')],
      prospectsById: buildMap([]),
      now: NOW,
    })
    expect(rows).toHaveLength(0)
  })

  it('ignore les events sans date_rdv ou date invalide', () => {
    const rows = computeUpcomingMeetings({
      events: [
        evMeeting('e1', 'p1', null),
        evMeeting('e2', 'p1', 'pas-une-date'),
      ],
      prospectsById: buildMap([['p1', 'X']]),
      now: NOW,
    })
    expect(rows).toHaveLength(0)
  })

  it('renvoie aussi prospectName et notes', () => {
    const rows = computeUpcomingMeetings({
      events: [evMeeting('e1', 'p1', '2026-06-10T10:00:00Z', 'Apporter iPad')],
      prospectsById: buildMap([['p1', 'Pizzeria Locale']]),
      now: NOW,
    })
    expect(rows[0].prospectName).toBe('Pizzeria Locale')
    expect(rows[0].notes).toBe('Apporter iPad')
  })
})

// ─── computeRelancesPending ──────────────────────────────────────────

describe('computeRelancesPending', () => {
  const NOW = new Date('2026-06-07T15:00:00Z')  // 7 juin 2026, 15:00 UTC

  function p(
    id: string,
    nom: string,
    statut: ProspectStatut,
    dateRelancePrevue: string | null
  ): Pick<Prospect, 'id' | 'nom_commerce' | 'statut' | 'date_relance_prevue'> {
    return { id, nom_commerce: nom, statut, date_relance_prevue: dateRelancePrevue }
  }

  it('inclut uniquement relance_1/2/3', () => {
    const rows = computeRelancesPending({
      prospects: [
        p('p1', 'A', 'relance_1', '2026-06-07T08:00:00Z'),
        p('p2', 'B', 'contacte', '2026-06-07T08:00:00Z'),  // exclu
        p('p3', 'C', 'a_qualifier', '2026-06-07T08:00:00Z'),  // exclu
      ],
      now: NOW,
    })
    expect(rows).toHaveLength(1)
    expect(rows[0].prospectId).toBe('p1')
  })

  it('marque urgency=today si la date est aujourd\'hui (local)', () => {
    const rows = computeRelancesPending({
      prospects: [p('p1', 'A', 'relance_2', '2026-06-07T09:00:00Z')],
      now: NOW,
    })
    expect(rows[0].urgency).toBe('today')
    expect(rows[0].daysOverdue).toBe(0)
  })

  it('marque urgency=overdue si la date est passée + compte les jours de retard', () => {
    const rows = computeRelancesPending({
      prospects: [
        p('p1', 'A', 'relance_1', '2026-06-04T10:00:00Z'),  // 3 jours de retard
      ],
      now: NOW,
    })
    expect(rows[0].urgency).toBe('overdue')
    expect(rows[0].daysOverdue).toBe(3)
  })

  it('ignore les relances futures (au-delà d\'aujourd\'hui)', () => {
    const rows = computeRelancesPending({
      prospects: [p('p1', 'A', 'relance_1', '2026-06-15T10:00:00Z')],
      now: NOW,
    })
    expect(rows).toHaveLength(0)
  })

  it('ignore les prospects sans date_relance_prevue', () => {
    const rows = computeRelancesPending({
      prospects: [p('p1', 'A', 'relance_1', null)],
      now: NOW,
    })
    expect(rows).toHaveLength(0)
  })

  it('overdue avant today, puis tri par date ASC', () => {
    const rows = computeRelancesPending({
      prospects: [
        p('p1', 'Today', 'relance_1', '2026-06-07T11:00:00Z'),
        p('p2', 'OldOverdue', 'relance_2', '2026-06-01T10:00:00Z'),
        p('p3', 'RecentOverdue', 'relance_3', '2026-06-05T10:00:00Z'),
      ],
      now: NOW,
    })
    expect(rows.map((r) => r.prospectName)).toEqual(['OldOverdue', 'RecentOverdue', 'Today'])
  })
})
