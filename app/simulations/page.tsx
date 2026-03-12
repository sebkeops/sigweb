import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/sections/ProjectCard'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/types'

export const metadata: Metadata = {
  title: 'Simulations de sites web',
  description:
    'Découvrez nos simulations de sites web pour boulangeries, artisans et commerces de proximité. Visualisez ce que votre site pourrait ressembler.',
}

async function getSimulations(): Promise<Project[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('published', true)
    .eq('project_kind', 'simulation')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function SimulationsPage() {
  const projects = await getSimulations()

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="section-pad bg-bg">
          <div className="container-narrow">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-1.5 font-body text-sm font-semibold text-accent">
              Avant de vous décider
            </span>
            <h1 className="mb-4 font-heading text-4xl font-extrabold text-ink md:text-5xl">
              Simulations
            </h1>
            <p className="font-body text-lg leading-relaxed text-muted">
              Pas encore prêt à vous lancer ? Voici des exemples concrets de ce que votre site
              pourrait ressembler. Ces simulations sont réalisées à partir de commerces réels ou
              fictifs pour illustrer nos capacités.
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
                  Les simulations arrivent bientôt. Revenez nous voir !
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
