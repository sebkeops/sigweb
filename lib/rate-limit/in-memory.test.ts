import { describe, expect, it } from 'vitest'
import { InMemoryRateLimiter } from './in-memory'

describe('InMemoryRateLimiter', () => {
  it('autorise jusqu\'à `max` requêtes dans une fenêtre', () => {
    const t0 = 1_000_000
    let now = t0
    const rl = new InMemoryRateLimiter({ max: 3, windowMs: 1000, now: () => now })

    expect(rl.hit('ip-1')).toMatchObject({ ok: true, remaining: 2 })
    expect(rl.hit('ip-1')).toMatchObject({ ok: true, remaining: 1 })
    expect(rl.hit('ip-1')).toMatchObject({ ok: true, remaining: 0 })
    expect(rl.hit('ip-1')).toMatchObject({ ok: false, remaining: 0 })
  })

  it('isole les compteurs par clé', () => {
    const rl = new InMemoryRateLimiter({ max: 1, windowMs: 1000, now: () => 0 })
    expect(rl.hit('ip-A').ok).toBe(true)
    expect(rl.hit('ip-A').ok).toBe(false)
    expect(rl.hit('ip-B').ok).toBe(true) // ip-B a son propre bucket
  })

  it('réinitialise après expiration de la fenêtre', () => {
    let now = 1000
    const rl = new InMemoryRateLimiter({ max: 2, windowMs: 1000, now: () => now })

    rl.hit('ip')
    rl.hit('ip')
    expect(rl.hit('ip').ok).toBe(false)

    // Fast-forward au-delà de la fenêtre
    now = 2500
    expect(rl.hit('ip')).toMatchObject({ ok: true, remaining: 1 })
  })

  it('expose un resetAt cohérent', () => {
    const rl = new InMemoryRateLimiter({ max: 5, windowMs: 1000, now: () => 1000 })
    const r = rl.hit('ip')
    expect(r.resetAt).toBe(2000)
  })

  it('purge les entrées expirées au seuil', () => {
    let now = 0
    const rl = new InMemoryRateLimiter({
      max: 1, windowMs: 1000,
      cleanupThreshold: 3,
      now: () => now,
    })
    rl.hit('a') // size=1
    rl.hit('b') // size=2
    rl.hit('c') // size=3 → cleanup au prochain hit, mais elles sont fraîches
    expect(rl.size()).toBe(3)

    now = 5000 // toutes expirées
    rl.hit('d') // déclenche cleanup avant insertion
    // Après hit de 'd' : 'a','b','c' expirées et purgées, 'd' inséré
    expect(rl.size()).toBe(1)
  })
})
