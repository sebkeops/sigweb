import { createClient } from '@/lib/supabase/server'
import type { EmailSend, Prospect, ProspectTimelineEvent } from '@/types'
import {
  computeActivity7d,
  computeRelancesPending,
  computeStatusFunnel,
  computeUpcomingMeetings,
  type Activity7dResult,
  type RelancePendingRow,
  type StatusFunnelRow,
  type UpcomingMeetingRow,
} from './dashboard-stats'

/**
 * Fetch + assemble les 4 KPIs du dashboard admin (CRM v3 Phase 6).
 *
 * 1 seule fonction appelée par le Server Component `/admin/dashboard` —
 * fait 4 fetchs Supabase en parallèle, applique les fonctions pures de
 * `dashboard-stats.ts`, retourne un objet prêt à rendre.
 *
 * Filtrage `is_test=false` posé dans les queries Supabase (cf. plan
 * Phase 5 sauté : on filtre uniquement au niveau email_sends et
 * prospect_timeline_events, pas au niveau prospect).
 */

export interface DashboardData {
  statusFunnel: StatusFunnelRow[]
  activity7d: Activity7dResult
  upcomingMeetings: UpcomingMeetingRow[]
  relancesPending: RelancePendingRow[]
  generatedAt: string  // ISO
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()
  const now = new Date()

  // Borne basse pour la query activity 7j — début de J-6 local.
  const lowerBound = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 6,
    0, 0, 0, 0
  )

  const [prospectsRes, eventsRes, emailsRes, meetingsRes] = await Promise.all([
    // Pour funnel + relances pending — tous les prospects (pas de filtre is_test
    // au niveau prospect, on a sauté la Phase 5).
    supabase
      .from('prospects')
      .select('id, nom_commerce, statut, date_relance_prevue'),

    // Pour activity 7j — events de la fenêtre (filtre is_test côté event).
    supabase
      .from('prospect_timeline_events')
      .select('event_type, occurred_at')
      .gte('occurred_at', lowerBound.toISOString())
      .eq('is_test', false),

    // Pour activity 7j — emails de la fenêtre (filtre is_test côté email).
    supabase
      .from('email_sends')
      .select('created_at')
      .gte('created_at', lowerBound.toISOString())
      .eq('is_test', false),

    // Pour upcoming meetings — TOUS les meeting_scheduled (filtrage par
    // metadata.date_rdv se fait dans la fonction pure). On garde une borne
    // basse pour ne pas tirer l'historique complet.
    supabase
      .from('prospect_timeline_events')
      .select('id, event_type, metadata, notes, prospect_id')
      .eq('event_type', 'meeting_scheduled')
      .eq('is_test', false)
      .gte('occurred_at', lowerBound.toISOString()),
  ])

  const prospects = (prospectsRes.data ?? []) as Pick<
    Prospect,
    'id' | 'nom_commerce' | 'statut' | 'date_relance_prevue'
  >[]
  const events = (eventsRes.data ?? []) as Pick<
    ProspectTimelineEvent,
    'event_type' | 'occurred_at'
  >[]
  const emails = (emailsRes.data ?? []) as Pick<EmailSend, 'created_at'>[]
  const meetingEvents = (meetingsRes.data ?? []) as Pick<
    ProspectTimelineEvent,
    'id' | 'event_type' | 'metadata' | 'notes' | 'prospect_id'
  >[]

  const prospectsById = new Map(
    prospects.map((p) => [p.id, { id: p.id, nom_commerce: p.nom_commerce }])
  )

  const statusFunnel = computeStatusFunnel(prospects)
  const activity7d = computeActivity7d({ events, emails, now })
  const upcomingMeetings = computeUpcomingMeetings({
    events: meetingEvents,
    prospectsById,
    now,
  })
  const relancesPending = computeRelancesPending({ prospects, now })

  return {
    statusFunnel,
    activity7d,
    upcomingMeetings,
    relancesPending,
    generatedAt: now.toISOString(),
  }
}
