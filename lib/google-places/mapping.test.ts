import { describe, expect, it, vi } from 'vitest'

// `mapping.ts` importe `server-only` (interdit hors composant serveur). On le
// neutralise ici pour pouvoir tester la logique pure de mapping côté Node.
vi.mock('server-only', () => ({}))

const { mapGoogleTypeToCategorie } = await import('./mapping')

describe('mapGoogleTypeToCategorie — types Google V2', () => {
  // Régression du bug "enrichissement → categorie 'autre'" : ces types Google
  // n'avaient pas de règle de mapping, donc un fleuriste / garagiste / etc.
  // enrichi via Google retombait silencieusement sur 'autre'.
  const V2_CASES = [
    { type: 'florist', expected: 'fleuriste' },
    { type: 'car_repair', expected: 'garagiste' },
    { type: 'jewelry_store', expected: 'bijoutier' },
    { type: 'book_store', expected: 'librairie' },
    { type: 'chocolate_shop', expected: 'chocolatier' },
    { type: 'campground', expected: 'camping' },
  ] as const

  for (const { type, expected } of V2_CASES) {
    it(`'${type}' → '${expected}'`, () => {
      expect(mapGoogleTypeToCategorie([type])).toBe(expected)
    })

    it(`'${type}' n'est PLUS mappé sur 'autre'`, () => {
      expect(mapGoogleTypeToCategorie([type])).not.toBe('autre')
    })
  }

  it('résout le type même noyé dans un tableau Google réaliste', () => {
    // Google Places renvoie un tableau de types, pas une valeur unique.
    expect(
      mapGoogleTypeToCategorie(['florist', 'store', 'point_of_interest', 'establishment'])
    ).toBe('fleuriste')
  })
})

describe('mapGoogleTypeToCategorie — fallback', () => {
  it("retourne 'autre' pour un type non mappé", () => {
    expect(mapGoogleTypeToCategorie(['shoe_store'])).toBe('autre')
  })

  it("retourne 'autre' pour un tableau vide ou absent", () => {
    expect(mapGoogleTypeToCategorie([])).toBe('autre')
    expect(mapGoogleTypeToCategorie(undefined)).toBe('autre')
  })
})
