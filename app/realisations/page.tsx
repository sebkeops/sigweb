import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/sections/ProjectCard'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/types'

export const metadata: Metadata = {
  title: 'Nos réalisations',
  description:
    'Découvrez les sites web que nous avons créés pour des commerces et artisans locaux. Des réalisations concrètes, simples et efficaces.',
}

async function getRealisations(): Promise<Project[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('published', true)
    .eq('project_kind', 'realisation')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function RealisationsPage() {
  const projects = await getRealisations()

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="section-pad bg-bg">
          <div className="container-narrow">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 font-body text-sm font-semibold text-primary-dark">
              Ce qu&apos;on a déjà fait
            </span>
            <h1 className="mb-4 font-heading text-4xl font-extrabold text-ink md:text-5xl">
              Réalisations
            </h1>
            <p className="font-body text-lg leading-relaxed text-muted">
              Des sites livrés, utilisés chaque jour par des commerçants et artisans. Chaque
              réalisation est unique, adaptée à l&apos;activité et aux besoins du client.
            </p>
          </div>
        </section>

        {/* Grille */}
        <section className="section-pad bg-surface pt-0">
          <div className="container-wide">
            {projects.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-border bg-surface-soft py-20 text-center">
                <p className="font-body text-base text-muted">
                  Les réalisations arrivent bientôt. Revenez nous voir !
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
