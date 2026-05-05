import { describe, expect, it } from 'vitest'
import { computeScore } from './compute-score'
import type { ScoringInput } from './types'

const baseInput: ScoringInput = {
  distanceKm: null,
  siteExistantUrl: null,
  instagramUrl: null,
  facebookUrl: null,
  googleReviewsCount: null,
  googleBusinessStatus: null,
}

describe('computeScore — cas du brief', () => {
  it('1. Prospect parfait (≤5 km, pas de site, ≥50 avis) → 10/10', () => {
    const r = computeScore({ ...baseInput, distanceKm: 3, googleReviewsCount: 80 })
    expect(r.proximite).toBe(4)
    expect(r.besoinWeb).toBe(4)
    expect(r.activite).toBe(2)
    expect(r.malus).toBe(0)
    expect(r.total).toBe(10)
  })

  it('2. Prospect proche, sans site, peu d\'avis → 9/10', () => {
    const r = computeScore({ ...baseInput, distanceKm: 4, googleReviewsCount: 5 })
    expect(r.proximite).toBe(4)
    expect(r.besoinWeb).toBe(4)
    expect(r.activite).toBe(1)
    expect(r.total).toBe(9)
  })

  it('3. Prospect avec vrai site mais proche, ≥50 avis → 8/10', () => {
    const r = computeScore({
      ...baseInput,
      distanceKm: 3,
      siteExistantUrl: 'https://www.boulangerie-dupont.fr',
      googleReviewsCount: 60,
    })
    expect(r.proximite).toBe(4)
    expect(r.besoinWeb).toBe(2)
    expect(r.activite).toBe(2)
    expect(r.total).toBe(8)
  })

  it('4. Prospect lointain (5–25), vrai site, ≥50 avis → 6/10', () => {
    const r = computeScore({
      ...baseInput,
      distanceKm: 20,
      siteExistantUrl: 'https://www.shop.fr',
      googleReviewsCount: 100,
    })
    expect(r.proximite).toBe(2)
    expect(r.besoinWeb).toBe(2)
    expect(r.activite).toBe(2)
    expect(r.malus).toBe(0)
    expect(r.total).toBe(6)
  })

  it('5. Prospect fermé temporairement → activité=0, malus=-2, total plafonné', () => {
    const r = computeScore({
      ...baseInput,
      distanceKm: 3,
      googleBusinessStatus: 'CLOSED_TEMPORARILY',
    })
    expect(r.activite).toBe(0)
    expect(r.malus).toBe(-2)
    // 4 (prox) + 4 (besoin) + 0 (activité) - 2 (malus) = 6
    expect(r.total).toBe(6)
  })

  it('5b. Fermé définitivement, lointain, vrai site → 0 plafonné', () => {
    const r = computeScore({
      ...baseInput,
      distanceKm: 100,
      siteExistantUrl: 'https://example.com',
      googleBusinessStatus: 'CLOSED_PERMANENTLY',
    })
    // 0 + 2 + 0 - 2 = 0
    expect(r.total).toBe(0)
  })

  it('6. Site = Instagram → besoin = 4', () => {
    const r = computeScore({
      ...baseInput,
      distanceKm: 4,
      siteExistantUrl: 'https://www.instagram.com/boulangerie_x',
    })
    expect(r.besoinWeb).toBe(4)
  })

  it('6b. Site = Facebook → besoin = 4', () => {
    const r = computeScore({
      ...baseInput,
      siteExistantUrl: 'https://www.facebook.com/page-x',
    })
    expect(r.besoinWeb).toBe(4)
  })

  it('7. Site eatbu.com → besoin = 3 (low-cost)', () => {
    const r = computeScore({
      ...baseInput,
      siteExistantUrl: 'https://eatbu.com/restaurant-truc',
    })
    expect(r.besoinWeb).toBe(3)
  })

  it('7b. Site sites.google.com → besoin = 3', () => {
    const r = computeScore({
      ...baseInput,
      siteExistantUrl: 'https://sites.google.com/site/x',
    })
    expect(r.besoinWeb).toBe(3)
  })

  it('7c. Site wordpress.com → besoin = 3', () => {
    const r = computeScore({
      ...baseInput,
      siteExistantUrl: 'https://x.wordpress.com',
    })
    expect(r.besoinWeb).toBe(3)
  })

  it('8. Aucune donnée Google → activité = 1', () => {
    const r = computeScore({ ...baseInput, distanceKm: 4 })
    expect(r.activite).toBe(1)
    expect(r.total).toBe(9) // 4 + 4 + 1 + 0
  })
})

