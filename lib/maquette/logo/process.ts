import 'server-only'
import sharp from 'sharp'

/**
 * Validation + normalisation d'un upload de logo.
 *
 * Sécurité (cf. brief V1) :
 *   - MIME réel détecté par sharp (pas l'extension du nom)
 *   - Whitelist : JPEG, PNG, WebP (pas de SVG en V1, trop complexe à sanitizer)
 *   - Taille max 4 MB (cap aligné sur la limite serverless Vercel Hobby
 *     de 4.5 Mo + bodySizeLimit Next.js — au-dessus, le 413 remonte avant
 *     même d'atteindre cette validation)
 *   - Dimensions : 64×64 min, 4000×4000 max
 *
 * Sortie : buffer WebP qualité 90, max 512 px, transparence préservée.
 */

const MAX_SIZE_BYTES = 4 * 1024 * 1024
const MIN_DIMENSION = 64
const MAX_DIMENSION = 4000
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp'])

export interface LogoProcessingResult {
  webpBuffer: Buffer
  /** Format détecté en entrée (avant conversion). */
  inputFormat: string
  /** Dimensions originales. */
  inputWidth: number
  inputHeight: number
  /** Dimensions après resize (le logo final). */
  outputWidth: number
  outputHeight: number
}

export class LogoValidationError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'LogoValidationError'
  }
}

export async function processLogoBuffer(buffer: Buffer): Promise<LogoProcessingResult> {
  if (buffer.length === 0) {
    throw new LogoValidationError('EMPTY', 'Fichier vide.')
  }
  if (buffer.length > MAX_SIZE_BYTES) {
    throw new LogoValidationError('TOO_LARGE', 'Le fichier dépasse 4 Mo.')
  }

  // Détection MIME réel via sharp (lit les magic bytes)
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

  // Resize 512 max + WebP qualité 90, transparence préservée.
  // `withoutEnlargement: true` évite de pixéliser un petit logo carré déjà ≤ 512.
  const webpBuffer = await sharp(buffer)
    .resize({
      width: 512,
      height: 512,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 90, alphaQuality: 100 })
    .toBuffer()

  // Re-lit les dims du résultat (peut être plus petit si l'original < 512)
  const outMeta = await sharp(webpBuffer).metadata()

  return {
    webpBuffer,
    inputFormat: metadata.format,
    inputWidth: w,
    inputHeight: h,
    outputWidth: outMeta.width ?? 512,
    outputHeight: outMeta.height ?? 512,
  }
}
