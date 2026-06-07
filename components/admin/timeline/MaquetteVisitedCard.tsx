import type { MaquetteVisitedMetadata, MaquetteVisitSource } from '@/types'
import type { PlainTimelineItem } from '@/lib/crm/timeline-aggregator'

interface Props {
  item: PlainTimelineItem
}

/**
 * Carte timeline pour un event `maquette_visited` (CRM v3 Phase 3).
 *
 * Mobile-first : cards compactes, tap targets ≥ 44px sur les éléments
 * interactifs (le lien vers la maquette). Pas de hover-only.
 *
 * Structure :
 *   - icone 👁️ (oeil) sur fond purple-soft
 *   - titre "Maquette visitée N fois" (avec pluriel)
 *   - sous-titre : compteur + "il y a X" + lien vers la maquette
 *   - chips de source (affiche N · email M · direct P) si plusieurs sources
 *   - chip channel "Maquette"
 */
export default function MaquetteVisitedCard({ item }: Props) {
  const meta = item.event.metadata as MaquetteVisitedMetadata
  const visitLabel = meta.visit_count > 1
    ? `Maquette visitée ${meta.visit_count} fois`
    : 'Maquette visitée'
  const relative = formatRelativeFr(meta.last_visit_at)
  const sourceEntries = Object.entries(meta.sources) as [MaquetteVisitSource, number][]

  return (
    <article className="rounded-md border border-border bg-surface p-3 sm:p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Icône */}
        <div
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-purple-100 text-purple-700"
        >
          {/* Eye icon (Heroicons outline) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        {/* Contenu */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="font-body text-sm font-semibold text-ink">{visitLabel}</h3>
            <time
              dateTime={meta.last_visit_at}
              className="font-body text-xs text-muted"
            >
              {relative}
            </time>
          </div>

          {/* Sous-titre : nombre + lien maquette */}
          <p className="mt-1 font-body text-xs text-muted">
            Dernière visite{' '}
            <time dateTime={meta.last_visit_at}>{formatTimeFr(meta.last_visit_at)}</time>
            {' · '}
            <a
              href={`/demos/${meta.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
            >
              Voir la maquette
            </a>
          </p>

          {/* Sources */}
          {sourceEntries.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {sourceEntries.map(([src, count]) => (
                <span
                  key={src}
                  className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 font-body text-[11px] font-medium text-purple-800"
                >
                  <span>{labelForSource(src)}</span>
                  <span className="tabular-nums text-purple-600">{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function labelForSource(src: MaquetteVisitSource): string {
  switch (src) {
    case 'affiche':     return 'via affiche'
    case 'email':       return 'via email'
    case 'email-test':  return 'via email (test)'
    case 'carte':       return 'via carte'
    case 'direct':      return 'direct'
    case 'other':       return 'autre'
  }
}

/**
 * "il y a N min/heure/jour" — formattage relatif FR.
 * Pas de dépendance externe (date-fns suffirait mais évite l'import).
 */
function formatRelativeFr(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffSec = Math.max(0, Math.round((now - then) / 1000))
  if (diffSec < 60) return 'à l\'instant'
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  const diffD = Math.round(diffH / 24)
  if (diffD < 30) return `il y a ${diffD} j`
  const diffM = Math.round(diffD / 30)
  if (diffM < 12) return `il y a ${diffM} mois`
  const diffY = Math.round(diffD / 365)
  return `il y a ${diffY} an${diffY > 1 ? 's' : ''}`
}

function formatTimeFr(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
