import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/sections/Hero'
import Constat from '@/components/sections/Constat'
import Benefits from '@/components/sections/Benefits'
import LocalVisibility from '@/components/sections/LocalVisibility'
import Autonomy from '@/components/sections/Autonomy'
import Method from '@/components/sections/Method'
import Trust from '@/components/sections/Trust'
import ProjectCard from '@/components/sections/ProjectCard'
import { LinkButton } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/types'

export const metadata: Metadata = {
  title: 'Sigweb — Sites internet pour commerces et artisans locaux',
  description:
    "Je crée des sites internet simples, clairs et faciles à gérer pour les boulangeries, artisans, restaurants et commerces de proximité. Basé à Toulouse.",
}

async function getSimulations(): Promise<Project[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('published', true)
    .eq('project_kind', 'simulation')
    .order('created_at', { ascending: false })
    .limit(3)
  return data ?? []
}

export default async function HomePage() {
  const simulations = await getSimulations()

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Constat />
        <Benefits />
        <LocalVisibility />
        <Autonomy />

        {/* Simulations */}
        <section className="section-pad bg-bg">
          <div className="container-wide">
            <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <span className="mb-2 inline-block font-body text-sm font-semibold uppercase tracking-widest text-accent">
                  Exemples concrets
                </span>
                <h2 className="font-heading text-3xl font-extrabold text-ink md:text-4xl">
                  Voyez ce que ça peut donner
                </h2>
                <p className="mt-2 font-body text-base text-muted">
                  Des simulations réalisées pour différents types de commerces.
                </p>
              </div>
              <LinkButton href="/simulations" variant="secondary" size="md">
                Toutes les simulations
              </LinkButton>
            </div>

            {simulations.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {simulations.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-border bg-surface p-10 text-center">
                <p className="font-body text-base text-muted">
                  Les premières simulations arrivent bientôt.{' '}
                  <a
                    href="/contact"
                    className="font-semibold text-primary underline underline-offset-4 hover:text-primary-dark"
                  >
                    Demandez la vôtre →
                  </a>
                </p>
              </div>
            )}
          </div>
        </section>

        <Method />
        <Trust />

        {/* CTA final */}
        <section className="section-pad bg-primary">
          <div className="container-narrow text-center">
            <h2 className="mb-4 font-heading text-3xl font-extrabold text-white md:text-4xl">
              Votre commerce mérite d&apos;être visible
            </h2>
            <p className="mb-8 font-body text-base text-primary-soft">
              Parlez-moi de votre activité. Je vous prépare une simulation gratuite et sans
              engagement.
            </p>
            <LinkButton href="/contact" variant="cta" size="lg">
              Demander ma simulation gratuite
            </LinkButton>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
