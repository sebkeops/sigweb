'use server'

import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'project-images'
const MAX_SIZE = 5 * 1024 * 1024 // 5 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

/** Vérifie les magic bytes pour rejeter les fichiers non-image avant tout traitement */
function isAllowedImageMagicBytes(buf: Buffer): boolean {
  if (buf.length < 12) return false
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true
  // GIF: GIF8
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true
  // WebP: RIFF....WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return true
  // AVIF/MP4 box: "ftyp" at offset 4
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) return true
  return false
}

export async function uploadProjectImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé.' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'Aucun fichier reçu.' }
  if (!ALLOWED_TYPES.includes(file.type)) return { error: 'Format non supporté. Utilisez JPG, PNG ou WebP.' }
  if (file.size > MAX_SIZE) return { error: "L'image ne doit pas dépasser 5 Mo." }

  // Validation magic bytes (vérification du vrai type de fichier, indépendant du MIME client)
  const buffer = Buffer.from(await file.arrayBuffer())
  if (!isAllowedImageMagicBytes(buffer)) {
    return { error: 'Le fichier ne semble pas être une image valide.' }
  }

  // Conversion en WebP
  let webpBuffer: Buffer
  try {
    webpBuffer = await sharp(buffer)
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    return { error: "Impossible de traiter l'image. Vérifiez que le fichier n'est pas corrompu." }
  }

  // Nom de fichier unique
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, webpBuffer, { contentType: 'image/webp', upsert: false })

  if (uploadError) {
    console.error('[uploadProjectImage]', uploadError)
    return { error: "Erreur lors de l'envoi. Vérifiez que le bucket Supabase existe." }
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return { url: data.publicUrl }
}
