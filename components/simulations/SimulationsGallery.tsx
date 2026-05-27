'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Project } from '@/types'
import ProjectCard from '@/components/sections/ProjectCard'
import FamilyFilter from './FamilyFilter'
import {
  familySlugToKey,
  PUBLIC_FAMILY_OPTIONS,
  type PublicFamilyOption,
} from './family-config'

interface Props {
  /**
   * Toutes les simulations publiées chargées au mount par le Server Component
   * parent (`app/simulations/page.tsx`). Le filtrage est fait ici côté client
   * sur cette liste — pas de re-fetch BDD.
   */
  simulations: Project[]
}

/**
 * Orchestrateur client de la galerie `/simulations` : lit le filtre actif
 * depuis l'URL (`?famille=...`), affiche la barre de filtres et la grille
 * filtrée.
 *
 * Tout en client (pas de re-rendu Server Component à chaque changement de
 * filtre) — cf. brief Phase 4 : "filtrage côté client (les 34 simulations
 * sont chargées au mount, le filtre masque/montre)". L'URL reste mise à
 * jour via `router.push` pour le partage et la nav arrière.
 */
export default function SimulationsGallery({ simulations }: Props) {
  const searchParams = useSearchParams()
  const activeKey = familySlugToKey(searchParams.get('famille'))

  // Compteurs : nombre par famille + total — figés au mount (les simulations
  // ne changent pas pendant la session).
  const counts = useMemo(() => {
    const initial: Record<PublicFamilyOption['key'] | '__all', number> = {
      __all: simulations.length,
      bouche: 0,
      batiment: 0,
      services_personne: 0,
      commerces_services: 0,
      hebergement: 0,
    }
    for (const sim of simulations) {
      const fam = sim.category_family
      if (
        fam &&
        PUBLIC_FAMILY_OPTIONS.some((o) => o.key === fam)
      ) {
        initial[fam as PublicFamilyOption['key']]++
      }
      // Les simulations sans famille ou avec `autre` sont comptées dans
      // `__all` mais n'apparaissent dans aucune pilule métier.
    }
    return initial
  }, [simulations])

  const filtered = useMemo(() => {
    if (activeKey === null) return simulations
    return simulations.filter((s) => s.category_family === activeKey)
  }, [simulations, activeKey])

  return (
    <>
      <FamilyFilter activeKey={activeKey} counts={counts} />

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-border bg-surface-soft py-20 text-center">
          <p className="font-body text-base text-muted">
            {activeKey === null
              ? 'Les simulations arrivent bientôt. Revenez nous voir !'
              : 'Aucune simulation publiée dans cette famille pour le moment.'}
          </p>
        </div>
      )}
    </>
  )
}
