import { describe, expect, it } from 'vitest'
import { hasGoogleReputation } from './has-google-data'

function p(overrides: Partial<{
  google_rating: number | null
  google_reviews_count: number | null
  google_photo_refs: string[] | null
}> = {}) {
  return {
    google_rating: null,
    google_reviews_count: null,
    google_photo_refs: null,
    ...overrides,
  }
}

describe('hasGoogleReputation', () => {
  it('aucune des 3 données → false', () => {
    expect(hasGoogleReputation(p())).toBe(false)
  })

  it('note seule → true', () => {
    expect(hasGoogleReputation(p({ google_rating: 4.5 }))).toBe(true)
  })

  it('nb avis seul → true', () => {
    expect(hasGoogleReputation(p({ google_reviews_count: 12 }))).toBe(true)
  })

  it('1 photo seule → true', () => {
    expect(hasGoogleReputation(p({ google_photo_refs: ['places/X/photos/1'] }))).toBe(true)
  })

  it('photo array vide → false', () => {
    expect(hasGoogleReputation(p({ google_photo_refs: [] }))).toBe(false)
  })

  it('note = 0 (note réelle 0/5) → true (≠ null)', () => {
    // Cas limite : un commerce avec une note 0 est mal noté mais a quand même
    // de la réputation Google. On ne le bascule pas en « nouveau commerce ».
    expect(hasGoogleReputation(p({ google_rating: 0 }))).toBe(true)
  })

  it('nb avis = 0 → true (≠ null)', () => {
    expect(hasGoogleReputation(p({ google_reviews_count: 0 }))).toBe(true)
  })

  it('toutes les 3 présentes → true', () => {
    expect(
      hasGoogleReputation(
        p({
          google_rating: 4.5,
          google_reviews_count: 42,
          google_photo_refs: ['places/X/photos/1'],
        })
      )
    ).toBe(true)
  })
})
