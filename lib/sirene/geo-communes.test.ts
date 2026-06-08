import { describe, expect, it } from 'vitest'
import { extractCodesPostaux, haversineKm } from './geo-communes'

describe('haversineKm', () => {
  it('Paris ↔ Lyon ≈ 392 km (vol d\'oiseau)', () => {
    const d = haversineKm(48.8566, 2.3522, 45.7640, 4.8357)
    expect(d).toBeGreaterThan(385)
    expect(d).toBeLessThan(400)
  })

  it('Toulouse ↔ L\'Isle-Jourdain ≈ 30 km', () => {
    const d = haversineKm(43.6045, 1.4442, 43.6138, 1.0865)
    expect(d).toBeGreaterThan(28)
    expect(d).toBeLessThan(32)
  })

  it('point à lui-même = 0', () => {
    expect(haversineKm(48.85, 2.35, 48.85, 2.35)).toBe(0)
  })
})

describe('extractCodesPostaux', () => {
  it('dédup en conservant l\'ordre de proximité', () => {
    const result = extractCodesPostaux([
      { code: '31555', nom: 'Toulouse', codesPostaux: ['31000', '31100'], distanceKm: 0 },
      { code: '31069', nom: 'Blagnac', codesPostaux: ['31700'], distanceKm: 6 },
      { code: '31099', nom: 'Castelginest', codesPostaux: ['31100'], distanceKm: 10 },  // doublon
    ])
    expect(result).toEqual(['31000', '31100', '31700'])
  })

  it('liste vide → []', () => {
    expect(extractCodesPostaux([])).toEqual([])
  })

  it('commune sans CP → ignorée', () => {
    const result = extractCodesPostaux([
      { code: '99999', nom: 'X', codesPostaux: [], distanceKm: 0 },
      { code: '31555', nom: 'Toulouse', codesPostaux: ['31000'], distanceKm: 1 },
    ])
    expect(result).toEqual(['31000'])
  })
})
