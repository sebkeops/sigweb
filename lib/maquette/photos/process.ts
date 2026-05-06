import 'server-only'
import sharp from 'sharp'
import { LogoValidationError } from '@/lib/maquette/logo'

/**
 * Validation + normalisation d'un upload de photo (univers / hero / histoire).
 *
 * Sécurité (alignée sur le pipeline logo) :
 *   - MIME réel détecté par sharp (pas l'extension)
 *   - Whitelist : JPEG, PNG, WebP (pas de SVG)
 *   - Taille max 5 MB
 *   - Dimensions : 400×400 min (pour avoir de la matière sur cards univers
 *     qui s'affichent en 16:10), 4000×4000 max
 *
 * Sortie : buffer WebP qualité 80, max 1920 px largeur, pas d'alphaQuality
 * spécifique (les photos sont JPEG/PNG sans transparence en pratique).
 *
 * On réutilise `LogoValidationError` du module logo — même error type pour
 * tous les uploads d'image (cohérence côté handler client).
 */

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const MIN_DIMENSION = 400
const MAX_DIMENSION = 4000
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp'])

export interface PhotoProcessingResult {
  webpBuffer: Buffer
  inputFormat: string
  inputWidth: number
  inputHeight: number
  outputWidth: number
  outputHeight: number
}

export async function processPhotoBuffer(buffer: Buffer): Promise<PhotoProcessingResult> {
  if (buffer.length === 0) {
    throw new LogoValidationError('EMPTY', 'Fichier vide.')
  }
  if (buffer.length > MAX_SIZE_BYTES) {
    throw new LogoValidationError('TOO_LARGE', 'Le fichier dépasse 5 Mo.')
  }

  let metadata: sharp.Metadata
  try {
    metadata = await sharp(buffer).metadata()
  } catch {
    throw new LogoValidationError('INVALID', 'Fichier image invalide ou corrompu.')
  }

  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    throw new LogoValidationError(
      'WRONG_FORMAT',
      `Format non supporté (${metadata.format ?? 'inconnu'}). Utilise JPEG, PNG ou WebP.`
    )
  }

  const w = metadata.width ?? 0
  const h = metadata.height ?? 0
  if (w < MIN_DIMENSION || h < MIN_DIMENSION) {
    throw new LogoValidationError(
      'TOO_SMALL',
      `Dimensions trop petites (${w}×${h}). Minimum ${MIN_DIMENSION}×${MIN_DIMENSION}.`
    )
  }
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    throw new LogoValidationError(
      'TOO_BIG',
      `Dimensions trop grandes (${w}×${h}). Maximum ${MAX_DIMENSION}×${MAX_DIMENSION}.`
    )
  }

  const webpBuffer = await sharp(buffer)
    .resize({
      width: 1920,
      height: 1920,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer()

  const outMeta = await sharp(webpBuffer).metadata()

  return {
    webpBuffer,
    inputFormat: metadata.format,
    inputWidth: w,
    inputHeight: h,
    outputWidth: outMeta.width ?? 1920,
    outputHeight: outMeta.height ?? 1920,
  }
}
