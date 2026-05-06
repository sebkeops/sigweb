import { describe, expect, it } from 'vitest'
import { formatAuthorName, getAuthorInitial } from './author-name'

describe('formatAuthorName', () => {
  it('format simple : "Sophie Martin" → "Sophie M."', () => {
    expect(formatAuthorName('Sophie Martin')).toBe('Sophie M.')
  })

  it('prénom composé : "Jean-Luc Martin" → "Jean-Luc M."', () => {
    expect(formatAuthorName('Jean-Luc Martin')).toBe('Jean-Luc M.')
  })

  it('nom composé : "Sophie Martin-Dupont" → "Sophie M."', () => {
    expect(formatAuthorName('Sophie Martin-Dupont')).toBe('Sophie M.')
  })

  it('3 tokens : "Sophie Marie Martin" → "Sophie M." (initiale du 2e)', () => {
    expect(formatAuthorName('Sophie Marie Martin')).toBe('Sophie M.')
  })

  it('mononyme/pseudo : "Cookie" → "Cookie"', () => {
    expect(formatAuthorName('Cookie')).toBe('Cookie')
  })

  it('normalise les espaces multiples', () => {
    expect(formatAuthorName('  Sophie   Martin  ')).toBe('Sophie M.')
  })

  it('chaîne vide ou null → ""', () => {
    expect(formatAuthorName('')).toBe('')
    expect(formatAuthorName('   ')).toBe('')
    expect(formatAuthorName(null)).toBe('')
    expect(formatAuthorName(undefined)).toBe('')
  })

  it('met en majuscule l\'initiale', () => {
    expect(formatAuthorName('sophie martin')).toBe('sophie M.')
  })

  it('initiale accentuée conservée correctement', () => {
    // "Émilie Étienne" → "Émilie É."
    expect(formatAuthorName('Émilie Étienne')).toBe('Émilie É.')
  })
})

describe('getAuthorInitial', () => {
  it('renvoie la première lettre du prénom', () => {
    expect(getAuthorInitial('Sophie Martin')).toBe('S')
    expect(getAuthorInitial('Jean-Luc Martin')).toBe('J')
    expect(getAuthorInitial('cookie')).toBe('C')
  })

  it('retire les accents pour l\'avatar', () => {
    expect(getAuthorInitial('Émilie Étienne')).toBe('E')
    expect(getAuthorInitial('Élise')).toBe('E')
  })

  it('null si aucune lettre exploitable', () => {
    expect(getAuthorInitial(null)).toBeNull()
    expect(getAuthorInitial('')).toBeNull()
    expect(getAuthorInitial('   ')).toBeNull()
    expect(getAuthorInitial('123')).toBeNull()
  })
})
