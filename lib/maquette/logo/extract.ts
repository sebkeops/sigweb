import 'server-only'
import { extractColors } from 'extract-colors'
import sharp from 'sharp'
import { dedupAndSort, deriveAccentFromPrimary, isUsableColor, rgbToHex } from './colors'
import type { ExtractedColor, ExtractedPalette } from './types'

/**
 * Extrait les couleurs dominantes d'un buffer image et retourne une
 * `ExtractedPalette` prête pour la maquette.
 *
 * Pipeline :
 *   1. Sharp décode l'image en raw RGBA (compat avec extract-colors qui
 *      attend pixels typés)
 *   2. extract-colors avec filtres anti-bruit (distance, saturation,
 *      lightness)
 *   3. Filtre applicatif : on rejette les couleurs trop sombres, claires
 *      ou désaturées (cf. brief — luminance 15-90, saturation > 15)
 *   4. Déduplication des hex proches + tri par dominance
 *   5. Si 0 couleur usable : retourne `null` (le caller bascule sur la
 *      palette catégorie)
 *   6. Si 1 couleur usable : dérive l'accent via `deriveAccentFromPrimary`
 *   7. Sinon : primary = candidate[0], accent = candidate[1]
 *
 * Nota : on extrait sur l'image ORIGINALE (avant resize 512px) pour avoir
 * plus de pixels et donc une dominance plus représentative — sauf si
 * l'image est très grande, on la down-sample à 256 px max pour la perf
 * (extraction lente sur > 1M pixels).
 */
export async function extractDominantColors(
  buffer: Buffer
): Promise<ExtractedPalette | null> {
  // Down-sample pour la perf : extract-colors itère sur tous les pixels
  const { data, info } = await sharp(buffer)
    .resize({ width: 256, height: 256, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // extract-colors attend un Uint8ClampedArray-like
  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength)

  const raw = await extractColors(
    { data: pixels, width: info.width, height: info.height },
    {
      // Pixels minimum pour qu'une couleur soit prise en compte (anti-bruit).
      pixels: 64000,
      distance: 0.18,
      saturationDistance: 0.06,
      lightnessDistance: 0.18,
      hueDistance: 0.083,
    }
  )

  // Normalisation
  const all: ExtractedColor[] = raw.map((c) => ({
    hex: c.hex.toUpperCase(),
    weight: c.area, // 0–1 (proportion de pixels de cette couleur)
  }))

  // Application des filtres "utilisable" (luminance, saturation)
  const usable = all.filter((c) => isUsableColor(c.hex))
  if (usable.length === 0) return null

  const candidates = dedupAndSort(usable, 5)
  if (candidates.length === 0) return null

  const primary = candidates[0].hex
  const accent = candidates.length >= 2
    ? candidates[1].hex
    : deriveAccentFromPrimary(primary)

  return { primary, accent, candidates }
}

// Réexports pour les tests
export { isUsableColor, deriveAccentFromPrimary, dedupAndSort, rgbToHex }
