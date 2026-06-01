import Link from 'next/link'
import type { Prospect } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  CANAL_BADGE,
  CANAL_LABELS,
  displayCategorie,
} from '@/lib/crm/constants'

interface ProspectCardProps {
  prospect: Prospect
}

/**
 * Carte mobile d'un prospect — rendue < lg a la place du tableau.
 *
 * Toute la carte mene a la fiche via le lien « Voir » etire
 * (`after:absolute after:inset-0`) ; le bouton « Modifier » reste cliquable
 * independamment grace a `relative z-10`.
 */
export default function ProspectCard({ prospect: p }: ProspectCardProps) {
  return (
    <div className="relative rounded-md border border-border bg-surface p-4 shadow-sm transition-colors hover:bg-surface-soft">
      <h3 className="truncate font-body text-base font-bold text-ink">{p.nom_commerce}</h3>
      <p className="mt-0.5 truncate font-body text-[13px] text-muted">
        {displayCategorie(p)}
        {p.ville ? ` · ${p.ville}` : ''}
      </p>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-body text-[13px] text-muted">
        <span>
          Score :{' '}
          <strong className="text-ink">{p.score != null ? `${p.score}/10` : '—'}</strong>
        </span>
        <span>
          Distance :{' '}
          <strong className="text-ink">
            {p.distance_km != null ? `${p.distance_km} km` : '—'}
          </strong>
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge variant={CANAL_BADGE[p.canal]}>{CANAL_LABELS[p.canal]}</Badge>
        <StatusBadge statut={p.statut} />
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <Link
          href={`/admin/crm/${p.id}`}
          className="flex min-h-[44px] flex-1 items-center justify-center rounded-sm border border-primary bg-primary px-4 font-body text-sm font-semibold text-white after:absolute after:inset-0 after:content-['']"
        >
          Voir
        </Link>
        <Link
          href={`/admin/crm/${p.id}/modifier`}
          className="relative z-10 flex min-h-[44px] flex-1 items-center justify-center rounded-sm border border-border bg-surface px-4 font-body text-sm font-semibold text-ink"
        >
          Modifier
        </Link>
      </div>
    </div>
  )
}
