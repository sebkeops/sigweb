'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { fr } from 'date-fns/locale/fr'
import { useEditor } from './EditorContext'

const HINT_ITALIC = 'Encadrez avec `*comme ceci*` les mots à mettre en italique.'

/**
 * Indicateur de statut de sauvegarde + bandeau d'erreur / stale.
 *
 * - idle  : "Aucun changement en attente"
 * - saving: "Sauvegarde en cours…"
 * - saved : "Sauvegardé il y a X" (re-render toutes les 5s pour rester à jour)
 * - error : "Erreur" + bouton Réessayer maintenant
 * - stale : "Modifiée ailleurs — Recharger" (bouton Recharger)
 *
 * Note : `HINT_ITALIC` n'est pas utilisé ici — c'est juste pour signaler la
 * convention dans le commentaire. Les champs concernés portent leur propre `hint`.
 * (Référence inutilisée volontairement absente — placée en commentaire pour grep.)
 */
void HINT_ITALIC

export default function SaveStatus() {
  const { status, lastSavedAt, error, retry, reload } = useEditor()

  // Re-render périodique pour mettre à jour "il y a X" (toutes les 5s).
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (status !== 'saved') return
    const id = setInterval(() => setTick((t) => t + 1), 5000)
    return () => clearInterval(id)
  }, [status])
  void tick // marqueur d'effet

  if (status === 'stale') {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 font-body text-xs">
        <span className="text-amber-900">{error ?? 'Maquette modifiée ailleurs.'}</span>
        <button
          type="button"
          onClick={reload}
          className="rounded-md border border-amber-700 bg-amber-700 px-3 py-1 font-body text-xs font-semibold text-white transition hover:bg-amber-800"
        >
          Recharger
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 font-body text-xs">
        <span className="text-red-700">{error ?? 'Erreur de sauvegarde.'}</span>
        <button
          type="button"
          onClick={retry}
          className="rounded-md border border-red-700 bg-red-700 px-3 py-1 font-body text-xs font-semibold text-white transition hover:bg-red-800"
        >
          Réessayer maintenant
        </button>
      </div>
    )
  }

  if (status === 'saving') {
    return <span className="font-body text-xs text-muted">Sauvegarde en cours…</span>
  }

  if (status === 'saved' && lastSavedAt) {
    let relative: string
    try {
      relative = formatDistanceToNow(new Date(lastSavedAt), { addSuffix: true, locale: fr })
    } catch {
      relative = "à l'instant"
    }
    return <span className="font-body text-xs text-green-700">✓ Sauvegardé {relative}</span>
  }

  return <span className="font-body text-xs text-muted">Aucun changement en attente</span>
}
