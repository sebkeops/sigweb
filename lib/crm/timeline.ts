import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ProspectStatut,
  ProspectTimelineEventSource,
  StatusChangedMetadata,
} from '@/types'

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
