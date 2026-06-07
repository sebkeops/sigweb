import { describe, expect, it } from 'vitest'
import { manualTimelineEventSchema } from './timeline-event'

describe('manualTimelineEventSchema — phone_call', () => {
  it('phone_call valide avec sous-type parle', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'phone_call',
      occurred_at: '2026-06-07T10:00:00Z',
      event_subtype: 'parle',
    })
    expect(result.success).toBe(true)
  })

  it('rejette un sous-type inconnu', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'phone_call',
      occurred_at: '2026-06-07T10:00:00Z',
      event_subtype: 'autre_chose',
    })
    expect(result.success).toBe(false)
  })

  it('rejette si sous-type manquant', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'phone_call',
      occurred_at: '2026-06-07T10:00:00Z',
    })
    expect(result.success).toBe(false)
  })

  it('accepte notes optionnelles', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'phone_call',
      occurred_at: '2026-06-07T10:00:00Z',
      event_subtype: 'sans_reponse',
      notes: 'Rappellera demain.',
    })
    expect(result.success).toBe(true)
  })
})

describe('manualTimelineEventSchema — affiche_deposited / terrain_visit', () => {
  it('affiche_deposited valide sans metadata', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'affiche_deposited',
      occurred_at: '2026-06-07T10:00:00Z',
    })
    expect(result.success).toBe(true)
  })

  it('terrain_visit valide avec notes libres pour le lieu', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'terrain_visit',
      occurred_at: '2026-06-07T10:00:00Z',
      notes: 'Passé en boutique 14h.',
    })
    expect(result.success).toBe(true)
  })
})

describe('manualTimelineEventSchema — dm_sent', () => {
  it('valide avec plateforme facebook', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'dm_sent',
      occurred_at: '2026-06-07T10:00:00Z',
      plateforme: 'facebook',
    })
    expect(result.success).toBe(true)
  })

  it('valide avec plateforme instagram', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'dm_sent',
      occurred_at: '2026-06-07T10:00:00Z',
      plateforme: 'instagram',
    })
    expect(result.success).toBe(true)
  })

  it('valide avec plateforme linkedin', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'dm_sent',
      occurred_at: '2026-06-07T10:00:00Z',
      plateforme: 'linkedin',
    })
    expect(result.success).toBe(true)
  })

  it('rejette une plateforme inconnue', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'dm_sent',
      occurred_at: '2026-06-07T10:00:00Z',
      plateforme: 'tiktok',
    })
    expect(result.success).toBe(false)
  })

  it('rejette si plateforme manquante', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'dm_sent',
      occurred_at: '2026-06-07T10:00:00Z',
    })
    expect(result.success).toBe(false)
  })
})

describe('manualTimelineEventSchema — meeting_scheduled', () => {
  it('valide avec date_rdv future', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'meeting_scheduled',
      occurred_at: '2026-06-07T10:00:00Z',
      date_rdv: '2026-06-15T14:00:00Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejette date_rdv invalide', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'meeting_scheduled',
      occurred_at: '2026-06-07T10:00:00Z',
      date_rdv: 'pas-une-date',
    })
    expect(result.success).toBe(false)
  })

  it('rejette si date_rdv manquante', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'meeting_scheduled',
      occurred_at: '2026-06-07T10:00:00Z',
    })
    expect(result.success).toBe(false)
  })
})

describe('manualTimelineEventSchema — note', () => {
  it('valide avec notes', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'note',
      occurred_at: '2026-06-07T10:00:00Z',
      notes: 'Le commerçant veut une démo Vendredi matin.',
    })
    expect(result.success).toBe(true)
  })

  it('rejette si notes manquantes', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'note',
      occurred_at: '2026-06-07T10:00:00Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejette notes vides après trim', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'note',
      occurred_at: '2026-06-07T10:00:00Z',
      notes: '   ',
    })
    expect(result.success).toBe(false)
  })
})

describe('manualTimelineEventSchema — règles transverses', () => {
  it('rejette un event_type inconnu', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'pigeon_voyageur',
      occurred_at: '2026-06-07T10:00:00Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejette occurred_at invalide', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'terrain_visit',
      occurred_at: 'pas-une-date',
    })
    expect(result.success).toBe(false)
  })

  it('rejette occurred_at vide', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'terrain_visit',
      occurred_at: '',
    })
    expect(result.success).toBe(false)
  })

  it('accepte occurred_at antidaté (saisie rétroactive)', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'phone_call',
      occurred_at: '2024-01-15T09:00:00Z',
      event_subtype: 'parle',
    })
    expect(result.success).toBe(true)
  })

  it('rejette notes au-delà de 2000 caractères', () => {
    const result = manualTimelineEventSchema.safeParse({
      event_type: 'note',
      occurred_at: '2026-06-07T10:00:00Z',
      notes: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })
})
