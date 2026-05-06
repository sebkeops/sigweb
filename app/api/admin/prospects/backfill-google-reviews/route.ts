import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlaceDetails, GooglePlacesError } from '@/lib/google-places'
import { enrichedToGoogleDbFields } from '@/lib/crm/google-mapping'

/**
 * Backfill `prospects.google_reviews` (et autres champs google_*) pour tous
 * les prospects ayant un `google_place_id`. Sert à amorcer l'extension
 * "avis détaillés" sur les prospects existants après la migration BDD.
 *
 * - GET  : renvoie le nombre de prospects éligibles (pour l'affichage modale)
 * - POST : exécute le batch en streaming NDJSON
 *
 * Sécurité : admin only (auth.getUser).
 *
 * Format du flux POST (newline-delimited JSON) :
 *   {"type":"start","total":N}
 *   {"type":"progress","current":1,"total":N,"name":"...","ok":true}
 *   ...
 *   {"type":"done","updated":X,"failures":[{id,nom,error}]}
 *
 * Idempotent : on peut le ré-exécuter sans dommage. Un échec sur un
 * prospect ne stoppe pas le batch (failures listées en fin de flux).
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

      let updated = 0
      const failures: { id: string; nom: string; error: string }[] = []

      for (let i = 0; i < rows.length; i++) {
        const p = rows[i]
        let ok = false
        let errMsg: string | null = null

        try {
          const fresh = await getPlaceDetails(p.google_place_id)
          // On ne touche QUE les champs google_* + lat/lon + last_enriched_at,
          // pas les champs vitrine (adresse/téléphone/site) que l'admin a pu
          // éditer manuellement entre-temps. Cohérent avec le périmètre d'un
          // backfill : pas de surprise sur ses retouches manuelles.
          const fields = enrichedToGoogleDbFields(fresh)
          const { error: updErr } = await supabase
            .from('prospects')
            .update(fields)
            .eq('id', p.id)

          if (updErr) {
            errMsg = updErr.message
          } else {
            ok = true
          }
        } catch (e) {
          if (e instanceof GooglePlacesError) {
            errMsg = `${e.code}: ${e.message}`
          } else {
            errMsg = (e as Error).message
          }
        }

        if (ok) {
          updated += 1
        } else if (errMsg) {
          failures.push({ id: p.id, nom: p.nom_commerce, error: errMsg })
          console.error('[backfill-google-reviews]', p.id, p.nom_commerce, errMsg)
        }

        send({
          type: 'progress',
          current: i + 1,
          total,
          name: p.nom_commerce,
          ok,
        })
      }

      send({ type: 'done', updated, failures })
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
