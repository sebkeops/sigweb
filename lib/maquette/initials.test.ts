import { describe, expect, it } from 'vitest'
import { getLogoInitial } from './initials'

describe('getLogoInitial', () => {
  it('prend la première lettre du premier mot significatif', () => {
    expect(getLogoInitial('Le Loup Gourmand')).toBe('L') // "Loup"
    expect(getLogoInitial('Maison Sabathé')).toBe('M')
    expect(getLogoInitial('Aux Délices de Sophie')).toBe('D') // "Délices"
    expect(getLogoInitial('Chez Marcel')).toBe('M') // "Marcel"
  })

  it('saute tous les mots ignorés', () => {
    expect(getLogoInitial('La Boulangerie')).toBe('B')
    expect(getLogoInitial('Aux Quatre Saisons')).toBe('Q')
    expect(getLogoInitial('Le Pain et la Vie')).toBe('P') // "Pain"
  })

  it('retire les accents', () => {
    expect(getLogoInitial('Étoile du Berger')).toBe('E')
    expect(getLogoInitial('Élysée Café')).toBe('E')
  })

  it('met systématiquement en majuscule', () => {
    expect(getLogoInitial('boulangerie martin')).toBe('B')
    expect(getLogoInitial('café de la place')).toBe('C')
  })

  it('renvoie une initiale même si le nom commence par un chiffre/symbole', () => {
    expect(getLogoInitial('123 Pizza')).toBe('P')
    expect(getLogoInitial('@Café')).toBe('C')
  })

  it('fallback "M" pour les noms sans aucun mot exploitable', () => {
    expect(getLogoInitial('123')).toBe('M')
    expect(getLogoInitial('!!!')).toBe('M')
    expect(getLogoInitial('')).toBe('M')
  })

  it('est déterministe', () => {
    const a = getLogoInitial('Le Loup Gourmand')
    const b = getLogoInitial('Le Loup Gourmand')
    expect(a).toBe(b)
  })
})
