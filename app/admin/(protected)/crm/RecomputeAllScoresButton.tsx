'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RecomputeAllScoresButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleClick() {
    if (!confirm('Recalculer le score de tous les prospects selon la grille actuelle ?')) {
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/prospects/recompute-scores', { method: 'POST' })
      const json = await res.json()
      if (json.ok) {
        setResult(`✓ ${json.updated}/${json.total} prospects recalculés${json.failures?.length ? ` (${json.failures.length} échecs)` : ''}`)
        router.refresh()
      } else {
        setResult(`Erreur : ${json.error ?? 'inconnue'}`)
      }
    } catch (err) {
      setResult(`Erreur réseau : ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="font-body text-xs text-muted hover:text-primary disabled:opacity-50"
      >
        {loading ? 'Recalcul…' : 'Recalculer tous les scores'}
      </button>
      {result && <span className="font-body text-xs text-primary-dark">{result}</span>}
    </div>
  )
}
