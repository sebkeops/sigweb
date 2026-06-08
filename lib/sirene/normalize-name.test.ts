import { describe, expect, it } from 'vitest'
import { normalizeNomCommerce } from './normalize-name'

describe('normalizeNomCommerce', () => {
  it('lowercase + trim', () => {
    expect(normalizeNomCommerce('  BOULANGERIE DUPONT  ')).toBe('boulangerie dupont')
  })

  it('supprime SARL / SAS / EURL en tant que mots entiers', () => {
    expect(normalizeNomCommerce('SARL BOULANGERIE DUPONT')).toBe('boulangerie dupont')
    expect(normalizeNomCommerce('BOULANGERIE DUPONT SAS')).toBe('boulangerie dupont')
    expect(normalizeNomCommerce('PRESSING DUPONT EURL')).toBe('pressing dupont')
  })

  it('ne touche pas une suite de lettres qui contient SAS sans frontière', () => {
    // 'PRESASS' ne doit pas devenir 'PRES' (le SAS n'est pas un mot)
    expect(normalizeNomCommerce('Pressass Dupont')).toBe('pressass dupont')
  })

  it('apostrophes droites et courbes → espaces', () => {
    expect(normalizeNomCommerce("L'EPICERIE D'EMILE")).toBe('l epicerie d emile')
    expect(normalizeNomCommerce('L’Atelier d’Emile')).toBe('l atelier d emile')
  })

  it('tirets et virgules → espaces', () => {
    expect(normalizeNomCommerce('Boulangerie-Pâtisserie, Dupont')).toBe(
      'boulangerie pâtisserie dupont'
    )
  })

  it('compresse les espaces multiples', () => {
    expect(normalizeNomCommerce('boulangerie    dupont')).toBe('boulangerie dupont')
  })

  it('reste conservateur — pas de stemming, pas d\'accents transformés', () => {
    expect(normalizeNomCommerce('Boulangerie Dupont')).not.toBe(
      normalizeNomCommerce('Boulangerie Dupond')
    )
    // Conservation des accents (la dédup match sur le même accent)
    expect(normalizeNomCommerce('Pâtisserie')).toBe('pâtisserie')
  })

  it('idempotent (appliquer 2 fois donne le même résultat)', () => {
    const input = 'SARL Boulangerie-Dupont '
    const once = normalizeNomCommerce(input)
    expect(normalizeNomCommerce(once)).toBe(once)
  })
})
