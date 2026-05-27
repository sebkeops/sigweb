import type { Metadata } from 'next'
import Link from 'next/link'
import ProjectForm from '@/components/admin/ProjectForm'
import SimulationGenerator from '@/components/admin/SimulationGenerator'
import { createProject } from '@/lib/actions/project'

export const metadata: Metadata = { title: 'Nouveau projet | Admin Sigweb' }

export default function NouveauProjetPage() {
  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/admin/projets"
          className="font-body text-sm text-muted hover:text-primary"
        >
          ← Projets
        </Link>
        <span className="text-muted">/</span>
        <h1 className="font-heading text-2xl font-extrabold text-ink">Nouveau projet</h1>
      </div>

      {/* Bloc génération automatique (simulations publiques) — au-dessus
          du formulaire de création manuelle, pour mettre en avant le flow
          rapide. Ne touche pas au flow manuel qui reste disponible pour
          les réalisations et les cas particuliers. */}
      <div className="max-w-3xl">
        <SimulationGenerator />

        <div className="rounded-lg bg-surface p-8 shadow-sm">
          <h2 className="mb-4 font-heading text-base font-bold text-ink">
            Ou créer manuellement
          </h2>
          <ProjectForm action={createProject} />
        </div>
      </div>
    </div>
  )
}
