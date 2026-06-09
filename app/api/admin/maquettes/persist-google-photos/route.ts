import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getPlaceDetails } from '@/lib/google-places'
import {
  applyPersistedPhotos,
  persistGooglePhotoRefs,
} from '@/lib/maquette/photos/persist-google-refs'
import { availablePhotosSchema } from '@/lib/maquette/photos'
import type { MaquettePhotoEntry } from '@/types'

/**
 * Reprise des maquettes existantes : persiste sur Supabase Storage toutes
 * les photos encore `source: 'google'` dans les pools `available_photos`.
 *
 * Pourquoi : avant PR fix(maquette) #43, les photos Google n'étaient pas
 * persistées à la création — les refs Places API expirent → maquettes
 * cassées en prod (ex. /demos/le-joug). Cette route répare le passif.
 *
 * Stratégie par maquette :
 *   1. Tentative directe sur les refs Google présentes dans le pool.
 *   2. Pour les refs qui échouent (probablement expirées) ET si le prospect
 *      a un `google_place_id` : on appelle getPlaceDetails UNE FOIS pour
 *      récupérer des refs fraîches, puis on essaie ces refs sur les
 *      entrées qui ont échoué (en tournant sur la liste). C'est plus
 *      coûteux mais évite de devoir lancer backfill-google-photos d'abord.
 *   3. Les entrées qui échouent quand même restent en `source: 'google'`
 *      dans le pool (best-effort, on ne casse rien).
 *
 * Garanties :
 *   - Idempotent : les entrées `source: 'upload'` sont ignorées.
 *   - Dry-run via `?dryRun=1` : aucune écriture (ni Storage, ni BDD),
 *     mais on tente quand même les fetch Google pour donner un aperçu
 *     fiable de ce qui passera. ⚠️ Coût Google identique au mode réel.
 *   - Throttling : 250ms entre maquettes (politesse Google).
 *   - Streaming NDJSON pour suivi temps réel.
 *
 * Sécurité : admin only.
 */

// Vercel function settings (cf. https://vercel.com/docs/functions/configuring-functions/duration)
//
// Cette route est lourde (fetch Google + sharp + upload Storage par photo,
// pour N maquettes). Sans déclaration explicite, Vercel coupe la fonction
// au bout du timeout par défaut (10s Hobby / 60s Pro) → côté client, fetch
// rejette avec "network error". On déclare 300s : Vercel clamp au max
// autorisé par le plan, c'est sans risque.
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const THROTTLE_MS = 250

interface MaquetteRow {
  id: string
  slug: string | null
  prospect_id: string
  updated_at: string
  available_photos: MaquettePhotoEntry[] | null
}

interface ProspectRow {
  google_place_id: string | null
  nom_commerce: string
}

