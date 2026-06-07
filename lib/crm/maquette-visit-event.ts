import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  MaquetteVisitSource,
  MaquetteVisitedMetadata,
  ProspectTimelineEvent,
} from '@/types'
import { VISIT_UPSERT_WINDOW_MS } from './maquette-tracking'

/**
 * Cree ou met a jour l'event timeline `maquette_visited` correspondant
 * a une nouvelle visite, avec une fenetre d'aggregation de 30 min.
 *
 * Logique :
 *   - Si un event `maquette_visited` existe pour ce prospect avec
 *     `occurred_at >= now() - 30 min` → on UPDATE son metadata
 *     (visit_count++, last_visit_at = now, sources[src]++) et son
 *     `occurred_at = now` pour le faire remonter dans la timeline
 *   - Sinon → on INSERT un nouvel event avec visit_count=1
 *
 * `server-only` car ce module manipule un client Supabase admin.
 *
 * Best-effort : on logue les erreurs mais on ne throw pas — la route
 * handler appelante doit pouvoir continuer si le UPSERT echoue.
 */

interface UpsertOpts {
  prospectId: string
  slug: string
  source: MaquetteVisitSource
  visitAt: Date
  isTest: boolean
}

export async function insertOrUpsertMaquetteVisitEvent(
  supabase: SupabaseClient,
  opts: UpsertOpts
): Promise<void> {
  const { prospectId, slug, source, visitAt, isTest } = opts

  // Borne basse de la fenetre 30 min
  const windowStart = new Date(visitAt.getTime() - VISIT_UPSERT_WINDOW_MS).toISOString()

  // 1. Cherche un event recent (< 30 min) pour ce prospect ET cette
  //    maquette (slug). On veut UN event par couple (prospect, slug)
  //    sur la fenetre — pas un event qui agrege plusieurs maquettes
  //    differentes consultees simultanement.
  const { data: existing, error: selectErr } = await supabase
    .from('prospect_timeline_events')
    .select('id, metadata, occurred_at')
    .eq('prospect_id', prospectId)
    .eq('event_type', 'maquette_visited')
    .gte('occurred_at', windowStart)
    .order('occurred_at', { ascending: false })
    .limit(10)
    .returns<{ id: string; metadata: unknown; occurred_at: string }[]>()

  if (selectErr) {
    console.error('[maquette-visit-event] select recent', selectErr)
    return
  }

  // Filtre cote code pour ne retenir que l'event qui concerne le MEME slug.
  // (Plus simple que d'ecrire une requete JSONB dans la 1ere selection.)
  const sameSlugEvent = existing?.find((row) => {
    const meta = row.metadata as MaquetteVisitedMetadata | null
    return meta?.slug === slug
  })

  if (sameSlugEvent) {
    // 2a. UPDATE : incremente le compteur et bump occurred_at
    const oldMeta = sameSlugEvent.metadata as MaquetteVisitedMetadata
    const newMeta: MaquetteVisitedMetadata = {
      visit_count: oldMeta.visit_count + 1,
      first_visit_at: oldMeta.first_visit_at,
      last_visit_at: visitAt.toISOString(),
      sources: {
        ...oldMeta.sources,
        [source]: (oldMeta.sources[source] ?? 0) + 1,
      },
      slug,
    }

    const { error: updateErr } = await supabase
      .from('prospect_timeline_events')
      .update({
        metadata: newMeta,
        occurred_at: visitAt.toISOString(),
      })
      .eq('id', sameSlugEvent.id)

    if (updateErr) {
      console.error('[maquette-visit-event] update recent', updateErr)
    }
    return
  }

  // 2b. INSERT : nouvel event avec visit_count = 1
  const metadata: MaquetteVisitedMetadata = {
    visit_count: 1,
    first_visit_at: visitAt.toISOString(),
    last_visit_at: visitAt.toISOString(),
    sources: { [source]: 1 },
    slug,
  }

  const { error: insertErr } = await supabase
    .from('prospect_timeline_events')
    .insert({
      prospect_id: prospectId,
      event_type: 'maquette_visited',
      event_subtype: null,
      source: 'automatic',
      occurred_at: visitAt.toISOString(),
      metadata,
      is_test: isTest,
    })

  if (insertErr) {
    console.error('[maquette-visit-event] insert new', insertErr)
  }
}
