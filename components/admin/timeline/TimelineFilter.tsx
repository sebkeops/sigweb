'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { TimelineItem } from '@/lib/crm/timeline-aggregator'

/**
 * Chips de filtre canal pour la Timeline (CRM v3 Phase 2).
 *
 * Approche : URL-driven. Le chip actif est lu depuis le query param
 * `?canal=email|statut`, le clic met à jour l'URL via `router.push`
 * avec `scroll: false` (l'utilisateur reste sur la timeline).
 *
 * Choix de design — Option A validée pour Phase 2 :
 *   - Seuls les chips utiles sont affichés : `[Tout] [Email] [Statut]`
 *   - Pas de chips morts pour Phase 3-4
 *   - Le composant accepte une liste de channels disponibles (calculée
 *     par la Timeline en fonction du `excludeTests` et des items réels)
 *
 * Mobile-first : conteneur scrollable horizontalement (`overflow-x-auto`)
 * + tap target ≥ 44px sur chaque chip.
 */

type Channel = TimelineItem['channel']

interface Props {
  /** Channels présents dans la timeline du prospect — alimente l'ordre + compteurs. */
  channels: ReadonlyArray<{ key: Channel; count: number }>
  /** Total tous canaux confondus, pour le chip "Tout". */
  total: number
  /** Channel actuellement sélectionné (lu côté serveur), ou `null` pour "Tout". */
  active: Channel | null
}

const CHANNEL_LABELS: Record<Channel, string> = {
  email: 'Email',
  statut: 'Statut',
  maquette: 'Maquette',
  telephone: 'Téléphone',
  terrain: 'Terrain',
  note: 'Notes',
}

export default function TimelineFilter({ channels, total, active }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setChannel = useCallback(
    (next: Channel | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === null) params.delete('canal')
      else params.set('canal', next)
      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return (
    <nav
      aria-label="Filtrer la timeline par canal"
      className="-mx-1 overflow-x-auto"
    >
      <ul className="flex items-center gap-2 px-1 py-1">
        <li>
          <ChipButton
            label="Tout"
            count={total}
            active={active === null}
            onClick={() => setChannel(null)}
          />
        </li>
        {channels.map((c) => (
          <li key={c.key}>
            <ChipButton
              label={CHANNEL_LABELS[c.key]}
              count={c.count}
              active={active === c.key}
              onClick={() => setChannel(c.key)}
            />
          </li>
        ))}
      </ul>
    </nav>
  )
}

interface ChipButtonProps {
  label: string
  count: number
  active: boolean
  onClick: () => void
}

function ChipButton({ label, count, active, onClick }: ChipButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex min-h-[36px] items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5',
        'font-body text-sm font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        active
          ? 'border-primary bg-primary text-white shadow-sm'
          : 'border-border bg-surface text-ink hover:border-primary/40 hover:bg-surface-soft',
      ].join(' ')}
    >
      <span>{label}</span>
      <span
        className={[
          'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
          active ? 'bg-white/20 text-white' : 'bg-surface-strong text-muted',
        ].join(' ')}
      >
        {count}
      </span>
    </button>
  )
}
