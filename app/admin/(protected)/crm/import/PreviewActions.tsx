'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import {
  bindProspectToGoogleAction,
  checkExistingProspectAction,
  type ExistingProspect,
  prepareCreateFromEnrichedAction,
  updateProspectFromEnrichedAction,
} from '@/lib/actions/google-import'

interface Props {
  placeId: string
  placeName: string
  /**
   * Si fourni, on est en mode "Lier à Google" : la preview doit proposer
   * d'enrichir cette fiche existante au lieu d'en créer une nouvelle.
   */
  bindToProspectId?: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function PreviewActions({ placeId, placeName, bindToProspectId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [existing, setExisting] = useState<ExistingProspect | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setExisting(undefined)
    setError(null)
    // En mode bind, on exclut le prospect courant du check (sinon il
    // apparaîtrait comme "doublon de lui-même" si on a déjà essayé).
    checkExistingProspectAction(placeId, bindToProspectId).then((r) => {
      if (cancelled) return
      if (r.success) setExisting(r.data)
      else setError(r.error)
    })
    return () => {
      cancelled = true
    }
  }, [placeId, bindToProspectId])

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      const r = await prepareCreateFromEnrichedAction(placeId)
      if (!r.success) {
        setError(r.error)
        return
      }
      if ('existing' in r.data) {
        setExisting(r.data.existing)
      }
    })
  }

  function handleUpdate() {
    if (!existing) return
    setError(null)
    if (!confirm(`Mettre à jour la fiche "${existing.nom_commerce}" avec les dernières données Google ?`)) {
      return
    }
    startTransition(async () => {
      const r = await updateProspectFromEnrichedAction(existing.id, placeId)
      if (!r.success) {
        setError(r.error)
        return
      }
      router.push(r.data.redirectTo)
      router.refresh()
    })
  }

  function handleBind() {
    if (!bindToProspectId) return
    setError(null)
    if (!confirm('Lier cette fiche Google à votre prospect existant ? Les données Google remplaceront les champs vitrine (adresse, téléphone, site).')) {
      return
    }
    startTransition(async () => {
      const r = await bindProspectToGoogleAction(bindToProspectId, placeId)
      if (!r.success) {
        setError(r.error)
        return
      }
      if ('conflictWith' in r.data) {
        setError(
          `Ce lieu Google est déjà lié à "${r.data.conflictWith.nom_commerce}" (créé le ${formatDate(r.data.conflictWith.created_at)}). Liez à un autre lieu ou fusionnez les fiches manuellement.`
        )
        return
      }
      router.push(r.data.redirectTo)
      router.refresh()
    })
  }

  if (existing === undefined) {
    return (
      <div className="rounded-md border border-border bg-surface-soft p-4 font-body text-sm text-muted">
        Vérification de l&apos;existence dans le CRM…
      </div>
    )
  }

  // Mode "Lier à Google" : on est arrivés via le bouton "Lier à Google"
  // depuis une fiche existante. Le bouton principal est "Lier", pas "Créer".
  if (bindToProspectId) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
            {error}
          </div>
        )}
        {existing ? (
          <div className="rounded-md border border-orange-200 bg-orange-50 p-4">
            <p className="font-body text-sm text-orange-900">
              <strong>Conflit :</strong> ce lieu Google est déjà lié à un autre prospect dans
              votre CRM (<strong>{existing.nom_commerce}</strong>, créé le{' '}
              {formatDate(existing.created_at)}). Vous ne pouvez pas le lier deux fois.
            </p>
            <div className="mt-3">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => router.push(`/admin/crm/${existing.id}`)}
              >
                Voir la fiche existante
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="primary" size="md" onClick={handleBind} loading={pending}>
              Lier cette fiche Google à mon prospect
            </Button>
            <span className="font-body text-sm text-muted">
              Les données Google de {placeName} viendront enrichir votre fiche existante.
            </span>
          </div>
        )}
      </div>
    )
  }

  // Mode normal "Importer un prospect" : créer ou mettre à jour
  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
          {error}
        </div>
      )}

      {existing ? (
        <div className="rounded-md border border-orange-200 bg-orange-50 p-4">
          <p className="font-body text-sm text-orange-900">
            <strong>Ce prospect existe déjà</strong> dans votre CRM.
            <br />
            Fiche : <strong>{existing.nom_commerce}</strong>, créée le {formatDate(existing.created_at)}
            {existing.last_enriched_at
              ? `, dernier enrichissement le ${formatDate(existing.last_enriched_at)}.`
              : ', jamais enrichie.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="primary" size="md" onClick={handleUpdate} loading={pending}>
              Mettre à jour la fiche existante
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => router.push(`/admin/crm/${existing.id}`)}
            >
              Voir la fiche
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="primary" size="md" onClick={handleCreate} loading={pending}>
            Compléter et créer la fiche
          </Button>
          <span className="font-body text-sm text-muted">
            Vous arriverez sur le formulaire pré-rempli avec les données de {placeName}.
          </span>
        </div>
      )}
    </div>
  )
}
