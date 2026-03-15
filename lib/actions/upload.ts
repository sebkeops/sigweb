'use server'

import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'project-images'
const MAX_SIZE = 5 * 1024 * 1024 // 5 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

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

  // Conversion en WebP
  const buffer = Buffer.from(await file.arrayBuffer())
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
