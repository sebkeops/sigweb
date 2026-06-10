'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { enrichExistingProspectFromSirene } from '@/lib/actions/sirene-enrich'

interface Props {
  prospectId: string
  /** Présence d'un SIRET côté prospect. Détermine le libellé et le tooltip. */
  hasSiret: boolean
  /**
   * Présence d'un enrichissement Sirene antérieur. Si true, on demande
   * confirmation avant d'écraser les données (via flag force côté action).
   */
  alreadyEnriched: boolean
  /**
   * Capacité minimale du fallback nom + code postal. Si pas de SIRET et
   * pas de (nom_commerce + code_postal), le bouton est désactivé.
   */
  canFallbackSearch: boolean
}

/**
 * Bouton "Enrichir / Actualiser depuis Sirene" sur la fiche prospect.
 *
 * Cas d'usage :
 *   1. Prospect Google sans SIRET → bouton "Rechercher dans Sirene"
 *      (matching nom + code postal, écrit si exactement 1 résultat strict)
 *   2. Prospect avec SIRET → bouton "Actualiser depuis Sirene"
 *      (re-fetch par SIRET, idempotent — utile si forme juridique a changé)
 *
 * Confirmation côté UI si déjà enrichi → on flag `force: true` côté action.
 *
 * Toute la logique métier (matching, dédup, scoring) est dans la server
 * action — ce composant ne fait que router le résultat vers un message UX.
 */
export default function EnrichSireneButton({
  prospectId,
  hasSiret,
  alreadyEnriched,
  canFallbackSearch,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const label = hasSiret ? 'Actualiser depuis Sirene' : 'Rechercher dans Sirene'
  const disabled = !hasSiret && !canFallbackSearch
  const disabledReason = disabled
    ? 'Renseigner SIRET ou nom + code postal'
    : null

  function handleClick() {
    // Confirmation explicite si on va écraser un enrichissement existant.
    if (alreadyEnriched) {
      const ok = window.confirm(
        'Ce prospect a déjà été enrichi via Sirene. Rafraîchir va écraser les données actuelles. Continuer ?'
      )
      if (!ok) return
    }

    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const r = await enrichExistingProspectFromSirene(prospectId, {
        force: alreadyEnriched,
      })
      if (!r.success) {
        setError(r.message)
        return
      }
      const matchLabel = r.mode === 'by_siret' ? 'par SIRET' : 'par nom + CP'
      const dirigeantNote = r.dirigeant_diffusible
        ? ' · dirigeant diffusible récupéré'
        : ''
      setSuccess(`Enrichi ${matchLabel}${dirigeantNote}.`)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleClick}
        loading={pending}
        disabled={disabled}
      >
        {label}
      </Button>
      {disabledReason && (
        <span className="font-body text-xs text-muted">{disabledReason}</span>
      )}
      {error && (
        <span className="font-body text-xs text-red-600">{error}</span>
      )}
      {success && (
        <span className="font-body text-xs text-primary-dark">✓ {success}</span>
      )}
    </div>
  )
}