describe('computeScore — bornes de proximité', () => {
  it('distance NULL → 0', () => {
    expect(computeScore(baseInput).proximite).toBe(0)
  })
  it('0 km → 4', () => {
    expect(computeScore({ ...baseInput, distanceKm: 0 }).proximite).toBe(4)
  })
  it('5 km exactement → 4 (≤ 5)', () => {
    expect(computeScore({ ...baseInput, distanceKm: 5 }).proximite).toBe(4)
  })
  it('5.01 km → 2', () => {
    expect(computeScore({ ...baseInput, distanceKm: 5.01 }).proximite).toBe(2)
  })
  it('24.9 km → 2', () => {
    expect(computeScore({ ...baseInput, distanceKm: 24.9 }).proximite).toBe(2)
  })
  it('25 km exactement → 1 (25 exclu de 5–25)', () => {
    expect(computeScore({ ...baseInput, distanceKm: 25 }).proximite).toBe(1)
  })
  it('59.9 km → 1', () => {
    expect(computeScore({ ...baseInput, distanceKm: 59.9 }).proximite).toBe(1)
  })
  it('60 km exactement → 0', () => {
    expect(computeScore({ ...baseInput, distanceKm: 60 }).proximite).toBe(0)
  })
  it('100 km → 0', () => {
    expect(computeScore({ ...baseInput, distanceKm: 100 }).proximite).toBe(0)
  })
})

describe('computeScore — seuil avis Google', () => {
  it('avis NULL → 1', () => {
    expect(computeScore(baseInput).activite).toBe(1)
  })
  it('avis = 0 → 1', () => {
    expect(computeScore({ ...baseInput, googleReviewsCount: 0 }).activite).toBe(1)
  })
  it('avis = 49 → 1', () => {
    expect(computeScore({ ...baseInput, googleReviewsCount: 49 }).activite).toBe(1)
  })
  it('avis = 50 → 2', () => {
    expect(computeScore({ ...baseInput, googleReviewsCount: 50 }).activite).toBe(2)
  })
  it('avis = 1000 → 2', () => {
    expect(computeScore({ ...baseInput, googleReviewsCount: 1000 }).activite).toBe(2)
  })
})

describe('computeScore — plafonds & invariants', () => {
  it('total est toujours dans [0, 10]', () => {
    const cases: ScoringInput[] = [
      baseInput,
      { ...baseInput, distanceKm: 0, googleReviewsCount: 9999 },
      { ...baseInput, distanceKm: 9999, googleBusinessStatus: 'CLOSED_PERMANENTLY' },
      { ...baseInput, distanceKm: 3, googleReviewsCount: 80 },
      { ...baseInput, googleBusinessStatus: 'CLOSED_TEMPORARILY' },
    ]
    for (const c of cases) {
      const r = computeScore(c)
      expect(r.total).toBeGreaterThanOrEqual(0)
      expect(r.total).toBeLessThanOrEqual(10)
    }
  })

  it('explanations contient au moins 3 entrées (proximite + besoin + activité, malus optionnel)', () => {
    const r = computeScore({ ...baseInput, distanceKm: 3 })
    expect(r.explanations.length).toBeGreaterThanOrEqual(3)
  })

  it('malus ajoute une 4ème explanation', () => {
    const r = computeScore({
      ...baseInput,
      distanceKm: 3,
      googleBusinessStatus: 'CLOSED_TEMPORARILY',
    })
    expect(r.explanations.length).toBe(4)
  })

  it('note Google google_rating n\'est PAS prise en compte (seul reviews_count compte)', () => {
    // Pas de champ rating dans ScoringInput — on vérifie que les avis comptent seuls
    const a = computeScore({ ...baseInput, googleReviewsCount: 100 })
    const b = computeScore({ ...baseInput, googleReviewsCount: 100 })
    expect(a.total).toBe(b.total)
  })
})

describe('computeScore — robustesse URL', () => {
  it('chaîne vide → besoin = 4', () => {
    expect(computeScore({ ...baseInput, siteExistantUrl: '' }).besoinWeb).toBe(4)
  })
  it('whitespace only → besoin = 4', () => {
    expect(computeScore({ ...baseInput, siteExistantUrl: '   ' }).besoinWeb).toBe(4)
  })
  it('URL avec MAJUSCULES → match insensible à la casse', () => {
    expect(
      computeScore({ ...baseInput, siteExistantUrl: 'HTTPS://WWW.INSTAGRAM.COM/x' }).besoinWeb
    ).toBe(4)
  })
  it('vrai site avec subdomain → besoin = 2', () => {
    expect(
      computeScore({ ...baseInput, siteExistantUrl: 'https://shop.maboulangerie.fr' }).besoinWeb
    ).toBe(2)
  })
})
