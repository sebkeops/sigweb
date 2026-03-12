import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/sections/ProjectCard'
import PageHero from '@/components/ui/PageHero'
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
        <PageHero
          label="Ce qu'on a déjà fait"
          title="Réalisations"
          description="Des sites livrés, utilisés chaque jour par des commerçants et artisans. Chaque réalisation est unique, adaptée à l'activité et aux besoins du client."
          imageUrl="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
          imageAlt="Intérieur d'un commerce local"
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
