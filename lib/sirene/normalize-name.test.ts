import { describe, expect, it } from 'vitest'
import { normalizeNomCommerce, stripCategoryWords } from './normalize-name'

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

describe('stripCategoryWords (Lot 2 PR B fix — Le Loup Gourmand)', () => {
  it('cas typique Google : préfixe "Boulangerie" stripé', () => {
    expect(stripCategoryWords('Boulangerie Le Loup Gourmand')).toBe('Le Loup Gourmand')
  })

  it('suffixe métier stripé', () => {
    expect(stripCategoryWords('Le Loup Gourmand - Boulangerie')).toBe('Le Loup Gourmand')
  })

  it('insensible à la casse', () => {
    expect(stripCategoryWords('BOULANGERIE LE LOUP GOURMAND')).toBe('LE LOUP GOURMAND')
  })

  it('expression multi-mots strippée avant ses sous-mots ("salon de coiffure" avant "salon")', () => {
    expect(stripCategoryWords('Salon de coiffure Audrey')).toBe('Audrey')
  })

  it('plusieurs préfixes empilés strippés successivement', () => {
    expect(stripCategoryWords('Boulangerie Pâtisserie Le Vieux Four')).toBe('Le Vieux Four')
  })

  it('mot métier au milieu PRÉSERVÉ (probablement distinctif)', () => {
    expect(stripCategoryWords('Au Vieux Boulanger')).toBe('Au Vieux Boulanger')
  })

  it('nom sans mot métier inchangé', () => {
    expect(stripCategoryWords('Le Bistrot du Centre')).toBe('Le Bistrot du Centre')
  })

  it('nom = juste un mot métier → on garde l\'original (refuse de renvoyer "")', () => {
    expect(stripCategoryWords('Boulangerie')).toBe('Boulangerie')
  })

  it('chaîne vide → chaîne vide', () => {
    expect(stripCategoryWords('')).toBe('')
    expect(stripCategoryWords('   ')).toBe('')
  })

  it('idempotent', () => {
    const input = 'Boulangerie - Pâtisserie Le Loup Gourmand'
    const once = stripCategoryWords(input)
    expect(stripCategoryWords(once)).toBe(once)
  })

  it('gère les accents et tirets longs', () => {
    expect(stripCategoryWords('Pâtisserie — Le Roi du Macaron')).toBe('Le Roi du Macaron')
  })
})
