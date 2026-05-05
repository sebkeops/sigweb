'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { buildScoreDbFields, toScoringInput } from '@/lib/scoring/apply'
import type { Prospect } from '@/types'

export type ScoreActionResult =
  | { success: true; score: number }
  | { success: false; error: string }

const PROSPECT_ID_REGEX = /^[0-9a-f-]{36}$/i

async function assertAuth(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return !!user
}

/**
 * Recalcule le score d'un prospect à partir de ses données actuelles.
 * Préserve un éventuel override manuel.
 */
export async function recomputeProspectScore(prospectId: string): Promise<ScoreActionResult> {
  if (!(await assertAuth())) return { success: false, error: 'Non autorisé.' }
  if (!PROSPECT_ID_REGEX.test(prospectId)) {
    return { success: false, error: 'Identifiant invalide.' }
  }

  const supabase = await createClient()
  const { data: row } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .maybeSingle()
  if (!row) return { success: false, error: 'Prospect introuvable.' }

  const p = row as Prospect
  const scoreFields = buildScoreDbFields(toScoringInput(p), p.score_override_manuel ?? null)

  const { error } = await supabase.from('prospects').update(scoreFields).eq('id', prospectId)
  if (error) {
    console.error('[recomputeProspectScore]', error)
    return { success: false, error: 'Erreur BDD.' }
  }

  revalidatePath('/admin/crm')
  revalidatePath(`/admin/crm/${prospectId}`)
  return { success: true, score: scoreFields.score }
}

/**
 * Définit un score manuel pour un prospect. La valeur est conservée et
 * surclasse le score automatique tant qu'elle n'est pas effacée par
 * `clearManualScoreOverride`.
 */
export async function setManualScoreOverride(
  prospectId: string,
  score: number
): Promise<ScoreActionResult> {
  if (!(await assertAuth())) return { success: false, error: 'Non autorisé.' }
  if (!PROSPECT_ID_REGEX.test(prospectId)) {
    return { success: false, error: 'Identifiant invalide.' }
  }
  if (!Number.isInteger(score) || score < 0 || score > 10) {
    return { success: false, error: 'Score doit être un entier entre 0 et 10.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('prospects')
    .update({
      score_override_manuel: score,
      score,
      score_override_at: new Date().toISOString(),
    })
    .eq('id', prospectId)

  if (error) {
    console.error('[setManualScoreOverride]', error)
    return { success: false, error: 'Erreur BDD.' }
  }

  revalidatePath('/admin/crm')
  revalidatePath(`/admin/crm/${prospectId}`)
  return { success: true, score }
}

/**
 * Efface l'override manuel et restaure le score automatique calculé.
 */
export async function clearManualScoreOverride(prospectId: string): Promise<ScoreActionResult> {
  if (!(await assertAuth())) return { success: false, error: 'Non autorisé.' }
  if (!PROSPECT_ID_REGEX.test(prospectId)) {
    return { success: false, error: 'Identifiant invalide.' }
  }

  const supabase = await createClient()
  const { data: row } = await supabase
    .from('prospects')
    .select('score_calcule')
    .eq('id', prospectId)
    .maybeSingle()
  if (!row) return { success: false, error: 'Prospect introuvable.' }

  const calcule = (row as { score_calcule: number | null }).score_calcule ?? 0

  const { error } = await supabase
    .from('prospects')
    .update({
      score_override_manuel: null,
      score: calcule,
      score_override_at: null,
    })
    .eq('id', prospectId)

  if (error) {
    console.error('[clearManualScoreOverride]', error)
    return { success: false, error: 'Erreur BDD.' }
  }

  revalidatePath('/admin/crm')
  revalidatePath(`/admin/crm/${prospectId}`)
  return { success: true, score: calcule }
}
