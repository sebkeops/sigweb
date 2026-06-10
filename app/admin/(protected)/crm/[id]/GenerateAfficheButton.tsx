'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { EtatAdministratif } from '@/types'

interface Props {
  prospectId: string
  /** État administratif Sirene pour garde-fou si prospect fermé. */
  etatAdministratif: EtatAdministratif
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
export default function GenerateAfficheButton({
  prospectId,
  etatAdministratif,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isClosed = etatAdministratif === 'F' || etatAdministratif === 'C'

  /** Confirmation explicite si prospect fermé. Renvoie `?force=1` à concaténer. */
  function confirmClosedOrAbort(): { proceed: boolean; forceParam: string } {
    if (!isClosed) return { proceed: true, forceParam: '' }
    const ok = window.confirm(
      'Ce prospect est marqué FERMÉ par Sirene. Générer l\'affiche quand même ?'
    )
    return { proceed: ok, forceParam: ok ? '&force=1' : '' }
  }

  async function handleDownload() {
    const { proceed, forceParam } = confirmClosedOrAbort()
    if (!proceed) return

    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/affiche/${prospectId}?_=${Date.now()}${forceParam}`)
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

  function handlePreviewClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Pour Aperçu : on intercepte le click pour confirmer côté UI avant
    // que le navigateur ouvre la route. Si confirmé, on rebascule sur
    // l'URL avec ?force=1 (sinon la route renvoie 409 et un onglet vide).
    if (!isClosed) return
    e.preventDefault()
    const ok = window.confirm(
      'Ce prospect est marqué FERMÉ par Sirene. Ouvrir l\'aperçu quand même ?'
    )
    if (!ok) return
    window.open(`/api/admin/affiche/${prospectId}?preview=1&force=1`, '_blank', 'noopener,noreferrer')
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
        onClick={handlePreviewClick}
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
