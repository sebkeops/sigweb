import 'server-only'
import { fetchDashboardData } from './dashboard-data'
import { STATUT_LABELS } from '@/lib/crm/constants'

/**
 * Génère le récap quotidien des actions à faire (CRM v3 Phase 7).
 *
 * Réutilise `fetchDashboardData` pour ne pas dupliquer les requêtes
 * Supabase ni la logique de calcul — la source de vérité reste les
 * fonctions pures du dashboard.
 *
 * Filtres « actions du jour » :
 *   - Relances : tout ce que retourne `computeRelancesPending` (today + overdue)
 *   - RDV : les `upcomingMeetings` dont `dateRdv` est entre 00:00 et 23:59 LOCAL
 *     (un RDV demain n'est PAS dans le récap d'aujourd'hui)
 *
 * Skip si zéro action : le caller (route cron) vérifie `result.actionCount`.
 */

export interface DailyRecapData {
  actionCount: number
  relances: Awaited<ReturnType<typeof fetchDashboardData>>['relancesPending']
  meetingsToday: Awaited<ReturnType<typeof fetchDashboardData>>['upcomingMeetings']
  dateLabel: string  // "lundi 7 juin 2026"
}

export async function buildDailyRecap(): Promise<DailyRecapData> {
  const data = await fetchDashboardData()
  const now = new Date()

  // Filtre les RDV du jour LOCAL (00:00 → 23:59).
  const startOfDay = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0
  )
  const endOfDay = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999
  )

  const meetingsToday = data.upcomingMeetings.filter((m) => {
    const d = new Date(m.dateRdv)
    return d >= startOfDay && d <= endOfDay
  })

  const actionCount = data.relancesPending.length + meetingsToday.length

  return {
    actionCount,
    relances: data.relancesPending,
    meetingsToday,
    dateLabel: now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  }
}

// ─── Rendu HTML / texte ──────────────────────────────────────────────

/**
 * Construit le HTML de l'email récap. Volontairement sobre — pas de CSS
 * fancy, on optimise pour la lisibilité sur Gmail mobile.
 */
export function renderRecapHtml(recap: DailyRecapData, dashboardUrl: string): string {
  const relancesBlock =
    recap.relances.length > 0
      ? `
        <h2 style="font-size:16px;margin:24px 0 8px;color:#1e1e1e;">
          Relances à faire (${recap.relances.length})
        </h2>
        <ul style="padding-left:20px;margin:0;color:#1e1e1e;font-size:14px;line-height:1.6;">
          ${recap.relances
            .map((r) => {
              const urgencyLabel = r.urgency === 'overdue'
                ? `<span style="color:#b91c1c;font-weight:600;">En retard de ${r.daysOverdue}j</span>`
                : `<span style="color:#c2410c;font-weight:600;">Aujourd'hui</span>`
              return `<li><strong>${escapeHtml(r.prospectName)}</strong> — ${escapeHtml(STATUT_LABELS[r.statut])} · ${urgencyLabel}</li>`
            })
            .join('')}
        </ul>
      `
      : ''

  const meetingsBlock =
    recap.meetingsToday.length > 0
      ? `
        <h2 style="font-size:16px;margin:24px 0 8px;color:#1e1e1e;">
          RDV aujourd'hui (${recap.meetingsToday.length})
        </h2>
        <ul style="padding-left:20px;margin:0;color:#1e1e1e;font-size:14px;line-height:1.6;">
          ${recap.meetingsToday
            .map(
              (m) => `<li><strong>${escapeHtml(m.prospectName)}</strong> — ${formatTime(m.dateRdv)}${m.notes ? ` · <em>${escapeHtml(m.notes)}</em>` : ''}</li>`
            )
            .join('')}
        </ul>
      `
      : ''

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Récap CRM Sigweb</title></head>
<body style="margin:0;padding:0;background:#f6f3eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <p style="margin:0 0 4px;color:#666;font-size:13px;">Sigweb · CRM</p>
    <h1 style="font-size:20px;margin:0 0 4px;color:#2f6f4f;">Ta journée commerciale</h1>
    <p style="margin:0 0 16px;color:#1e1e1e;font-size:14px;">${escapeHtml(recap.dateLabel)}</p>

    <p style="margin:16px 0;color:#1e1e1e;font-size:14px;">
      <strong>${recap.actionCount}</strong> action${recap.actionCount > 1 ? 's' : ''} à mener aujourd'hui.
    </p>

    ${relancesBlock}
    ${meetingsBlock}

    <p style="margin:32px 0 0;">
      <a href="${dashboardUrl}" style="display:inline-block;background:#2f6f4f;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
        Ouvrir le dashboard
      </a>
    </p>

    <p style="margin:32px 0 0;color:#999;font-size:12px;">
      Récap envoyé automatiquement tous les matins. Tu peux désactiver le cron sur Vercel si besoin.
    </p>
  </div>
</body>
</html>
`
}

/** Version texte brut — fallback obligatoire pour les MUA non-HTML. */
export function renderRecapText(recap: DailyRecapData, dashboardUrl: string): string {
  const lines: string[] = []
  lines.push(`SIGWEB · Récap CRM — ${recap.dateLabel}`)
  lines.push('')
  lines.push(`${recap.actionCount} action${recap.actionCount > 1 ? 's' : ''} à mener aujourd'hui.`)
  lines.push('')

  if (recap.relances.length > 0) {
    lines.push(`RELANCES À FAIRE (${recap.relances.length})`)
    for (const r of recap.relances) {
      const urgency = r.urgency === 'overdue'
        ? `En retard de ${r.daysOverdue}j`
        : `Aujourd'hui`
      lines.push(`- ${r.prospectName} — ${STATUT_LABELS[r.statut]} · ${urgency}`)
    }
    lines.push('')
  }

  if (recap.meetingsToday.length > 0) {
    lines.push(`RDV AUJOURD'HUI (${recap.meetingsToday.length})`)
    for (const m of recap.meetingsToday) {
      const notes = m.notes ? ` · ${m.notes}` : ''
      lines.push(`- ${m.prospectName} — ${formatTime(m.dateRdv)}${notes}`)
    }
    lines.push('')
  }

  lines.push(`Dashboard : ${dashboardUrl}`)
  return lines.join('\n')
}

// ─── Helpers ─────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
