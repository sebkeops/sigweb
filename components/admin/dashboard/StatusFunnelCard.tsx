import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { StatusFunnelRow } from '@/lib/admin/dashboard-stats'

interface Props {
  rows: StatusFunnelRow[]
  total: number
}

/**
 * Carte « Entonnoir statuts » du dashboard admin (CRM v3 Phase 6).
 *
 * Affiche les 13 statuts dans l'ordre canonique, avec compteur et barre
 * de proportion. Les statuts à 0 sont conservés pour montrer l'entonnoir
 * entier (« 0 signés » est une info, pas un bug).
 *
 * Mobile-first : barre fine pleine largeur, tap target sur le lien pour
 * filtrer la liste CRM par statut.
 */
export default function StatusFunnelCard({ rows, total }: Props) {
  return (
    <article className="rounded-md border border-border bg-surface p-4 shadow-sm sm:p-6">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-base font-bold text-ink">
          Entonnoir statuts
        </h2>
        <span className="font-body text-xs text-muted">
          {total} {total > 1 ? 'prospects' : 'prospect'}
        </span>
      </header>

      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.statut}>
            <Link
              href={`/admin/crm?statut=${row.statut}`}
              className="block rounded-sm px-1 py-1 transition hover:bg-surface-soft"
            >
              {/* Ligne 1 : badge + compteur. Badge se redimensionne
                  naturellement (pas de min-w fixe qui ferait deborder
                  sur 'Maquette prete' + 'Devis envoye'). */}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <StatusBadge statut={row.statut} />
                </div>
                <span className="shrink-0 font-body text-sm font-semibold tabular-nums text-ink">
                  {row.count}
                </span>
              </div>
              {/* Ligne 2 : barre de proportion pleine largeur */}
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-strong">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${row.pct}%` }}
                  aria-hidden="true"
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  )
}
