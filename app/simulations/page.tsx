import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/sections/ProjectCard'
import PageHero from '@/components/ui/PageHero'
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
        <PageHero
          label="Avant de vous décider"
          title="Simulations"
          description="Pas encore prêt à vous lancer ? Voici des exemples concrets de ce que votre site pourrait ressembler, avant tout engagement."
          imageUrl="https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1600&q=80"
          imageAlt="Création de site web sur ordinateur"
        />

        {/* Grille */}
        <section className="section-pad bg-surface">
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
