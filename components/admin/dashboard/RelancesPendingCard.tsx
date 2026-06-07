import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { RelancePendingRow } from '@/lib/admin/dashboard-stats'

interface Props {
  rows: RelancePendingRow[]
}

/**
 * Carte « Relances à faire » du dashboard admin (CRM v3 Phase 6).
 *
 * Liste les prospects en statut relance_X dont la date de relance prévue
 * est aujourd'hui ou dépassée. Ligne en rouge si overdue, en orange si
 * today — visuel actionnable.
 *
 * Empty state : message « tu es à jour » si liste vide.
 */
export default function RelancesPendingCard({ rows }: Props) {
  return (
    <article className="rounded-md border border-border bg-surface p-4 shadow-sm sm:p-6">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-base font-bold text-ink">
          Relances à faire
        </h2>
        <span className="font-body text-xs text-muted">
          {rows.length}{' '}
          {rows.length === 0
            ? 'à jour'
            : rows.length > 1
              ? 'prospects'
              : 'prospect'}
        </span>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-sm border border-border/60 bg-surface-soft px-4 py-6 text-center font-body text-sm text-muted">
          Aucune relance en retard. 👍
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.slice(0, 10).map((row) => {
            const isOverdue = row.urgency === 'overdue'
            return (
              <li key={row.prospectId}>
                <Link
                  href={`/admin/crm/${row.prospectId}`}
                  className={`block rounded-sm border px-3 py-2 transition hover:bg-surface-soft ${
                    isOverdue
                      ? 'border-red-200 bg-red-50/60 hover:border-red-300'
                      : 'border-orange-200 bg-orange-50/40 hover:border-orange-300'
                  }`}
                >
                  <div className="flex min-h-[44px] items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {isOverdue ? '!' : '·'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm font-semibold text-ink">
                        {row.prospectName}
                      </p>
                      <p className="truncate font-body text-xs text-muted">
                        {isOverdue ? (
                          <>
                            En retard de{' '}
                            <span className="font-medium text-red-700">
                              {row.daysOverdue}j
                            </span>
                          </>
                        ) : (
                          <span className="font-medium text-orange-700">
                            Aujourd'hui
                          </span>
                        )}
                      </p>
                    </div>
                    {/* Badge statut : caché < sm pour laisser respirer le
                        nom du commerçant. Cliquer sur la ligne ouvre la
                        fiche où le statut est très visible. */}
                    <div className="hidden shrink-0 sm:block">
                      <StatusBadge statut={row.statut} />
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
          {rows.length > 10 && (
            <li className="pt-1 font-body text-xs text-muted">
              + {rows.length - 10} autre{rows.length - 10 > 1 ? 's' : ''} relance
              {rows.length - 10 > 1 ? 's' : ''}
            </li>
          )}
        </ul>
      )}
    </article>
  )
}
