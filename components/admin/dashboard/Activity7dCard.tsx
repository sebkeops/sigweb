import type { Activity7dResult } from '@/lib/admin/dashboard-stats'

interface Props {
  data: Activity7dResult
}

const CHANNEL_LABEL: Record<keyof Activity7dResult['days'][number]['counts'], string> = {
  email: 'Emails',
  phone_call: 'Appels',
  terrain: 'Terrain',
  note: 'Notes',
  maquette: 'Visites',
  statut: 'Statuts',
}

/**
 * Carte « Activité 7 derniers jours » du dashboard admin (CRM v3 Phase 6).
 *
 * Mini-histogramme : 7 barres verticales (1 par jour), chacune montrant
 * le total d'événements (emails + events timeline) pour la journée.
 * Hauteur normalisée sur le max des 7 jours pour rester lisible.
 *
 * Sous l'histogramme, une légende avec le décompte total par canal sur
 * la semaine, pour comprendre la répartition d'effort.
 *
 * Mobile-first : barres ≥ 24px de large (tap-friendly), labels jour de
 * la semaine compacts.
 */
export default function Activity7dCard({ data }: Props) {
  const maxDay = Math.max(1, ...data.days.map((d) => d.total))

  // Agrège les totaux par canal sur les 7 jours pour la légende.
  const channelTotals = data.days.reduce(
    (acc, day) => {
      for (const key of Object.keys(day.counts) as (keyof typeof day.counts)[]) {
        acc[key] = (acc[key] ?? 0) + day.counts[key]
      }
      return acc
    },
    {} as Record<keyof typeof CHANNEL_LABEL, number>
  )

  return (
    <article className="rounded-md border border-border bg-surface p-4 shadow-sm sm:p-6">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-base font-bold text-ink">
          Activité 7 derniers jours
        </h2>
        <span className="font-body text-xs text-muted">
          {data.weekTotal} {data.weekTotal > 1 ? 'événements' : 'événement'}
        </span>
      </header>

      {/* Histogramme — min-w-0 sur chaque colonne pour autoriser le
          shrink en dessous de la largeur du contenu (sinon le nombre
          a 2 chiffres + lettre du jour imposent une largeur min qui
          fait deborder la rangee). */}
      <div
        className="flex h-32 items-end justify-between gap-1"
        role="list"
        aria-label="Activité par jour, 7 derniers jours"
      >
        {data.days.map((day) => {
          const heightPct = Math.round((day.total * 100) / maxDay)
          return (
            <div
              key={day.date}
              role="listitem"
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
              title={`${formatDayShort(day.date)} : ${day.total} événement${day.total > 1 ? 's' : ''}`}
            >
              <div className="flex w-full flex-col justify-end" style={{ height: '100%' }}>
                <div
                  className={`w-full rounded-t ${day.total === 0 ? 'bg-surface-strong' : 'bg-primary'}`}
                  style={{ height: `${heightPct}%`, minHeight: day.total > 0 ? '4px' : '2px' }}
                  aria-hidden="true"
                />
              </div>
              <span className="font-body text-[10px] font-medium uppercase text-muted">
                {formatDayLetter(day.date)}
              </span>
              <span className="font-body text-[11px] font-semibold tabular-nums text-ink">
                {day.total}
              </span>
            </div>
          )
        })}
      </div>

      {/* Légende — décompte par canal sur la semaine */}
      <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
        {(Object.keys(CHANNEL_LABEL) as (keyof typeof CHANNEL_LABEL)[])
          .filter((k) => (channelTotals[k] ?? 0) > 0)
          .map((k) => (
            <li
              key={k}
              className="font-body text-xs text-muted"
            >
              <span className="font-semibold tabular-nums text-ink">
                {channelTotals[k]}
              </span>{' '}
              {CHANNEL_LABEL[k]}
            </li>
          ))}
        {data.weekTotal === 0 && (
          <li className="font-body text-xs italic text-muted">
            Aucune activité sur les 7 derniers jours.
          </li>
        )}
      </ul>
    </article>
  )
}

function formatDayLetter(dateKey: string): string {
  // dateKey = "YYYY-MM-DD" — interpréter en local
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const letters = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
  return letters[date.getDay()]
}

function formatDayShort(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
