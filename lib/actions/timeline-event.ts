'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { insertManualTimelineEvent } from '@/lib/crm/timeline'
import {
  manualTimelineEventSchema,
  type ManualTimelineEventInput,
} from '@/lib/validations/timeline-event'

/**
 * Server Action — création d'un événement manuel timeline (CRM v3 Phase 4).
 *
 * Appelée depuis le bottom-sheet/modale « Ajouter un événement » sur la page
 * prospect. Valide l'input avec Zod, vérifie l'auth, lit `is_test` du
 * prospect pour propager le flag, puis délègue l'insert à `insertManualTimelineEvent`.
 *
 * Pas d'auto-progression de statut (décision Phase 4) : l'admin pilote le
 * statut manuellement via le dropdown StatusBadge. La timeline trace les
 * faits, le statut reste explicite.
 */

export type AddManualEventResult =
  | { success: true; eventId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function addManualTimelineEvent(
  prospectId: string,
  rawInput: unknown
): Promise<AddManualEventResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé.' }

  const parsed = manualTimelineEventSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Champs invalides.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }
  const input: ManualTimelineEventInput = parsed.data

  // Lit `is_test` du prospect pour propager le flag à l'event (un event
  // sur un prospect test ne doit pas polluer les KPIs Phase 6).
  const { data: prospectRow, error: prospectErr } = await supabase
    .from('prospects')
    .select('is_test')
    .eq('id', prospectId)
    .maybeSingle<{ is_test: boolean }>()

  if (prospectErr || !prospectRow) {
    return { success: false, error: 'Prospect introuvable.' }
  }

  const result = await insertManualTimelineEvent({
    supabase,
    prospectId,
    input,
    isTest: prospectRow.is_test,
    createdByUserId: user.id,
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  revalidatePath(`/admin/crm/${prospectId}`)
  return { success: true, eventId: result.eventId }
}
