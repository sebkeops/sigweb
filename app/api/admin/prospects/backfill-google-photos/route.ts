import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlaceDetails, GooglePlacesError } from '@/lib/google-places'
import {
  assertAssignmentsPointToPool,
  availablePhotosSchema,
  backfillGooglePhotos,
  photoAssignmentsSchema,
} from '@/lib/maquette/photos'
import type { MaquettePhotoAssignment, MaquettePhotoEntry } from '@/types'

/**
 * Backfill intelligent des photos Google sur tous les prospects et leurs
 * maquettes existantes. Implémente le brief 3.6 :
 *
 *   - Pour chaque prospect avec google_place_id :
 *     1. Re-fetch via getPlaceDetails → jusqu'à 10 photos Google fraîches
 *     2. UPDATE prospects.google_photo_refs (et last_enriched_at)
 *     3. Si une maquette existe : appel `backfillGooglePhotos` qui :
 *        - garde les photos Google encore renvoyées par Google
 *        - garde les photos assignées à un slot (même si Google ne les renvoie plus)
 *        - retire les photos Google non renvoyées + non assignées
 *        - ajoute les nouvelles photos Google
 *        - ne TOUCHE JAMAIS les uploads manuels
 *
 * Streaming NDJSON pour la progression côté client (cohérent avec
 * `backfill-google-reviews`). Idempotent.
 *
 * Sécurité : admin only.
 */

interface ProspectRow {
  id: string
  nom_commerce: string
  google_place_id: string
}

async function selectEligibleProspects() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' as const, supabase: null, rows: null }

  const { data, error } = await supabase
    .from('prospects')
    .select('id,nom_commerce,google_place_id')
    .not('google_place_id', 'is', null)
    .order('nom_commerce', { ascending: true })

  if (error) return { error: 'select' as const, supabase: null, rows: null }

  const rows = (data ?? []).filter(
    (r): r is ProspectRow => typeof r.google_place_id === 'string' && r.google_place_id.length > 0
  )
  return { error: null, supabase, rows }
}

export async function GET() {
  const { error, rows } = await selectEligibleProspects()
  if (error === 'Unauthorized') return new NextResponse('Unauthorized', { status: 401 })
  if (error) return NextResponse.json({ ok: false, error }, { status: 500 })
  return NextResponse.json({ ok: true, count: rows?.length ?? 0 })
}

export async function POST() {
  const { error, supabase, rows } = await selectEligibleProspects()
  if (error === 'Unauthorized') return new NextResponse('Unauthorized', { status: 401 })
  if (error || !supabase || !rows) {
    return NextResponse.json({ ok: false, error: 'select' }, { status: 500 })
  }

  const total = rows.length
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
      }

      send({ type: 'start', total })

      let processedWithMaquette = 0
      let processedWithoutMaquette = 0
      let totalAdded = 0
      let totalRemoved = 0
      const failures: { id: string; nom: string; error: string }[] = []

      for (let i = 0; i < rows.length; i++) {
        const p = rows[i]
        let phase: 'fetch' | 'prospect_update' | 'maquette_update' = 'fetch'

        try {
          // 1) Fetch Google Places — jusqu'à 10 photos via le nouveau max
          const fresh = await getPlaceDetails(p.google_place_id)
          const freshRefs = fresh.photoRefs

          // 2) UPDATE prospects.google_photo_refs (sans toucher aux autres
          //    champs Google — le backfill avis existe pour ça)
          phase = 'prospect_update'
          const { error: pUpdErr } = await supabase
            .from('prospects')
            .update({
              google_photo_refs: freshRefs.length > 0 ? freshRefs : null,
              last_enriched_at: new Date().toISOString(),
            })
            .eq('id', p.id)
          if (pUpdErr) throw new Error(`prospect: ${pUpdErr.message}`)

          // 3) Si une maquette existe, on fait le backfill intelligent
          phase = 'maquette_update'
          const { data: maquette } = await supabase
            .from('maquettes')
            .select('id, updated_at, available_photos, photo_assignments')
            .eq('prospect_id', p.id)
            .maybeSingle()

          if (!maquette) {
            processedWithoutMaquette += 1
            send({ type: 'progress', current: i + 1, total, name: p.nom_commerce, ok: true })
            continue
          }

          const currentPool = (maquette.available_photos ?? []) as MaquettePhotoEntry[]
          const currentAssignments = (maquette.photo_assignments ?? []) as MaquettePhotoAssignment[]

          const result = backfillGooglePhotos({
            currentPool,
            currentAssignments,
            freshGoogleRefs: freshRefs,
          })

          // Validation Zod runtime avant écriture (cohérent avec updateMaquettePhotos)
          availablePhotosSchema.parse(result.available_photos)
          photoAssignmentsSchema.parse(result.photo_assignments)
          assertAssignmentsPointToPool(result.available_photos, result.photo_assignments)

          // UPDATE avec lock optimiste sur updated_at — protège contre une
          // édition concurrente d'un admin sur l'éditeur pendant le backfill.
          const { data: updated, error: mUpdErr } = await supabase
            .from('maquettes')
            .update({
              available_photos: result.available_photos,
              photo_assignments: result.photo_assignments,
            })
            .eq('id', maquette.id)
            .eq('updated_at', maquette.updated_at)
            .select('id')
            .maybeSingle()

          if (mUpdErr) throw new Error(`maquette: ${mUpdErr.message}`)
          if (!updated) throw new Error(`maquette: modifiée pendant le backfill (réessayer plus tard)`)

          processedWithMaquette += 1
          totalAdded += result.stats.photos_added
          totalRemoved += result.stats.photos_removed

          send({
            type: 'progress',
            current: i + 1,
            total,
            name: p.nom_commerce,
            ok: true,
            stats: result.stats,
          })
        } catch (e) {
          const code = e instanceof GooglePlacesError ? e.code : 'unknown'
          const msg = e instanceof Error ? e.message : String(e)
          failures.push({ id: p.id, nom: p.nom_commerce, error: `[${phase}] ${code}: ${msg}` })
          console.error('[backfill-google-photos]', p.id, p.nom_commerce, phase, msg)
          send({
            type: 'progress',
            current: i + 1,
            total,
            name: p.nom_commerce,
            ok: false,
          })
        }
      }

      send({
        type: 'done',
        prospects_processed: total,
        prospects_with_maquette: processedWithMaquette,
        prospects_without_maquette: processedWithoutMaquette,
        total_photos_added: totalAdded,
        total_photos_removed: totalRemoved,
        failures,
      })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}
