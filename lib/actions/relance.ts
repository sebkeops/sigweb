'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Action — ignore une relance en cours (CRM v3 Phase 7 fix).
 *
 * Nullifie `date_relance_prevue` sur le prospect, ce qui le retire
 * immédiatement du bloc « Relances à faire » du dashboard.
 *
 * Le statut du prospect n'est PAS touché — l'admin peut toujours le
 * voir en `relance_X` dans la liste CRM et reprogrammer une nouvelle
 * date via l'édition de la fiche s'il change d'avis.
 *
 * Cas d'usage : prospect qui ne répond plus, relance manuelle inutile,
 * ou simplement « j'ai déjà rappelé hors mail, plus à traquer ici ».
 */

export type IgnoreRelanceResult =
  | { success: true }
  | { success: false; error: string }

export async function ignoreRelance(prospectId: string): Promise<IgnoreRelanceResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé.' }

  const { error } = await supabase
    .from('prospects')
    .update({ date_relance_prevue: null })
    .eq('id', prospectId)

  if (error) {
    console.error('[ignoreRelance]', error)
    return { success: false, error: 'Erreur lors de la mise à jour.' }
  }

  revalidatePath('/admin/dashboard')
  revalidatePath(`/admin/crm/${prospectId}`)
  return { success: true }
}
