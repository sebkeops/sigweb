import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/sections/ProjectCard'
import PageHero from '@/components/ui/PageHero'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/types'

export const metadata: Metadata = {
  title: 'Exemples de sites internet pour commerces locaux et artisans',
  description:
    'Découvrez des exemples concrets de sites internet pour boulangeries, boucheries, pizzerias, coiffeurs et artisans. Visualisez ce que je peux créer pour votre commerce, entre Toulouse et le Gers.',
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
          description="Pas encore prêt à vous lancer ? Voici quelques exemples de sites que je pourrais créer pour un commerce comme le vôtre. Ces simulations permettent simplement de se projeter, sans engagement."
          imageUrl="/images/hero-simulations.webp"
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
