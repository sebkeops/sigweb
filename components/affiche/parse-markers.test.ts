import { describe, expect, it } from 'vitest'
import { parseMarkers } from './parse-markers'

describe('parseMarkers', () => {
  it('chaîne simple sans marqueur', () => {
    expect(parseMarkers('Bonjour le monde')).toEqual([{ text: 'Bonjour le monde' }])
  })

  it('italique simple', () => {
    expect(parseMarkers('Le pain *fait maison*')).toEqual([
      { text: 'Le pain ' },
      { text: 'fait maison', italic: true },
    ])
  })

  it('gras simple', () => {
    expect(parseMarkers('Note **4,8/5** clients')).toEqual([
      { text: 'Note ' },
      { text: '4,8/5', bold: true },
      { text: ' clients' },
    ])
  })

  it('mélange gras + italique sur la même ligne', () => {
    expect(parseMarkers('Voir *votre simulation* dès **maintenant**')).toEqual([
      { text: 'Voir ' },
      { text: 'votre simulation', italic: true },
      { text: ' dès ' },
      { text: 'maintenant', bold: true },
    ])
  })

  it('préserve les \\n', () => {
    expect(parseMarkers('Et si votre boulangerie\navait *enfin* son site ?')).toEqual([
      { text: 'Et si votre boulangerie\navait ' },
      { text: 'enfin', italic: true },
      { text: ' son site ?' },
    ])
  })

  it('null / undefined / vide → tableau vide', () => {
    expect(parseMarkers(null)).toEqual([])
    expect(parseMarkers(undefined)).toEqual([])
    expect(parseMarkers('')).toEqual([])
  })

  it('rejette les paires vides ou whitespace', () => {
    expect(parseMarkers('foo ** bar')).toEqual([{ text: 'foo ** bar' }])
    expect(parseMarkers('foo * * bar')).toEqual([{ text: 'foo * * bar' }])
  })

  it('astérisque solitaire conservé', () => {
    expect(parseMarkers('5 * 3 = 15')).toEqual([{ text: '5 * 3 = 15' }])
  })

  it('gras suivi d\'italique sans espace', () => {
    expect(parseMarkers('**Important** *à lire*')).toEqual([
      { text: 'Important', bold: true },
      { text: ' ' },
      { text: 'à lire', italic: true },
    ])
  })

  it('apostrophe française dans contenu', () => {
    expect(parseMarkers('**l\'aventure**')).toEqual([
      { text: 'l\'aventure', bold: true },
    ])
  })
})
