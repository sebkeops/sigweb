import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { fetchGooglePhotoBuffer } from '@/lib/affiche/photo-fetcher'
import type { MaquettePhotoEntry } from '@/types'

// ============================================================================
// Persistance des photos Google d'une maquette dans Supabase Storage.
//
// Pourquoi ce module existe (cf. CONTEXT.md → "Photos maquettes / refs Google
// expirent") : les refs Places API (`places/X/photos/Y`) renvoyées au sourcing
// ne sont PAS permanentes. Elles expirent après quelques semaines/mois et le
// proxy live `/api/demos/photo` finit par renvoyer 502 "Photo unavailable",
// cassant le hero et la galerie de maquettes pourtant déjà envoyées au prospect.
//
// La parade : à la création de la maquette, on télécharge chaque photo Google,
// on la convertit en WebP et on la stocke dans le bucket `maquettes-assets`,
// exactement comme un upload manuel via PhotoManager. La `MaquettePhotoEntry`
// bascule alors de `source: 'google'` (ref volatile) à `source: 'upload'`
// (URL Supabase stable). Plus jamais de dépendance au proxy live à l'affichage.
//
// Garde-fous appliqués :
//   - Idempotent : on saute toute entrée `source: 'upload'` (rien à faire).
//   - Sharp permissif : on accepte ce que Google renvoie (taille, format),
//     contrairement à `processPhotoBuffer` qui est strict pour les uploads
//     admin (refus 4MB+, refus < 400px, etc.). Google peut renvoyer petit.
//   - Pas de blocage : si la persistance d'une photo échoue (ref déjà expirée,
//     timeout, erreur Storage…), on garde l'entrée originale dans le pool et
//     on signale la perte dans `failures` pour journalisation. La maquette
//     est créée quoi qu'il arrive — au pire avec quelques refs Google qui
//     dégraderont normalement.
//   - `upsert: true` : si on rejoue la persistance (cas du script de reprise),
//     on écrase proprement le fichier existant au lieu d'échouer.
// ============================================================================

const STORAGE_BUCKET = 'maquettes-assets'
const STORAGE_PHOTO_PREFIX = 'photos'
const MAX_HEIGHT_PX = 1600
const WEBP_MAX_WIDTH = 1920
const WEBP_QUALITY = 82

export interface PersistGoogleRefsResult {
  /** Nouvelles entrées (source: 'upload') indexées par l'id original. */
  persisted: Map<string, MaquettePhotoEntry>
  /** Entrées Google qui ont échoué — l'original reste dans le pool. */
  failures: Array<{ id: string; reference: string; reason: string }>
}

export async function persistGooglePhotoRefs(
  supabase: SupabaseClient,
  maquetteId: string,
  entries: readonly MaquettePhotoEntry[]
): Promise<PersistGoogleRefsResult> {
  const persisted = new Map<string, MaquettePhotoEntry>()
  const failures: PersistGoogleRefsResult['failures'] = []

  for (const entry of entries) {
    if (entry.source !== 'google') continue
    if (!entry.reference) {
      failures.push({ id: entry.id, reference: '', reason: 'empty_reference' })
      continue
    }

    try {
      const buffer = await fetchGooglePhotoBuffer(entry.reference, {
        maxHeightPx: MAX_HEIGHT_PX,
      })
      if (!buffer) {
        failures.push({
          id: entry.id,
          reference: entry.reference,
          reason: 'google_fetch_returned_null',
        })
        continue
      }

      const webpBuffer = await sharp(buffer)
        .rotate()
        .resize({ width: WEBP_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer()

      const path = `${STORAGE_PHOTO_PREFIX}/${maquetteId}/${entry.id}.webp`
      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, webpBuffer, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true,
        })
      if (uploadErr) {
        failures.push({
          id: entry.id,
          reference: entry.reference,
          reason: `storage_upload: ${uploadErr.message}`,
        })
        continue
      }

      const { data: pub } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path)

      persisted.set(entry.id, {
        id: entry.id,
        source: 'upload',
        reference: pub.publicUrl,
        caption: entry.caption,
        uploaded_at: new Date().toISOString(),
      })
    } catch (e) {
      failures.push({
        id: entry.id,
        reference: entry.reference,
        reason: `exception: ${(e as Error).message}`,
      })
    }
  }

  return { persisted, failures }
}

/**
 * Applique le résultat de `persistGooglePhotoRefs` à un pool existant.
 * Les entrées persistées remplacent les originales (même `id`, donc les
 * `photo_assignments` continuent de pointer juste). Les échecs gardent
 * l'entrée originale (`source: 'google'` avec sa ref volatile) — la
 * maquette reste fonctionnelle, juste fragile sur ces photos précises.
 */
export function applyPersistedPhotos(
  pool: readonly MaquettePhotoEntry[],
  persisted: Map<string, MaquettePhotoEntry>
): MaquettePhotoEntry[] {
  return pool.map((entry) => persisted.get(entry.id) ?? entry)
}
