import { describe, expect, it } from 'vitest'
import { resolveInfos } from './resolveInfos'

const baseProspect = {
  adresse: '53 Av. du Commandant Parisot',
  code_postal: '32600',
  ville: 'L\'Isle-Jourdain',
  telephone: '05 62 07 05 01',
  email: 'contact@example.fr',
}

describe('resolveInfos', () => {
  it('sans override → composition prospect (adresse + cp + ville)', () => {
    const r = resolveInfos(baseProspect, null)
    expect(r.adresseLine).toBe('53 Av. du Commandant Parisot, 32600 L\'Isle-Jourdain')
    expect(r.telephone).toBe('05 62 07 05 01')
    expect(r.email).toBe('contact@example.fr')
  })

  it('overrides null → équivalent à pas d\'override', () => {
    const r = resolveInfos(baseProspect, null)
    const r2 = resolveInfos(baseProspect, undefined)
    expect(r).toEqual(r2)
  })

  it('overrides {} → comportement par défaut', () => {
    const r = resolveInfos(baseProspect, {})
    expect(r.adresseLine).toBe('53 Av. du Commandant Parisot, 32600 L\'Isle-Jourdain')
    expect(r.telephone).toBe('05 62 07 05 01')
    expect(r.email).toBe('contact@example.fr')
  })

  it('override adresse string → utilise la valeur custom telle quelle', () => {
    const r = resolveInfos(baseProspect, { adresse: 'Place du Marché — 32600' })
    expect(r.adresseLine).toBe('Place du Marché — 32600')
  })

  it('override adresse null → masquage adresse', () => {
    const r = resolveInfos(baseProspect, { adresse: null })
    expect(r.adresseLine).toBeNull()
  })

  it('override telephone null → masquage tel', () => {
    const r = resolveInfos(baseProspect, { telephone: null })
    expect(r.telephone).toBeNull()
  })

  it('override email string → custom', () => {
    const r = resolveInfos(baseProspect, { email: 'pro@autre.fr' })
    expect(r.email).toBe('pro@autre.fr')
  })

  it('overrides combinés (custom adresse, masquage tel, défaut email)', () => {
    const r = resolveInfos(baseProspect, {
      adresse: 'Adresse custom',
      telephone: null,
    })
    expect(r.adresseLine).toBe('Adresse custom')
    expect(r.telephone).toBeNull()
    expect(r.email).toBe('contact@example.fr')
  })

  it('prospect sans adresse → null par défaut', () => {
    const r = resolveInfos(
      { ...baseProspect, adresse: null, code_postal: null, ville: null },
      null
    )
    expect(r.adresseLine).toBeNull()
  })

  it('prospect avec uniquement ville → composition partielle', () => {
    const r = resolveInfos(
      { ...baseProspect, adresse: null, code_postal: null, ville: 'Toulouse' },
      null
    )
    expect(r.adresseLine).toBe('Toulouse')
  })
})
