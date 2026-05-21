import { METIER_PRESETS } from '@/lib/maquette/presets/metiers'
import { buildTemplate } from './_buildFromPreset'

/**
 * Template Famille 2 — Boulangerie.
 *
 * Construit à partir du preset `boulangerie` (palette + brandTagline + atouts
 * + nosCreations + lexique + defaults + paletteOverrides). La source de
 * vérité est désormais le preset (`lib/maquette/presets/metiers.ts`).
 */
export const boulangerie = buildTemplate({ preset: METIER_PRESETS.boulangerie })
