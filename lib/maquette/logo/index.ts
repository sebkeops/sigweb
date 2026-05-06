export { extractDominantColors } from './extract'
export { processLogoBuffer, LogoValidationError } from './process'
export type { ExtractedColor, ExtractedPalette } from './types'
export type { LogoProcessingResult } from './process'

// Helpers couleurs (utiles aux tests + à d'autres modules)
export {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  isUsableColor,
  deriveAccentFromPrimary,
  dedupAndSort,
} from './colors'
