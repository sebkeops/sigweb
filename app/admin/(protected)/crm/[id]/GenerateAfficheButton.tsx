'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  prospectId: string
}

/**
 * Deux entrées d'action sur l'affiche A4 d'un prospect :
 *
 *   - Bouton principal : télécharge le PDF (fetch + blob + click sur <a>).
 *     On n'utilise pas un simple <a download> sur l'URL pour pouvoir afficher
 *     un état "Chargement…" pendant les 2-3s de génération côté serveur (fetch
 *     photo Google + render PDF) et remonter une erreur lisible si échec.
 *
 *   - Lien d'aperçu : ouvre `?preview=1` dans un nouvel onglet — la route
 *     répond alors avec `Content-Disposition: inline` (le PDF s'ouvre dans
 *     le navigateur sans téléchargement).
 *
 * Le bouton est toujours actif : la route gère elle-même les fallbacks
 * (pas de maquette / pas de photo Google → placeholder).
 */
export default function GenerateAfficheButton({ prospectId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/affiche/${prospectId}`)
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Erreur ${res.status}`)
      }

      const blob = await res.blob()
      const filename = parseFilename(res.headers.get('Content-Disposition'))
        ?? `affiche-${prospectId}.pdf`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1 max-lg:items-stretch">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleDownload}
        loading={loading}
        className="max-lg:min-h-[44px] max-lg:w-full"
      >
        Affiche A4
      </Button>
      <a
        href={`/api/admin/affiche/${prospectId}?preview=1`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-body text-xs text-primary hover:underline"
      >
        Aperçu ↗
      </a>
      {error && (
        <span className="font-body text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}

function parseFilename(headerValue: string | null): string | null {
  if (!headerValue) return null
  const match = headerValue.match(/filename="([^"]+)"/)
  return match?.[1] ?? null
}
