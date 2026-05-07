import { describe, expect, it } from 'vitest'
import { buildSuffixedSlug, generateSlugBase } from './slug'

describe('generateSlugBase', () => {
  it('normalise un nom simple', () => {
    expect(generateSlugBase('Le Loup Gourmand')).toBe('le-loup-gourmand')
  })

  it('retire les accents', () => {
    expect(generateSlugBase('Maison Sabathé')).toBe('maison-sabathe')
    expect(generateSlugBase('Café Crème')).toBe('cafe-creme')
    expect(generateSlugBase('À l\'Œuf d\'Or')).toBe('a-l-uf-d-or') // ligature œ → vide après NFD
  })

  it('gère apostrophes, ponctuation et symboles', () => {
    expect(generateSlugBase('Aux Délices de Sophie')).toBe('aux-delices-de-sophie')
    expect(generateSlugBase('Pizza & Co.')).toBe('pizza-co')
    expect(generateSlugBase('Boulangerie #1!!!')).toBe('boulangerie-1')
  })

  it('compresse les espaces et tirets multiples', () => {
    expect(generateSlugBase('  Foo   ---   Bar  ')).toBe('foo-bar')
    expect(generateSlugBase('a---b')).toBe('a-b')
  })

  it('respecte la longueur max 60', () => {
    const long = 'Boulangerie '.repeat(20)
    const slug = generateSlugBase(long)
    expect(slug.length).toBeLessThanOrEqual(60)
    expect(slug).toMatch(/^[a-z0-9-]+$/)
    expect(slug).not.toMatch(/-$/) // pas de tiret final
  })

  it('renvoie "maquette" si la sortie est vide', () => {
    expect(generateSlugBase('!!!')).toBe('maquette')
    expect(generateSlugBase('   ')).toBe('maquette')
    expect(generateSlugBase('')).toBe('maquette')
  })

  it('est déterministe (même entrée → même sortie)', () => {
    const a = generateSlugBase('Boulangerie Le Loup Gourmand')
    const b = generateSlugBase('Boulangerie Le Loup Gourmand')
    expect(a).toBe(b)
  })

  it('produit une sortie conforme au CHECK BDD ^[a-z0-9-]+$', () => {
    const samples = [
      'Le Loup Gourmand',
      'Pizz\'à Pierre',
      'L\'Étoile du Berger',
      'Boucherie Dubœuf & Fils',
      'Café n°1 (Toulouse)',
    ]
    for (const s of samples) {
      const slug = generateSlugBase(s)
      expect(slug).toMatch(/^[a-z0-9-]+$/)
      expect(slug.length).toBeGreaterThanOrEqual(1)
      expect(slug.length).toBeLessThanOrEqual(60)
    }
  })
})

describe('buildSuffixedSlug', () => {
  it('renvoie la base inchangée pour suffix <= 1', () => {
    expect(buildSuffixedSlug('le-loup', 0)).toBe('le-loup')
    expect(buildSuffixedSlug('le-loup', 1)).toBe('le-loup')
  })

  it('ajoute le suffixe -N pour les doublons', () => {
    expect(buildSuffixedSlug('le-loup', 2)).toBe('le-loup-2')
    expect(buildSuffixedSlug('le-loup', 12)).toBe('le-loup-12')
  })

  it('coupe la base si la longueur totale dépasse 80', () => {
    const longBase = 'a'.repeat(80)
    const result = buildSuffixedSlug(longBase, 2)
    expect(result.length).toBeLessThanOrEqual(80)
    expect(result.endsWith('-2')).toBe(true)
  })

  it('ne laisse pas de tiret avant le suffixe quand on coupe', () => {
    const base = 'a'.repeat(78) + '-b'
    const result = buildSuffixedSlug(base, 2)
    expect(result.length).toBeLessThanOrEqual(80)
    expect(result).toMatch(/^[a-z0-9-]+$/)
    expect(result).not.toMatch(/--/)
  })
})
