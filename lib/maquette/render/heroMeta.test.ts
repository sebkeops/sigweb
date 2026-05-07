import { describe, expect, it } from 'vitest'
import type { Maquette, Prospect } from '@/types'
import { buildHeroMeta } from './heroMeta'

function makeMaquette(annee: number | null): Maquette {
  return { annee_creation: annee } as unknown as Maquette
}

function makeProspect(rating: number | null, count: number | null): Prospect {
  return {
    google_rating: rating,
    google_reviews_count: count,
  } as unknown as Prospect
}

describe('buildHeroMeta — règle de masquage groupé', () => {
  it('cas nominal : 3 stats affichées', () => {
    const r = buildHeroMeta(makeMaquette(2014), makeProspect(4.6, 145))
    expect(r.show).toBe(true)
    expect(r.items).toEqual([
      { value: '2014', label: 'depuis' },
      { value: '4.6 ★', label: 'avis Google' },
      { value: '145', label: 'avis clients' },
    ])
  })

  it('Google valide sans annee → 2 stats (note + nb avis), pas de "depuis"', () => {
    const r = buildHeroMeta(makeMaquette(null), makeProspect(4.8, 80))
    expect(r.show).toBe(true)
    expect(r.items).toEqual([
      { value: '4.8 ★', label: 'avis Google' },
      { value: '80', label: 'avis clients' },
    ])
  })

  it('moins de 5 avis Google → masque tout, même si annee définie', () => {
    const r = buildHeroMeta(makeMaquette(2014), makeProspect(4.6, 4))
    expect(r.show).toBe(false)
    expect(r.items).toEqual([])
  })

  it('note Google absente → masque tout, même avec beaucoup d\'avis', () => {
    const r = buildHeroMeta(makeMaquette(2014), makeProspect(null, 100))
    expect(r.show).toBe(false)
  })

  it('nb avis absent → masque tout', () => {
    const r = buildHeroMeta(makeMaquette(2014), makeProspect(4.6, null))
    expect(r.show).toBe(false)
  })

  it('aucune stat → masque tout', () => {
    const r = buildHeroMeta(makeMaquette(null), makeProspect(null, null))
    expect(r.show).toBe(false)
  })

  it('seuil exactement à 5 avis → autorisé', () => {
    const r = buildHeroMeta(makeMaquette(2020), makeProspect(5.0, 5))
    expect(r.show).toBe(true)
    expect(r.items).toHaveLength(3)
  })

  it('annee seule (pas de stats Google valides) → masque tout', () => {
    const r = buildHeroMeta(makeMaquette(2014), makeProspect(null, null))
    expect(r.show).toBe(false)
  })

  it('rating 4.0 affiché avec une décimale', () => {
    const r = buildHeroMeta(makeMaquette(null), makeProspect(4, 50))
    const note = r.items.find((i) => i.label === 'avis Google')
    expect(note?.value).toBe('4.0 ★')
  })
})
