import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { formatRelativeTime } from './formatRelativeTime'

describe('formatRelativeTime', () => {
  beforeAll(() => {
    // Horloge fixée au 2026-05-06 (date courante du projet) pour tests déterministes.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-06T12:00:00Z'))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('formate une date récente en français', () => {
    expect(formatRelativeTime('2026-05-04T12:00:00Z'))
      .toMatch(/il y a/i)
  })

  it('formate une date d\'il y a 2 mois', () => {
    const r = formatRelativeTime('2026-03-06T12:00:00Z')
    expect(r).toContain('il y a')
    expect(r).toContain('mois')
  })

  it('null/undefined → null', () => {
    expect(formatRelativeTime(null)).toBeNull()
    expect(formatRelativeTime(undefined)).toBeNull()
  })

  it('chaîne vide → null', () => {
    expect(formatRelativeTime('')).toBeNull()
  })

  it('ISO invalide → null', () => {
    expect(formatRelativeTime('pas-une-date')).toBeNull()
    expect(formatRelativeTime('2026-99-99')).toBeNull()
  })
})
