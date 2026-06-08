import { describe, expect, it } from 'vitest'
import { deriveCanalRecommande } from './canal-badge'

function p(
  overrides: Partial<{
    email: string | null
    telephone: string | null
    site_existant_url: string | null
    instagram_url: string | null
    facebook_url: string | null
  }> = {}
) {
  return {
    email: null,
    telephone: null,
    site_existant_url: null,
    instagram_url: null,
    facebook_url: null,
    ...overrides,
  }
}

describe('deriveCanalRecommande', () => {
  it('aucun champ → terrain/réseau (orange)', () => {
    const result = deriveCanalRecommande(p())
    expect(result.canal).toBe('terrain')
    expect(result.variant).toBe('orange')
    expect(result.label).toBe('Terrain / réseau')
  })

  it('email présent → distance OK (vert), prioritaire sur tous les autres', () => {
    const result = deriveCanalRecommande(
      p({ email: 'contact@boulangerie.fr', telephone: '0102030405', site_existant_url: 'https://x.fr' })
    )
    expect(result.canal).toBe('distance')
    expect(result.variant).toBe('green')
  })

  it('téléphone seul → appel direct (bleu)', () => {
    const result = deriveCanalRecommande(p({ telephone: '0102030405' }))
    expect(result.canal).toBe('mixte')
    expect(result.variant).toBe('blue')
    expect(result.label).toBe('Appel direct')
  })

  it('site existant seul → canal à choisir (gris)', () => {
    const result = deriveCanalRecommande(p({ site_existant_url: 'https://boulangerie.fr' }))
    expect(result.canal).toBe('mixte')
    expect(result.variant).toBe('gray')
  })

  it('instagram seul (sans contact direct) → canal à choisir', () => {
    const result = deriveCanalRecommande(p({ instagram_url: 'https://instagram.com/x' }))
    expect(result.canal).toBe('mixte')
    expect(result.variant).toBe('gray')
  })

  it('facebook seul → canal à choisir', () => {
    const result = deriveCanalRecommande(p({ facebook_url: 'https://facebook.com/x' }))
    expect(result.canal).toBe('mixte')
    expect(result.variant).toBe('gray')
  })

  it('email vide ou whitespace est traité comme absent', () => {
    expect(deriveCanalRecommande(p({ email: '' })).canal).toBe('terrain')
    expect(deriveCanalRecommande(p({ email: '   ' })).canal).toBe('terrain')
  })

  it('réseaux sociaux + téléphone → appel direct (téléphone prioritaire)', () => {
    const result = deriveCanalRecommande(
      p({ telephone: '0102030405', instagram_url: 'https://insta.com/x' })
    )
    expect(result.canal).toBe('mixte')
    expect(result.label).toBe('Appel direct')
  })
})
