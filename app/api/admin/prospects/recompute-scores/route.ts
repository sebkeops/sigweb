import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Prospect } from '@/types'
import { buildScoreDbFields, toScoringInput } from '@/lib/scoring/apply'

/**
 * Route one-shot pour recalculer le score de TOUS les prospects existants.
 * À déclencher une fois après application de la migration `add_score_fields.sql`.
 *
 * Idempotente : peut être ré-exécutée sans dommage.
 *
 * Méthode POST pour éviter qu'un préfetch GET ou un crawl ne lance le job
 * involontairement (consomme du temps + des écritures BDD).
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: rows, error: selErr } = await supabase
    .from('prospects')
    .select('*')

  if (selErr) {
    console.error('[recompute-scores] select', selErr)
    return NextResponse.json({ ok: false, error: 'select' }, { status: 500 })
  }

  const prospects = (rows ?? []) as Prospect[]
  let updated = 0
  const failures: { id: string; error: string }[] = []

  for (const p of prospects) {
    const input = toScoringInput(p)
    const fields = buildScoreDbFields(input, p.score_override_manuel ?? null)

    const { error: updErr } = await supabase
      .from('prospects')
      .update(fields)
      .eq('id', p.id)

    if (updErr) {
      console.error('[recompute-scores] update', p.id, updErr)
      failures.push({ id: p.id, error: updErr.message })
    } else {
      updated += 1
    }
  }

  return NextResponse.json({
    ok: true,
    total: prospects.length,
    updated,
    failures,
  })
}
