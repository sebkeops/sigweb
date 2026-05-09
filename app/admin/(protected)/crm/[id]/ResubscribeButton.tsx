'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { resubscribeProspect } from '@/lib/actions/email'

interface Props {
  prospectId: string
  unsubscribedAt: string | null
}

/**
 * Bouton admin "Réabonner" — visible uniquement quand le prospect est
 * désabonné. Permet de réactiver les envois si le prospect recontacte
 * (par téléphone ou email) en disant qu'il s'était désabonné par erreur.
 *
 * Pas de page publique de réabonnement self-service côté prospect — le
 * RGPD imposerait un double opt-in (envoi d'un email de confirmation,
 * re-consentement explicite) qu'on ne gère pas pour cette V1.
 */
export default function ResubscribeButton({
  prospectId,
  unsubscribedAt,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function handleClick() {
    setError(null)
    const confirmText = unsubscribedAt
      ? `Réabonner ce prospect ? Il s'était désabonné le ${formatDate(unsubscribedAt)}.`
      : 'Réabonner ce prospect ?'
    if (!window.confirm(confirmText)) return

    startTransition(async () => {
      const r = await resubscribeProspect(prospectId)
      if (!r.success) {
        setError(r.error)
      }
      // Pas besoin de router.refresh() : revalidatePath côté serveur
      // déclenche déjà le re-render de la page.
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleClick}
        loading={pending}
      >
        Réabonner
      </Button>
      {unsubscribedAt && (
        <span className="font-body text-xs text-muted">
          Désabonné le {formatDate(unsubscribedAt)}
        </span>
      )}
      {error && (
        <span className="font-body text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}
