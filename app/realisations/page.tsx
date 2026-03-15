import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ProjectCard from '@/components/sections/ProjectCard'
import PageHero from '@/components/ui/PageHero'
import { LinkButton } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/types'

export const metadata: Metadata = {
  title: 'Sites internet réalisés pour artisans et commerces locaux',
  description:
    "Découvrez les sites internet que j'ai créés pour des artisans, indépendants et commerces locaux entre Toulouse et le Gers. Des réalisations concrètes, simples et efficaces.",
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
          label="Ce que j’ai déjà réalisé"
          title="Réalisations"
          description="Voici quelques sites que j’ai créés pour des artisans et des indépendants. Chaque projet est différent, mais l’objectif reste le même : un site clair, simple et utile pour leurs clients."
          imageUrl="/images/hero-realisations.webp"
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

        {/* CTA conversion */}
        <section className="section-pad bg-primary">
          <div className="container-narrow text-center">
            <h2 className="mb-4 font-heading text-2xl font-extrabold text-white md:text-3xl">
              Vous avez un projet de site internet ?
            </h2>
            <p className="mb-8 font-body text-base text-white/80">
              Je crée des sites simples et efficaces pour les artisans et commerçants locaux.
              Contactez-moi pour en discuter, sans engagement.
            </p>
            <LinkButton href="/contact" variant="cta" size="lg">
              Me contacter
            </LinkButton>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
