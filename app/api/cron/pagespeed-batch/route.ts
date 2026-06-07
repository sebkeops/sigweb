import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeUrl, PAGESPEED_CACHE_DAYS } from '@/lib/enrichment/pagespeed'

/**
 * Cron Vercel — traite par lot les prospects avec `pagespeed_status='pending'`.
 *
 * Planifié quotidiennement (cf. vercel.json). Pourquoi un cron plutôt
 * qu'un appel sync depuis l'import :
 *   - 1 analyse PageSpeed = 10-30 s, on bloquerait l'UI
 *   - Quota Google PageSpeed limité quotidiennement
 *   - Si plusieurs imports le même jour, on regroupe naturellement
 *
 * Limites par exécution :
 *   - MAX_BATCH_PER_RUN prospects (économie quota)
 *   - DELAY_BETWEEN_CALLS_MS entre 2 appels (respect rate limit)
 *
 * Sécurité : `Authorization: Bearer ${CRON_SECRET}` obligatoire (Vercel
 * pose ce header pour les crons définis dans vercel.json). Sans secret
 * défini, 503 (pas de fallback laxiste).
 *
 * Cache : `pagespeed_status='pending'` n'est mis que si la dernière
 * analyse a > PAGESPEED_CACHE_DAYS jours OU jamais. Le cron tape donc
 * automatiquement les vrais besoins.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Nombre max de prospects traités par exécution (économie quota). */
const MAX_BATCH_PER_RUN = 20

/** Délai entre 2 appels PageSpeed pour ne pas saturer l'API Google. */
const DELAY_BETWEEN_CALLS_MS = 1_000

interface PendingRow {
  id: string
  site_existant_url: string | null
  pagespeed_analyzed_at: string | null
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron pagespeed-batch] CRON_SECRET manquant')
    return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 })
  }

  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    console.warn('[cron pagespeed-batch] auth invalide')
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: pendings, error: queryErr } = await supabase
    .from('prospects')
    .select('id, site_existant_url, pagespeed_analyzed_at')
    .eq('pagespeed_status', 'pending')
    .not('site_existant_url', 'is', null)
    .order('pagespeed_analyzed_at', { ascending: true, nullsFirst: true })
    .limit(MAX_BATCH_PER_RUN)

  if (queryErr) {
    console.error('[cron pagespeed-batch] query error', queryErr.message)
    return NextResponse.json({ status: 'error', reason: 'query_failed' })
  }

  const rows = (pendings ?? []) as PendingRow[]
  if (rows.length === 0) {
    return NextResponse.json({ status: 'idle', processed: 0 })
  }

  const stats = { processed: 0, success: 0, failed: 0 }
  const errors: { id: string; reason: string }[] = []

  for (const row of rows) {
    if (!row.site_existant_url) {
      // Cohérence : pas d'URL → on retire le pending (l'import a peut-être
      // posé pending par erreur). On ne facture pas un slot pour rien.
      await supabase
        .from('prospects')
        .update({ pagespeed_status: null })
        .eq('id', row.id)
      continue
    }

    stats.processed += 1
    const result = await analyzeUrl(row.site_existant_url)

    if (!result.ok) {
      stats.failed += 1
      errors.push({ id: row.id, reason: result.reason })
      await supabase
        .from('prospects')
        .update({
          pagespeed_status: result.reason === 'not_configured' ? null : 'error',
          pagespeed_analyzed_at: new Date().toISOString(),
        })
        .eq('id', row.id)
    } else {
      stats.success += 1
      await supabase
        .from('prospects')
        .update({
          pagespeed_status: 'done',
          pagespeed_score_perf: result.data.perf,
          pagespeed_score_mobile: result.data.mobile,
          pagespeed_analyzed_at: new Date().toISOString(),
          pagespeed_raw: result.data.raw,
        })
        .eq('id', row.id)
    }

    if (stats.processed < rows.length) {
      await sleep(DELAY_BETWEEN_CALLS_MS)
    }
  }

  console.log(
    `[cron pagespeed-batch] traité ${stats.processed} (${stats.success} ok / ${stats.failed} ko)`
  )

  return NextResponse.json({
    status: 'processed',
    cacheDays: PAGESPEED_CACHE_DAYS,
    ...stats,
    errors: errors.length > 0 ? errors : undefined,
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
