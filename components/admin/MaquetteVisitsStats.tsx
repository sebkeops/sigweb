import { createClient } from '@/lib/supabase/server'
import type { MaquetteVisit, MaquetteVisitSource } from '@/types'

interface Props {
  prospectId: string
}

/**
 * Encadre "Maquette consultee" affiche sur la fiche prospect (CRM v3 Phase 3).
 *
 * Server Component : fetch toutes les visites du prospect, calcule des
 * stats agregees (compteur, premiere/derniere visite, sources, duree
 * moyenne) et les affiche dans une carte compacte.
 *
 * Mobile-first : grille 2 cols sur mobile, 4 cols >= sm. Pas de scroll
 * horizontal, pas de hover-only.
 *
 * Pas affiche si zero visite (= prospect sans maquette ou maquette
 * jamais visitee).
 */
export default async function MaquetteVisitsStats({ prospectId }: Props) {
  const supabase = await createClient()

  // On exclut les visites is_test = true (visites d'admin connecte)
  // pour ne pas polluer les stats reelles.
  const { data: visits } = await supabase
    .from('maquette_visits')
    .select('source, created_at, duration_seconds')
    .eq('prospect_id', prospectId)
    .eq('is_test', false)
    .order('created_at', { ascending: true })
    .returns<Pick<MaquetteVisit, 'source' | 'created_at' | 'duration_seconds'>[]>()

  if (!visits || visits.length === 0) return null

  const stats = computeStats(visits)

  return (
    <section
      aria-label="Statistiques de consultation de la maquette"
      className="rounded-md border border-purple-200 bg-purple-50/40 p-4 sm:p-5"
    >
      <header className="mb-3 flex items-center gap-2">
        <div
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-100 text-purple-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="font-body text-sm font-semibold text-ink">
          Maquette consultée
        </h3>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <div>
          <dt className="font-body text-[11px] uppercase tracking-wide text-muted">
            Visites
          </dt>
          <dd className="mt-0.5 font-body text-lg font-bold text-ink tabular-nums">
            {stats.totalVisits}
          </dd>
        </div>

        <div>
          <dt className="font-body text-[11px] uppercase tracking-wide text-muted">
            Première
          </dt>
          <dd className="mt-0.5 font-body text-sm font-medium text-ink">
            {formatDateFr(stats.firstVisit)}
          </dd>
        </div>

        <div>
          <dt className="font-body text-[11px] uppercase tracking-wide text-muted">
            Dernière
          </dt>
          <dd className="mt-0.5 font-body text-sm font-medium text-ink">
            {formatDateFr(stats.lastVisit)}
          </dd>
        </div>

        <div>
          <dt className="font-body text-[11px] uppercase tracking-wide text-muted">
            Durée moy.
          </dt>
          <dd className="mt-0.5 font-body text-sm font-medium text-ink tabular-nums">
            {stats.avgDuration !== null ? formatDuration(stats.avgDuration) : '—'}
          </dd>
        </div>
      </dl>

      {/* Sources */}
      {stats.sources.length > 0 && (
        <div className="mt-3 border-t border-purple-200/60 pt-3">
          <p className="mb-1.5 font-body text-[11px] uppercase tracking-wide text-muted">
            Sources
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {stats.sources.map(({ source, count }) => (
              <span
                key={source}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-body text-xs font-medium text-purple-900 ring-1 ring-inset ring-purple-200"
              >
                <span>{labelForSource(source)}</span>
                <span className="tabular-nums text-purple-600">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Helpers (purs, in-line — pas testés séparément vu leur simplicité)

interface Stats {
  totalVisits: number
  firstVisit: string
  lastVisit: string
  avgDuration: number | null
  sources: { source: MaquetteVisitSource; count: number }[]
}

function computeStats(
  visits: Pick<MaquetteVisit, 'source' | 'created_at' | 'duration_seconds'>[]
): Stats {
  const totalVisits = visits.length
  const firstVisit = visits[0]!.created_at
  const lastVisit = visits[visits.length - 1]!.created_at

  const durations = visits
    .map((v) => v.duration_seconds)
    .filter((d): d is number => d !== null)
  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null

  const sourceCounts = new Map<MaquetteVisitSource, number>()
  for (const v of visits) {
    sourceCounts.set(v.source, (sourceCounts.get(v.source) ?? 0) + 1)
  }
  const sources = Array.from(sourceCounts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)

  return { totalVisits, firstVisit, lastVisit, avgDuration, sources }
}

function formatDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return `${m}m${s > 0 ? ` ${s}s` : ''}`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

function labelForSource(src: MaquetteVisitSource): string {
  switch (src) {
    case 'affiche': return 'via affiche'
    case 'email':   return 'via email'
    case 'carte':   return 'via carte'
    case 'direct':  return 'direct'
    case 'other':   return 'autre'
  }
}
