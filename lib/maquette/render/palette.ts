import type { CSSProperties } from 'react'
import type { Maquette } from '@/types'
import type { TemplatePalette } from '../types'

/**
 * Palette effective rendue sur la maquette, après application des overrides
 * éventuels (couleurs extraites du logo ou personnalisées par l'admin).
 *
 * Les neutres (cream, ink, ink-soft, ink-muted) ne sont JAMAIS surchargés :
 * c'est ce qui garantit la lisibilité à travers les 4 templates et tous les
 * modes de palette. Seuls `primary` et `accent` peuvent varier.
 */
export function getEffectivePalette(
  maquette: Maquette,
  basePalette: TemplatePalette
): TemplatePalette {
  if (maquette.palette_mode === 'category') return basePalette
  return {
    ...basePalette,
    primary: maquette.palette_primary ?? basePalette.primary,
    accent: maquette.palette_accent ?? basePalette.accent,
  }
}

/**
 * Sérialise la palette en variables CSS pour injection via `style={{...}}`
 * sur le wrapper racine de la maquette. Évite `dangerouslySetInnerHTML`.
 */
export function paletteToCssVars(palette: TemplatePalette): CSSProperties {
  return {
    ['--cream' as string]: palette.cream,
    ['--cream-light' as string]: palette.creamLight,
    ['--cream-warm' as string]: palette.creamWarm,
    ['--ink' as string]: palette.ink,
    ['--ink-soft' as string]: palette.inkSoft,
    ['--ink-muted' as string]: palette.inkMuted,
    ['--primary' as string]: palette.primary,
    ['--primary-soft' as string]: palette.primarySoft,
    ['--accent' as string]: palette.accent,
    ['--accent-light' as string]: palette.accentLight,
  } as CSSProperties
}

/**
 * Normalise un téléphone français pour usage `tel:` URI.
 * Conserve uniquement les chiffres et le préfixe `+` éventuel.
 *   "05 62 07 00 00"  → "0562070000"
 *   "+33 5 62 07 00 00" → "+33562070000"
 *   null → null
 */
export function formatTelHref(phone: string | null | undefined): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[^0-9+]/g, '')
  return cleaned.length > 0 ? cleaned : null
}
