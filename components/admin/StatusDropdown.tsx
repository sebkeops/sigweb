'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ProspectStatut } from '@/types'
import { STATUT_OPTIONS, STATUT_BADGE } from '@/lib/crm/constants'
import { updateProspectStatut } from '@/lib/actions/prospect'

interface StatusDropdownProps {
  prospectId: string
  currentStatut: ProspectStatut
}

/**
 * Dropdown de changement de statut prospect — mobile-first.
 *
 * Implementation : `<select>` HTML natif stylé Tailwind. Justification :
 *   - Ouvre le picker natif iOS/Android (ergonomie optimale, 0 lag)
 *   - Accessibilité gratuite (clavier, lecteur d'écran, focus)
 *   - Tap target ≥ 44×44px (`min-h-[44px]`) conforme guideline mobile
 *   - Zero JS runtime côté composant — juste la Server Action au change
 *
 * Comportement :
 *   - Le `onChange` déclenche la Server Action `updateProspectStatut`
 *   - Pendant la requête, le select est disabled (pas de double-clic)
 *   - Le retour `router.refresh()` re-rend le Server Component parent
 *     avec le nouveau statut + `statut_updated_at` à jour
 *   - En cas d'erreur, on revient à la valeur précédente + alert
 *
 * NB : `currentStatut` reste la source de vérité depuis le Server
 * Component parent. Le state local `value` n'est qu'un buffer optimiste
 * pour réagir immédiatement au tap avant que le refresh ne propage.
 */
export default function StatusDropdown({
  prospectId,
  currentStatut,
}: StatusDropdownProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState<ProspectStatut>(currentStatut)

  // Si le parent re-rend avec une nouvelle valeur (changement externe ou
  // refresh post-mutation), on resync le state local pour éviter de
  // garder un état stale après le router.refresh().
  if (value !== currentStatut && !pending) {
    setValue(currentStatut)
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotColor(value)}`}
      />
      <select
        aria-label="Changer le statut du prospect"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const newStatut = e.target.value as ProspectStatut
          const previousStatut = value
          setValue(newStatut)
          startTransition(async () => {
            const res = await updateProspectStatut(prospectId, newStatut)
            if (!res.success) {
              setValue(previousStatut)
              alert(res.error ?? 'Erreur lors du changement de statut.')
              return
            }
            router.refresh()
          })
        }}
        className="min-h-[44px] cursor-pointer rounded-md border border-border bg-surface px-3 py-2 font-body text-sm font-medium text-ink shadow-sm transition-colors hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-wait disabled:opacity-60"
      >
        {STATUT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {pending && (
        <span aria-live="polite" className="font-body text-xs text-muted">
          Mise à jour…
        </span>
      )}
    </div>
  )
}

/**
 * Petit point coloré aligné sur la variant Badge du statut — donne un
 * repère visuel rapide à côté du select (le `<select>` natif ne supporte
 * pas la couleur dans les `<option>`).
 */
function dotColor(statut: ProspectStatut): string {
  const variant = STATUT_BADGE[statut]
  switch (variant) {
    case 'green':   return 'bg-primary'
    case 'orange':  return 'bg-accent'
    case 'red':     return 'bg-red-500'
    case 'blue':    return 'bg-blue-500'
    case 'purple':  return 'bg-purple-500'
    case 'yellow':  return 'bg-yellow-500'
    case 'indigo':  return 'bg-indigo-500'
    case 'dark':    return 'bg-ink'
    case 'gray':
    default:        return 'bg-muted/60'
  }
}
