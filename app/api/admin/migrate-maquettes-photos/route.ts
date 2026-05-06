import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  assertAssignmentsPointToPool,
  availablePhotosSchema,
  migrateLegacyPhotos,
  photoAssignmentsSchema,
} from '@/lib/maquette/photos'

/**
 * Route one-shot pour migrer les maquettes existantes (modèle legacy
 * 3 colonnes) vers le nouveau modèle pool + assignations.
 *
 * Idempotente : on ne traite QUE les maquettes ayant `available_photos IS NULL`.
 * Une fois migrée, une maquette ne sera plus retraitée.
 *
 * À supprimer une fois la migration effectuée et validée (cf. CLEANUP-TODO.md).
 *
 * - GET  : nombre de maquettes restant à migrer
 * - POST : exécute la migration, retourne les stats
 *
 * Sécurité : admin only (auth.getUser).
 */

interface LegacyMaquetteRow {
  id: string
  hero_photo_url: string | null
  histoire_photo_url: string | null
  univers_photos_urls: string[] | null
}

async function selectMaquettesToMigrate() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' as const, supabase: null, rows: null }

  const { data, error } = await supabase
    .from('maquettes')
    .select('id, hero_photo_url, histoire_photo_url, univers_photos_urls')
    .is('available_photos', null)

  if (error) return { error: 'select' as const, supabase: null, rows: null }
  return { error: null, supabase, rows: (data ?? []) as LegacyMaquetteRow[] }
}

export async function GET() {
  const { error, rows } = await selectMaquettesToMigrate()
  if (error === 'Unauthorized') return new NextResponse('Unauthorized', { status: 401 })
  if (error) return NextResponse.json({ ok: false, error }, { status: 500 })
  return NextResponse.json({ ok: true, count: rows?.length ?? 0 })
}

export async function POST() {
  const { error, supabase, rows } = await selectMaquettesToMigrate()
  if (error === 'Unauthorized') return new NextResponse('Unauthorized', { status: 401 })
  if (error || !supabase || !rows) {
    return NextResponse.json({ ok: false, error: 'select' }, { status: 500 })
  }

  let migrated = 0
  const failures: { id: string; error: string }[] = []

  for (const row of rows) {
    try {
      const photoData = migrateLegacyPhotos({
        hero_photo_url: row.hero_photo_url,
        histoire_photo_url: row.histoire_photo_url,
        univers_photos_urls: row.univers_photos_urls,
      })

      // Validation Zod runtime (filet de sécurité avant écriture BDD)
      availablePhotosSchema.parse(photoData.available_photos)
      photoAssignmentsSchema.parse(photoData.photo_assignments)
      assertAssignmentsPointToPool(photoData.available_photos, photoData.photo_assignments)

      const { error: updErr } = await supabase
        .from('maquettes')
        .update({
          available_photos: photoData.available_photos,
          photo_assignments: photoData.photo_assignments,
        })
        .eq('id', row.id)

      if (updErr) throw new Error(updErr.message)
      migrated += 1
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[migrate-maquettes-photos]', row.id, msg)
      failures.push({ id: row.id, error: msg })
    }
  }

  return NextResponse.json({
    ok: true,
    total: rows.length,
    migrated,
    failures,
  })
}
