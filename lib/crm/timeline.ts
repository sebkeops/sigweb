import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ProspectStatut,
  ProspectTimelineEventSource,
  StatusChangedMetadata,
} from '@/types'
import type { ManualTimelineEventInput } from '@/lib/validations/timeline-event'

/**
 * Helpers d'insertion d'événements dans `prospect_timeline_events`.
 *
 * Une seule abstraction par type d'event, à appeler depuis les 3 chemins
 * de transition de statut :
 *   - `lib/actions/prospect.ts:updateProspectStatut` (source = manual)
 *   - `lib/actions/prospect.ts:updateProspect`       (source = manual)
 *   - `lib/email/sender.ts` après progression auto   (source = automatic)
 *
 * Best-effort : un échec d'insertion ne doit JAMAIS rollback la transition
 * principale. La timeline est un journal a posteriori, l'absence d'un
 * event n'altère pas la cohérence métier (le statut reste à jour, c'est
 * juste l'historique granulaire qui rate cet événement).
 */

interface InsertStatusChangedEventOptions {
  supabase: SupabaseClient
  prospectId: string
  /** Statut avant la transition. `null` si inconnu (cas pré-Phase 2). */
  from: ProspectStatut | null
  /** Nouveau statut. */
  to: ProspectStatut
  /** `'manual'` si déclenché par un admin, `'automatic'` par le système. */
  source: ProspectTimelineEventSource
  /** Hérité du prospect — un prospect de test ne pollue pas le funnel. */
  isTest: boolean
  /** Optionnel : id de l'admin connecté (Server Actions le récupèrent). */
  createdByUserId?: string | null
}

/**
 * Insère un événement `status_changed` dans la timeline du prospect.
 *
 * Ne throw pas en cas d'erreur Supabase : log et continue. Le caller
 * (Server Action ou sender.ts) doit avoir DÉJÀ effectué la transition
 * sur `prospects.statut` avant d'appeler ce helper — la timeline ne
 * pilote pas le statut, elle l'observe.
 */
export async function insertStatusChangedEvent(
  opts: InsertStatusChangedEventOptions
): Promise<void> {
  const metadata: StatusChangedMetadata = {
    from: opts.from,
    to: opts.to,
  }

  const { error } = await opts.supabase.from('prospect_timeline_events').insert({
    prospect_id: opts.prospectId,
    event_type: 'status_changed',
    source: opts.source,
    metadata,
    is_test: opts.isTest,
    created_by_user_id: opts.createdByUserId ?? null,
    // occurred_at = NOW() par DEFAULT côté BDD — on n'override pas
    // (l'event reflète "maintenant", c'est-à-dire le moment de la transition).
  })

  if (error) {
    console.error(
      '[insertStatusChangedEvent] échec best-effort (statut transitionné OK, timeline ratée) :',
      error.message
    )
  }
}

// ─── Phase 4 — événements manuels ────────────────────────────────────

interface InsertManualTimelineEventOptions {
  supabase: SupabaseClient
  prospectId: string
  input: ManualTimelineEventInput
  /** Hérité du prospect — un event sur un prospect test ne pollue pas le funnel. */
  isTest: boolean
  /** Id de l'admin connecté (toujours présent pour un event manuel). */
  createdByUserId: string
}

/**
 * Insère un événement manuel dans la timeline du prospect (CRM v3 Phase 4).
 *
 * Contrairement à `insertStatusChangedEvent`, **on remonte l'erreur Supabase**
 * au caller : un event manuel est l'action principale de l'utilisateur (clic
 * « Enregistrer » sur la modale), pas un effet de bord d'une autre transition.
 * Si l'insert foire, l'admin doit le savoir et pouvoir réessayer.
 *
 * Le mapping `input → row` :
 *   - `event_subtype` ne vient QUE du schéma `phone_call`
 *   - `metadata` n'est posé QUE pour `dm_sent` et `meeting_scheduled`
 *   - `notes` est toujours optionnel (sauf pour `note` où le schéma force la présence)
 */
export async function insertManualTimelineEvent(
  opts: InsertManualTimelineEventOptions
): Promise<{ success: true; eventId: string } | { success: false; error: string }> {
  const { input } = opts

  const row: Record<string, unknown> = {
    prospect_id: opts.prospectId,
    event_type: input.event_type,
    source: 'manual',
    occurred_at: input.occurred_at,
    notes: input.notes ?? null,
    is_test: opts.isTest,
    created_by_user_id: opts.createdByUserId,
  }

  if (input.event_type === 'phone_call') {
    row.event_subtype = input.event_subtype
  }

  if (input.event_type === 'dm_sent') {
    row.metadata = { plateforme: input.plateforme }
  }

  if (input.event_type === 'meeting_scheduled') {
    row.metadata = { date_rdv: input.date_rdv }
  }

  const { data, error } = await opts.supabase
    .from('prospect_timeline_events')
    .insert(row)
    .select('id')
    .single<{ id: string }>()

  if (error || !data) {
    console.error('[insertManualTimelineEvent]', error?.message)
    return {
      success: false,
      error: error?.message ?? 'Erreur inconnue lors de la création de l\'événement.',
    }
  }

  return { success: true, eventId: data.id }
}
