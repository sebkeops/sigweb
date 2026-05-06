import type { ExtractedColor } from './types'

/**
 * Helpers de manipulation de couleur (hex/HSL) — utilisés par l'extraction
 * pour filtrer les couleurs trop sombres / claires / désaturées et pour
 * dériver une couleur d'accent quand l'extraction ne donne qu'une dominante.
 *
 * Pas de dépendance externe (chroma-js, color, etc.) pour rester léger.
 */

/** "#RRGGBB" → { r, g, b } 0-255. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const v = parseInt(m[1], 16)
  return {
    r: (v >> 16) & 0xff,
    g: (v >> 8) & 0xff,
    b: v & 0xff,
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

/** RGB 0-255 → HSL avec H 0-360, S 0-100, L 0-100. */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)); break
      case gn: h = ((bn - rn) / d + 2); break
      case bn: h = ((rn - gn) / d + 4); break
    }
    h *= 60
  }
  return { h, s: s * 100, l: l * 100 }
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const sn = s / 100, ln = l / 100
  if (sn === 0) {
    const v = ln * 255
    return { r: v, g: v, b: v }
  }
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

/**
 * Filtres applicatifs sur une couleur (basés sur HSL) :
 *   - luminance 15-90 (rejette noir et blanc purs)
 *   - saturation ≥ 15 (rejette les gris)
 */
export function isUsableColor(hex: string): boolean {
  const rgb = hexToRgb(hex)
  if (!rgb) return false
  const { s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b)
  return l >= 15 && l <= 90 && s >= 15
}

/**
 * Dérive une couleur d'accent depuis une couleur primaire :
 * - on garde la teinte (h) et la saturation (s)
 * - on bascule la lightness vers ~30% si la primaire est claire (>50),
 *   ou ~70% si la primaire est sombre (≤50). Donne un accent visiblement
 *   différent en intensité, qui marche en hover/CTA secondaire.
 *
 * Usage : fallback quand l'extraction ne renvoie qu'une seule couleur usable.
 */
export function deriveAccentFromPrimary(primary: string): string {
  const rgb = hexToRgb(primary)
  if (!rgb) return primary
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const newL = hsl.l > 50 ? 30 : 70
  const out = hslToRgb(hsl.h, hsl.s, newL)
  return rgbToHex(out.r, out.g, out.b)
}

/**
 * Trie les couleurs par dominance décroissante, déduplique les hex
 * trop proches (différence par composante < 12), et garde N max.
 */
export function dedupAndSort(colors: ExtractedColor[], max = 5): ExtractedColor[] {
  const sorted = [...colors].sort((a, b) => b.weight - a.weight)
  const out: ExtractedColor[] = []
  for (const c of sorted) {
    const a = hexToRgb(c.hex)
    if (!a) continue
    const dup = out.some((o) => {
      const b = hexToRgb(o.hex)
      if (!b) return false
      return Math.abs(a.r - b.r) < 12 && Math.abs(a.g - b.g) < 12 && Math.abs(a.b - b.b) < 12
    })
    if (dup) continue
    out.push(c)
    if (out.length >= max) break
  }
  return out
}
