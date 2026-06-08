import { describe, expect, it } from 'vitest'
import { categorieFromNaf, NAF_BY_CATEGORIE } from './naf-mapping'

describe('categorieFromNaf', () => {
  it('retourne boulangerie pour 1071C / 1071D / 4724Z', () => {
    expect(categorieFromNaf('1071C')).toBe('boulangerie')
    expect(categorieFromNaf('1071D')).toBe('boulangerie')
    expect(categorieFromNaf('4724Z')).toBe('boulangerie')
  })

  it('accepte aussi le format avec point (10.71C)', () => {
    expect(categorieFromNaf('10.71C')).toBe('boulangerie')
    expect(categorieFromNaf('10.13B')).toBe('boucherie')
  })

  it('insensible à la casse', () => {
    expect(categorieFromNaf('1071c')).toBe('boulangerie')
    expect(categorieFromNaf('10.71c')).toBe('boulangerie')
  })

  it('retourne null pour un NAF hors périmètre Sigweb', () => {
    expect(categorieFromNaf('3511Z')).toBeNull()  // Production d'électricité
    expect(categorieFromNaf('6420Z')).toBeNull()  // Holdings
  })

  it('retourne null pour null / vide', () => {
    expect(categorieFromNaf(null)).toBeNull()
    expect(categorieFromNaf('')).toBeNull()
    expect(categorieFromNaf('   ')).toBeNull()
  })

  it('mapping cohérent avec NAF_BY_CATEGORIE (round-trip)', () => {
    // Pour chaque catégorie, chaque NAF listé doit re-mapper vers cette
    // même catégorie OU une catégorie déclarée AVANT (priorité 1er gagne).
    const categories = Object.keys(NAF_BY_CATEGORIE) as Array<keyof typeof NAF_BY_CATEGORIE>
    for (const cat of categories) {
      const codes = NAF_BY_CATEGORIE[cat]
      for (const code of codes) {
        const reverse = categorieFromNaf(code)
        expect(reverse).not.toBeNull()
        // L'ordre des clés dans NAF_BY_CATEGORIE détermine la priorité ;
        // on accepte cat OU une catégorie déclarée AVANT
        const indexOfCat = categories.indexOf(cat)
        const indexOfReverse = categories.indexOf(reverse!)
        expect(indexOfReverse).toBeLessThanOrEqual(indexOfCat)
      }
    }
  })

  it('priorité : si un NAF est sous plusieurs catégories, la 1ère déclarée gagne', () => {
    // 8690E est sous `kine` (déclaré en V1) ET `osteopathe` (V2).
    // kine vient avant osteopathe dans la déclaration → kine gagne.
    expect(categorieFromNaf('8690E')).toBe('kine')
  })
})
