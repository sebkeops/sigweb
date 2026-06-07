import Link from 'next/link'
import type { UpcomingMeetingRow } from '@/lib/admin/dashboard-stats'

interface Props {
  rows: UpcomingMeetingRow[]
}

/**
 * Carte « RDV à venir » du dashboard admin (CRM v3 Phase 6).
 *
 * Liste les RDV programmés futurs, triée par date ASC. Chaque ligne =
 * lien tap-friendly vers la fiche du prospect concerné.
 *
 * Empty state : message rassurant si aucun RDV — pas anxiogène.
 */
export default function UpcomingMeetingsCard({ rows }: Props) {
  return (
    <article className="rounded-md border border-border bg-surface p-4 shadow-sm sm:p-6">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-base font-bold text-ink">
          RDV à venir
        </h2>
        <span className="font-body text-xs text-muted">
          {rows.length} {rows.length > 1 ? 'RDV' : rows.length === 0 ? 'aucun' : 'RDV'}
        </span>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-sm border border-border/60 bg-surface-soft px-4 py-6 text-center font-body text-sm text-muted">
          Pas de RDV programmé. Ajoute-en un depuis la timeline d'un prospect.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.slice(0, 8).map((row) => (
            <li key={row.eventId}>
              <Link
                href={`/admin/crm/${row.prospectId}`}
                className="flex min-h-[44px] items-center gap-3 rounded-sm border border-border bg-surface-soft px-3 py-2 transition hover:border-primary hover:bg-primary-soft/30"
              >
                <span aria-hidden="true" className="text-lg">
                  📅
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-semibold text-ink">
                    {row.prospectName}
                  </p>
                  <p className="font-body text-xs text-muted">
                    {formatRdvDate(row.dateRdv)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {rows.length > 8 && (
            <li className="pt-1 font-body text-xs text-muted">
              + {rows.length - 8} autre{rows.length - 8 > 1 ? 's' : ''} RDV
            </li>
          )}
        </ul>
      )}
    </article>
  )
}

function formatRdvDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
