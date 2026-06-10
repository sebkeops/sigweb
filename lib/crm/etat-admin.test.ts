import { describe, expect, it } from 'vitest'
import { formatEtatAdministratif, isProspectClosed } from './etat-admin'

describe('isProspectClosed', () => {
  it('retourne true pour F (fermée)', () => {
    expect(isProspectClosed({ etat_administratif: 'F' })).toBe(true)
  })

  it('retourne true pour C (cessée)', () => {
    expect(isProspectClosed({ etat_administratif: 'C' })).toBe(true)
  })

  it('retourne false pour A (active)', () => {
    expect(isProspectClosed({ etat_administratif: 'A' })).toBe(false)
  })

  it('retourne false pour null (non enrichi Sirene)', () => {
    expect(isProspectClosed({ etat_administratif: null })).toBe(false)
  })
})

describe('formatEtatAdministratif', () => {
  it('renvoie "Fermé · Sirene" pour F', () => {
    expect(formatEtatAdministratif('F')).toEqual({
      label: 'Fermé · Sirene',
      tone: 'closed',
    })
  })

  it('renvoie "Cessé · Sirene" pour C (libellé distinct conservé)', () => {
    expect(formatEtatAdministratif('C')).toEqual({
      label: 'Cessé · Sirene',
      tone: 'closed',
    })
  })

  it('renvoie null pour A (rien à signaler)', () => {
    expect(formatEtatAdministratif('A')).toBeNull()
  })

  it('renvoie null pour null (pas encore enrichi)', () => {
    expect(formatEtatAdministratif(null)).toBeNull()
  })
})
