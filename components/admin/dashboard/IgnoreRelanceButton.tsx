'use client'

import { useTransition } from 'react'
import { ignoreRelance } from '@/lib/actions/relance'

interface Props {
  prospectId: string
  prospectName: string
}

/**
 * Bouton × pour ignorer une relance depuis la carte dashboard
 * (CRM v3 Phase 7 fix). Confirme avant d'appeler la server action —
 * action accidentelle = on perd une date_relance_prevue qu'il faudra
 * resaisir, c'est ennuyeux mais pas grave (le statut reste, juste la
 * date a effacer).
 *
 * Stop propagation pour ne pas declencher le clic du <Link> parent
 * qui ouvre la fiche prospect.
 */
export default function IgnoreRelanceButton({ prospectId, prospectName }: Props) {
  const [pending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const ok = window.confirm(
      `Ignorer la relance pour ${prospectName} ? Le statut du prospect reste inchangé, seule la date de relance prévue est effacée.`
    )
    if (!ok) return

    startTransition(async () => {
      const result = await ignoreRelance(prospectId)
      if (!result.success) {
        window.alert(`Erreur : ${result.error}`)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={`Ignorer la relance pour ${prospectName}`}
      title="Ignorer cette relance"
      className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-strong hover:text-ink disabled:cursor-wait disabled:opacity-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  )
}
