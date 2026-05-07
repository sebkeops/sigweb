import { describe, expect, it } from 'vitest'
import {
  dedupAndSort,
  deriveAccentFromPrimary,
  hexToRgb,
  hslToRgb,
  isUsableColor,
  rgbToHex,
  rgbToHsl,
} from './colors'

describe('hex/rgb conversions', () => {
  it('hexToRgb / rgbToHex round-trip', () => {
    expect(hexToRgb('#B5512E')).toEqual({ r: 0xb5, g: 0x51, b: 0x2e })
    expect(rgbToHex(0xb5, 0x51, 0x2e)).toBe('#b5512e')
  })

  it('hexToRgb rejette les formats invalides', () => {
    expect(hexToRgb('B5512E')).toBeNull()
    expect(hexToRgb('#B5G')).toBeNull()
    expect(hexToRgb('#B5512')).toBeNull()
    expect(hexToRgb('rgb(1,2,3)')).toBeNull()
  })

  it('rgbToHex clamp les valeurs hors plage', () => {
    expect(rgbToHex(-50, 300, 128)).toBe('#00ff80')
  })
})

describe('rgbToHsl / hslToRgb', () => {
  it('terracotta — round-trip approximatif', () => {
    const rgb = { r: 0xb5, g: 0x51, b: 0x2e }
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    expect(hsl.h).toBeGreaterThan(10)
    expect(hsl.h).toBeLessThan(20)
    expect(hsl.s).toBeGreaterThan(50)
    expect(hsl.l).toBeGreaterThan(30)

    const back = hslToRgb(hsl.h, hsl.s, hsl.l)
    expect(back.r).toBeCloseTo(rgb.r, -1)
    expect(back.g).toBeCloseTo(rgb.g, -1)
    expect(back.b).toBeCloseTo(rgb.b, -1)
  })

  it('niveau de gris : saturation = 0', () => {
    const hsl = rgbToHsl(128, 128, 128)
    expect(hsl.s).toBe(0)
  })
})

describe('isUsableColor — filtres luminance/saturation', () => {
  it('accepte les couleurs vives et bien luminantes', () => {
    expect(isUsableColor('#B5512E')).toBe(true) // terracotta
    expect(isUsableColor('#7A1F2B')).toBe(true) // bordeaux
    expect(isUsableColor('#4A6B4A')).toBe(true) // sauge
  })

  it('rejette le noir et le blanc', () => {
    expect(isUsableColor('#000000')).toBe(false)
    expect(isUsableColor('#FFFFFF')).toBe(false)
  })

  it('rejette les gris (saturation < 15)', () => {
    expect(isUsableColor('#808080')).toBe(false) // gris pur
    expect(isUsableColor('#A0A0A8')).toBe(false) // quasi-gris
  })

  it('rejette les couleurs trop sombres (luminance < 15)', () => {
    expect(isUsableColor('#0A0103')).toBe(false)
  })

  it('rejette les couleurs trop claires (luminance > 90)', () => {
    expect(isUsableColor('#FAF6EE')).toBe(false) // cream presque blanc
  })

  it('rejette une entrée invalide', () => {
    expect(isUsableColor('not-a-hex')).toBe(false)
  })
})

describe('deriveAccentFromPrimary', () => {
  it('couleur sombre → accent plus clair', () => {
    const accent = deriveAccentFromPrimary('#7A1F2B') // bordeaux sombre
    const rgb = hexToRgb(accent)!
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    expect(hsl.l).toBeGreaterThan(60) // ≈ 70
  })

  it('couleur claire → accent plus sombre', () => {
    const accent = deriveAccentFromPrimary('#D4A968') // gold-light
    const rgb = hexToRgb(accent)!
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    expect(hsl.l).toBeLessThan(40) // ≈ 30
  })

  it('couleur moyenne (l≈50) → accent ~70 (basculé clair)', () => {
    const accent = deriveAccentFromPrimary('#B5512E') // terracotta l≈45
    const rgb = hexToRgb(accent)!
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    expect(hsl.l).toBeGreaterThan(60)
  })

  it('hex invalide → renvoie l\'entrée', () => {
    expect(deriveAccentFromPrimary('bogus')).toBe('bogus')
  })
})

describe('dedupAndSort', () => {
  it('trie par dominance décroissante', () => {
    const result = dedupAndSort([
      { hex: '#FF0000', weight: 0.1 },
      { hex: '#00FF00', weight: 0.5 },
      { hex: '#0000FF', weight: 0.4 },
    ])
    expect(result.map((r) => r.hex)).toEqual(['#00FF00', '#0000FF', '#FF0000'])
  })

  it('déduplique les couleurs proches (différence < 12 par composante)', () => {
    const result = dedupAndSort([
      { hex: '#B5512E', weight: 0.5 },
      { hex: '#B85432', weight: 0.3 }, // très proche
      { hex: '#7A1F2B', weight: 0.2 },
    ])
    expect(result).toHaveLength(2)
    expect(result[0].hex).toBe('#B5512E')
    expect(result[1].hex).toBe('#7A1F2B')
  })

  it('respecte le max', () => {
    const colors = Array.from({ length: 10 }, (_, i) => ({
      hex: `#${i.toString(16).padStart(2, '0')}80${(255 - i * 20).toString(16).padStart(2, '0')}`,
      weight: 1 - i * 0.1,
    }))
    const result = dedupAndSort(colors, 3)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('liste vide → vide', () => {
    expect(dedupAndSort([])).toEqual([])
  })
})
