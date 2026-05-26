'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  ALL_FAMILIES_SLUG,
  PUBLIC_FAMILY_OPTIONS,
  type PublicFamilyOption,
} from './family-config'

interface Props {
  /**
   * Famille active (clé interne) ou `null` si "Toutes" est sélectionné.
   * La source de vérité est l'URL — ce composant ne maintient pas son
   * propre state, il fait juste `router.push` pour mettre à jour
   * `?famille=...` et laisse le parent re-rendre.
   */
  activeKey: PublicFamilyOption['key'] | null
  /**
   * Compteurs par famille pour afficher `Commerces de bouche (3)`. La clé
   * spéciale `__all` porte le total. Calculé une fois côté parent à partir
   * de la liste complète des simulations chargées au mount.
   */
  counts: Readonly<Record<PublicFamilyOption['key'] | '__all', number>>
}

/**
 * Barre de filtres familles (pilules) au-dessus de la grille `/simulations`.
 *
 * Choix d'architecture :
 *   - URL = source de vérité (`?famille=commerces-bouche`) — permet partage
 *     et navigation arrière propre. Le parent lit `useSearchParams()` et
 *     re-rend la grille filtrée à chaque changement.
 *   - Pas de scroll au top après changement (`scroll: false`) — l'utilisateur
 *     reste sur la grille, le filtrage est instantané.
 *   - Mobile : conteneur scrollable horizontalement quand les 6 pilules
 *     dépassent la largeur (`overflow-x-auto`).
 *   - Accessibilité : `aria-pressed` sur chaque pilule pour signaler l'état
 *     actif aux lecteurs d'écran, focus visible géré via Tailwind.
 */
export default function FamilyFilter({ activeKey, counts }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setFamily = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (slug === null) params.delete('famille')
      else params.set('famille', slug)
      const qs = params.toString()
      router.push(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  return (
    <nav aria-label="Filtrer par famille" className="mb-8">
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
        <li>
          <Pill
            active={activeKey === null}
            label="Toutes"
            count={counts.__all}
            onClick={() => setFamily(null)}
          />
        </li>
        {PUBLIC_FAMILY_OPTIONS.map((opt) => (
          <li key={opt.key}>
            <Pill
              active={activeKey === opt.key}
              label={opt.label}
              count={counts[opt.key]}
              onClick={() => setFamily(opt.slug)}
            />
          </li>
        ))}
      </ul>
    </nav>
  )
}

interface PillProps {
  active: boolean
  label: string
  count: number
  onClick: () => void
}

function Pill({ active, label, count, onClick }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        // base
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2',
        'font-body text-sm font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        active
          ? 'border-primary bg-primary text-white shadow-sm'
          : 'border-border bg-surface text-ink hover:border-primary/40 hover:bg-surface-soft',
      ].join(' ')}
    >
      <span>{label}</span>
      <span
        className={[
          'rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums',
          active ? 'bg-white/20 text-white' : 'bg-surface-strong text-muted',
        ].join(' ')}
      >
        {count}
      </span>
    </button>
  )
}

/**
 * Slug d'URL exporté pour les liens éventuels (si on veut linker direct
 * vers une famille depuis ailleurs sur le site).
 */
export { ALL_FAMILIES_SLUG }
