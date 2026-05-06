import { describe, expect, it } from 'vitest'
import { parseItalicMarkers, stripItalicMarkers } from './parseItalicMarkers'

describe('parseItalicMarkers', () => {
  it('convertit une paire simple', () => {
    expect(parseItalicMarkers('Le pain *fait maison*'))
      .toBe('Le pain <em>fait maison</em>')
  })

  it('gère plusieurs paires sur la même ligne', () => {
    expect(parseItalicMarkers('Une *commande*, *une question* ?'))
      .toBe('Une <em>commande</em>, <em>une question</em> ?')
  })

  it('échappe les caractères HTML dangereux', () => {
    expect(parseItalicMarkers('<script>alert(1)</script>'))
      .toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('XSS via injection dans une paire italique : tout est échappé puis emballé', () => {
    expect(parseItalicMarkers('*<img src=x onerror=y>*'))
      .toBe('<em>&lt;img src=x onerror=y&gt;</em>')
  })

  it('échappe & < > " et apostrophes hors paires', () => {
    expect(parseItalicMarkers('Tom & Jerry "<3" l\'aventure'))
      .toBe('Tom &amp; Jerry &quot;&lt;3&quot; l&#39;aventure')
  })

  it('null/undefined/empty → ""', () => {
    expect(parseItalicMarkers(null)).toBe('')
    expect(parseItalicMarkers(undefined)).toBe('')
    expect(parseItalicMarkers('')).toBe('')
  })

  it('rejette les paires vides ou whitespace', () => {
    expect(parseItalicMarkers('foo ** bar')).toBe('foo ** bar')
    expect(parseItalicMarkers('foo * * bar')).toBe('foo * * bar')
    expect(parseItalicMarkers('* foo *')).toBe('* foo *')
  })

  it('accepte une paire mono-caractère', () => {
    expect(parseItalicMarkers('a *b* c')).toBe('a <em>b</em> c')
  })

  it('conserve les retours à la ligne', () => {
    expect(parseItalicMarkers('Ligne 1\n*Ligne 2*'))
      .toBe('Ligne 1\n<em>Ligne 2</em>')
  })

  it('apostrophe française dans le contenu italique', () => {
    expect(parseItalicMarkers('*l\'aventure*'))
      .toBe('<em>l&#39;aventure</em>')
  })

  it('asterisque solitaire est conservé', () => {
    expect(parseItalicMarkers('5 * 3 = 15')).toBe('5 * 3 = 15')
  })
})

describe('stripItalicMarkers', () => {
  it('retire les markers sans toucher au contenu', () => {
    expect(stripItalicMarkers('Le pain *fait maison*'))
      .toBe('Le pain fait maison')
  })

  it('plusieurs paires', () => {
    expect(stripItalicMarkers('Une *commande*, *une question* ?'))
      .toBe('Une commande, une question ?')
  })

  it('null/undefined/empty → ""', () => {
    expect(stripItalicMarkers(null)).toBe('')
    expect(stripItalicMarkers('')).toBe('')
  })

  it('rejette les paires vides', () => {
    expect(stripItalicMarkers('foo ** bar')).toBe('foo ** bar')
  })

  it('n\'échappe pas le HTML (différence avec parseItalicMarkers)', () => {
    expect(stripItalicMarkers('<b>hello</b>')).toBe('<b>hello</b>')
  })
})
