import 'server-only'
import sharp from 'sharp'

/**
 * @react-pdf/renderer ne supporte que JPEG et PNG (cf. doc officielle).
 * Or les photos uploadées par l'admin sont stockées en WebP (cf.
 * `lib/actions/maquette.ts` - photos converties à 1920px / quality 80).
 * Sans normalisation, `<Image src={dataURL}>` échoue silencieusement et
 * le hero apparaît vide dans le PDF.
 *
 * Cette fonction :
 *   - identifie le format réel du buffer via les magic bytes (pas confiance
 *     aveugle dans l'extension du fichier ni dans le `Content-Type` HTTP)
 *   - laisse JPEG/PNG inchangés (zéro coût pour les photos Google)
 *   - convertit WebP (et autres formats sharp-decodables) en JPEG q=85
 *
 * Renvoie null si le buffer n'est pas une image décodable — auquel cas
 * le composant PDF tombera sur le placeholder dégradé vert.
 */

type Normalized = {
  data: Buffer
  mime: 'image/jpeg' | 'image/png'
}

export async function normalizeImageBuffer(
  buffer: Buffer
): Promise<Normalized | null> {
  if (!buffer || buffer.length < 12) return null

  // JPEG : FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { data: buffer, mime: 'image/jpeg' }
  }

  // PNG : 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { data: buffer, mime: 'image/png' }
  }

  // Tout autre format (WebP, AVIF, TIFF, HEIF…) est reconverti en JPEG.
  // Pour les buffers non-images (ex : page d'erreur HTML / XML retournée
  // par un Storage 403 ou un Google ref expiré), sharp throw → null.
  try {
    const jpeg = await sharp(buffer).jpeg({ quality: 85 }).toBuffer()
    return { data: jpeg, mime: 'image/jpeg' }
  } catch (e) {
    console.error('[affiche/image-normalizer] sharp decode failed:', e)
    return null
  }
}