async function selectEligibleMaquettes(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('maquettes')
    .select('id, slug, prospect_id, updated_at, available_photos')
    .order('updated_at', { ascending: true })

  if (error) return { error: 'select' as const, rows: null }

  const rows = (data ?? []).filter((m): m is MaquetteRow => {
    const pool = (m.available_photos ?? []) as MaquettePhotoEntry[]
    return pool.some((p) => p.source === 'google')
  })
  return { error: null, rows }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { error, rows } = await selectEligibleMaquettes(supabase)
  if (error) return NextResponse.json({ ok: false, error }, { status: 500 })
  return NextResponse.json({ ok: true, count: rows?.length ?? 0 })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dryRun') === '1'

  // Plafond par lot pour rester sous la maxDuration Vercel (60s en Hobby).
  // ~5 s par maquette (fetch Google + sharp + upload), donc 8 = ~40 s + marge.
  // L'UI boucle automatiquement jusqu'à épuiser la file.
  const limitRaw = url.searchParams.get('limit')
  const limit = limitRaw ? Math.max(1, Math.min(100, parseInt(limitRaw, 10) || 0)) : null

  const { error, rows: allRows } = await selectEligibleMaquettes(supabase)
  if (error || !allRows) {
    return NextResponse.json({ ok: false, error: error ?? 'select' }, { status: 500 })
  }

  const eligibleTotal = allRows.length
  const rows = limit ? allRows.slice(0, limit) : allRows
  const total = rows.length
  const remainingAfter = eligibleTotal - total
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
      }

      send({ type: 'start', total, eligibleTotal, remainingAfter, dryRun })

      let maquettesUpdated = 0
      let maquettesUnchanged = 0
      let maquettesStale = 0
      let totalPersisted = 0
      let totalFailed = 0
      const failures: {
        maquette_id: string
        prospect_id: string
        slug: string | null
        reason: string
        failed_entries: number
      }[] = []

      for (let i = 0; i < rows.length; i++) {
        const m = rows[i]
        const pool = (m.available_photos ?? []) as MaquettePhotoEntry[]
        const googleCount = pool.filter((p) => p.source === 'google').length

        try {
          // 1) Tentative directe sur les refs en pool
          const first = await persistGooglePhotoRefs(supabase, m.id, pool)

          // 2) Re-fetch fresh refs si des entrées ont échoué ET prospect lié
          const stillFailedIds = new Set(first.failures.map((f) => f.id))
          let secondPersistedCount = 0

          if (stillFailedIds.size > 0) {
            const { data: prospect } = await supabase
              .from('prospects')
              .select('google_place_id, nom_commerce')
              .eq('id', m.prospect_id)
              .maybeSingle<ProspectRow>()

            if (prospect?.google_place_id) {
              try {
                const fresh = await getPlaceDetails(prospect.google_place_id)
                const knownRefs = new Set(
                  pool.filter((p) => p.source === 'google').map((p) => p.reference)
                )
                const candidateRefs = fresh.photoRefs.filter((r) => !knownRefs.has(r))

                // Pour chaque entrée échouée, essayer les refs fraîches dans l'ordre
                let candidateIdx = 0
                for (const failed of first.failures) {
                  if (candidateIdx >= candidateRefs.length) break
                  // Construire une entrée temporaire avec la nouvelle ref
                  const origEntry = pool.find((p) => p.id === failed.id)
                  if (!origEntry) continue
                  const tryEntry: MaquettePhotoEntry = {
                    ...origEntry,
                    reference: candidateRefs[candidateIdx++],
                  }
                  const retry = await persistGooglePhotoRefs(supabase, m.id, [tryEntry])
                  if (retry.persisted.size > 0) {
                    const newEntry = retry.persisted.get(failed.id)
                    if (newEntry) {
                      first.persisted.set(failed.id, newEntry)
                      stillFailedIds.delete(failed.id)
                      secondPersistedCount += 1
                    }
                  }
                }
              } catch (e) {
                // getPlaceDetails peut throw GooglePlacesError — on note mais
                // on ne fait pas échouer toute la maquette pour autant.
                console.warn(
                  `[persist-google-photos] getPlaceDetails ${m.id}`,
                  (e as Error).message
                )
              }
            }
          }

          const totalPersistedForMaquette = first.persisted.size
          const finalFailures = first.failures.length - secondPersistedCount

          totalPersisted += totalPersistedForMaquette
          totalFailed += finalFailures

          if (totalPersistedForMaquette === 0) {
            maquettesUnchanged += 1
            send({
              type: 'progress',
              current: i + 1,
              total,
              slug: m.slug,
              ok: true,
              persisted: 0,
              failed: finalFailures,
              google_count: googleCount,
              changed: false,
            })
            if (i < rows.length - 1) await sleep(THROTTLE_MS)
            continue
          }

          // 3) Reconstruction du pool + écriture (sauf dry-run)
          const newPool = applyPersistedPhotos(pool, first.persisted)

          if (!dryRun) {
            availablePhotosSchema.parse(newPool)

            // Alignement des champs legacy (cf. createMaquetteFromProspect)
            const newHero = newPool[0]?.reference ?? null
            const newHistoire = newPool[1]?.reference ?? null
            const newUnivers = newPool.slice(2, 7).map((p) => p.reference)

            // Lock optimiste sur updated_at
            const { data: updated, error: updErr } = await supabase
              .from('maquettes')
              .update({
                available_photos: newPool,
                hero_photo_url: newHero,
                histoire_photo_url: newHistoire,
                univers_photos_urls: newUnivers,
              })
              .eq('id', m.id)
              .eq('updated_at', m.updated_at)
              .select('id')
              .maybeSingle()

            if (updErr) throw new Error(`update: ${updErr.message}`)
            if (!updated) {
              maquettesStale += 1
              send({
                type: 'progress',
                current: i + 1,
                total,
                slug: m.slug,
                ok: false,
                error: 'stale (maquette modifiée pendant la reprise)',
              })
              if (i < rows.length - 1) await sleep(THROTTLE_MS)
              continue
            }
          }

          maquettesUpdated += 1
          send({
            type: 'progress',
            current: i + 1,
            total,
            slug: m.slug,
            ok: true,
            persisted: totalPersistedForMaquette,
            failed: finalFailures,
            google_count: googleCount,
            changed: true,
            dryRun,
          })

          if (finalFailures > 0) {
            failures.push({
              maquette_id: m.id,
              prospect_id: m.prospect_id,
              slug: m.slug,
              reason: 'entries_unrecoverable',
              failed_entries: finalFailures,
            })
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          console.error('[persist-google-photos]', m.id, m.slug, msg)
          failures.push({
            maquette_id: m.id,
            prospect_id: m.prospect_id,
            slug: m.slug,
            reason: msg,
            failed_entries: googleCount,
          })
          send({
            type: 'progress',
            current: i + 1,
            total,
            slug: m.slug,
            ok: false,
            error: msg,
          })
        }

        if (i < rows.length - 1) await sleep(THROTTLE_MS)
      }

      send({
        type: 'done',
        dryRun,
        maquettes_total: total,
        maquettes_updated: maquettesUpdated,
        maquettes_unchanged: maquettesUnchanged,
        maquettes_stale: maquettesStale,
        photos_persisted: totalPersisted,
        photos_failed: totalFailed,
        eligibleTotal,
        remainingAfter,
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
