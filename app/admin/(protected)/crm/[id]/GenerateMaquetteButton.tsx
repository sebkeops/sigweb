'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { createMaquetteFromProspect } from '@/lib/actions/maquette'
import { isCategorieSupported } from '@/lib/maquette'
import type { ProspectCategorie } from '@/types'

interface Props {
  prospectId: string
  categorie: ProspectCategorie
  /** Présence d'une maquette déjà liée à ce prospect (1:1 en V1). */
  existingMaquette: { id: string; slug: string; published: boolean } | null
}

export default function GenerateMaquetteButton({
  prospectId,
  categorie,
  existingMaquette,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const supported = isCategorieSupported(categorie)

  // Cas 1 : maquette déjà existante → on bascule en mode "Ouvrir l'éditeur".
  // L'éditeur arrive en Session 3, mais la route est posée dès maintenant.
  if (existingMaquette) {
    return (
      <div className="flex flex-col items-end gap-2 max-lg:items-stretch">
        <Link
          href={`/admin/crm/${prospectId}/maquette`}
          className="inline-flex items-center justify-center rounded-md border border-primary bg-primary px-3 py-2 font-body text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark max-lg:min-h-[44px] max-lg:w-full"
        >
          Ouvrir la maquette
        </Link>
        {existingMaquette.published && (
          <a
            href={`/demos/${existingMaquette.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-xs text-primary hover:underline"
          >
            Voir la page publiée ↗
          </a>
        )}
      </div>
    )
  }

  // Cas 2 : catégorie hors scope → bouton inactif + message clair.
  if (!supported) {
    return (
      <div className="flex flex-col items-end gap-1 max-lg:items-stretch">
        <Button type="button" variant="secondary" size="sm" disabled className="max-lg:min-h-[44px] max-lg:w-full">
          Générer maquette
        </Button>
        <span className="font-body text-xs text-muted">
          Génération non disponible pour cette catégorie pour le moment.
        </span>
      </div>
    )
  }

  // Cas 3 : on peut générer.
  function handleClick() {
    setError(null)
    startTransition(async () => {
      const r = await createMaquetteFromProspect(prospectId)
      if (!r.success) {
        setError(r.error)
        return
      }
      // L'éditeur n'est pas encore en place (Session 3) : on retourne
      // sur la fiche, dont les boutons basculeront en mode "Ouvrir".
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-2 max-lg:items-stretch">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleClick}
        loading={pending}
        className="max-lg:min-h-[44px] max-lg:w-full"
      >
        Générer maquette
      </Button>
      {error && (
        <span className="font-body text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}
