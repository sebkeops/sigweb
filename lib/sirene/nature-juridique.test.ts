import { describe, expect, it } from 'vitest'
import { mapNatureJuridique } from './nature-juridique'

describe('mapNatureJuridique', () => {
  it('1000 → Entrepreneur Individuel', () => {
    expect(mapNatureJuridique('1000')).toBe('Entrepreneur Individuel')
  })

  it('5710 → SAS', () => {
    expect(mapNatureJuridique('5710')).toBe('SAS')
  })

  it('5410 → SARL', () => {
    expect(mapNatureJuridique('5410')).toBe('SARL')
  })

  it('SCI 6540 → SCI', () => {
    expect(mapNatureJuridique('6540')).toBe('SCI')
  })

  it('Association 9220 → Association', () => {
    expect(mapNatureJuridique('9220')).toBe('Association')
  })

  it('null → null', () => {
    expect(mapNatureJuridique(null)).toBeNull()
  })

  it('code inconnu → null (l\'admin verra le code brut)', () => {
    expect(mapNatureJuridique('9999')).toBeNull()
  })
})
