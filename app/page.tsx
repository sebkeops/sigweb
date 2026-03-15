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
import AnimateIn from '@/components/ui/AnimateIn'
import { LinkButton } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/types'

export const metadata: Metadata = {
  title: {
    absolute:
      'SIGWEB | Création de sites internet pour commerces locaux, artisans et indépendants',
  },
  description:
    'Je crée des sites internet simples, beaux et faciles à gérer pour les boulangeries, boucheries, pizzerias, coiffeurs et artisans. Entre Toulouse et le Gers, en Occitanie.',
  openGraph: {
    title: 'SIGWEB | Création de sites internet pour commerces locaux, artisans et indépendants',
    description:
      'Je crée des sites internet simples, beaux et faciles à gérer pour les boulangeries, boucheries, pizzerias, coiffeurs et artisans. Entre Toulouse et le Gers, en Occitanie.',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sigweb.fr',
    images: [{ url: '/images/hero-home.webp', width: 1200, height: 630 }],
  },
}

const simulationPlaceholders = [
  {
    emoji: '🥖',
    label: 'Boulangerie artisanale',
    color: 'bg-amber-50',
    accent: 'bg-amber-200',
  },
  {
    emoji: '✂️',
    label: 'Salon de coiffure',
    color: 'bg-emerald-50',
    accent: 'bg-emerald-200',
  },
  {
    emoji: '🍽️',
    label: 'Restaurant de quartier',
    color: 'bg-orange-50',
    accent: 'bg-orange-200',
  },
]

async function getFeaturedSimulations(): Promise<Project[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('published', true)
    .eq('project_kind', 'simulation')
    .eq('featured_home', true)
    .order('created_at', { ascending: false })
    .limit(3)
  return data ?? []
}

async function getFeaturedRealisations(): Promise<Project[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('published', true)
    .eq('project_kind', 'realisation')
    .eq('featured_home', true)
    .order('created_at', { ascending: false })
    .limit(3)
  return data ?? []
}

export default async function HomePage() {
  const [simulations, realisations] = await Promise.all([
    getFeaturedSimulations(),
    getFeaturedRealisations(),
  ])

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
            <AnimateIn>
              <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <span className="mb-2 inline-block font-body text-sm font-semibold uppercase tracking-widest text-accent">
                    Exemples concrets
                  </span>
                  <h2 className="font-heading text-3xl font-extrabold text-ink md:text-4xl">
                    Exemples de sites pour des commerces comme le vôtre
                  </h2>
                  <p className="mt-2 font-body text-base text-muted">
                    Chaque exemple est une simulation réaliste. Si l&apos;un d&apos;eux vous plaît,
                    il peut devenir votre site.
                  </p>
                </div>
                <LinkButton href="/simulations" variant="secondary" size="md">
                  Toutes les simulations
                </LinkButton>
              </div>
            </AnimateIn>

            {simulations.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-6">
                {simulations.map((project, i) => (
                  <div key={project.id} className="flex w-full flex-col sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                    <AnimateIn delay={i * 100} className="flex flex-1 flex-col">
                      <ProjectCard project={project} />
                    </AnimateIn>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-6">
                {simulationPlaceholders.map((p, i) => (
                  <div key={p.label} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                    <AnimateIn delay={i * 100}>
                      <div className="flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-card">
                        <div className={`flex items-center justify-center ${p.color} py-10 text-5xl`}>
                          {p.emoji}
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <p className="mb-4 font-heading text-base font-bold text-ink">{p.label}</p>
                          <div className="mb-3 space-y-2">
                            <div className={`h-2.5 w-full rounded-full ${p.accent} opacity-60`} />
                            <div className={`h-2.5 w-4/5 rounded-full ${p.accent} opacity-40`} />
                            <div className={`h-2.5 w-2/3 rounded-full ${p.accent} opacity-30`} />
                          </div>
                          <p className="mb-5 font-body text-xs text-muted">
                            Simulation en cours de préparation.
                          </p>
                          <a
                            href="/contact"
                            className="mt-auto font-body text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-dark"
                          >
                            Demander cette simulation →
                          </a>
                        </div>
                      </div>
                    </AnimateIn>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Réalisations — visible uniquement si projets existants */}
        {realisations.length > 0 && (
          <section className="section-pad bg-surface">
            <div className="container-wide">
              <AnimateIn>
                <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <span className="mb-2 inline-block font-body text-sm font-semibold uppercase tracking-widest text-primary">
                      Déjà réalisé
                    </span>
                    <h2 className="font-heading text-3xl font-extrabold text-ink md:text-4xl">
                      Des sites déjà réalisés
                    </h2>
                    <p className="mt-2 font-body text-base text-muted">
                      Quelques exemples de sites créés pour des projets réels.
                    </p>
                  </div>
                  <LinkButton href="/realisations" variant="secondary" size="md">
                    Toutes les réalisations
                  </LinkButton>
                </div>
              </AnimateIn>

              <div className="flex flex-wrap justify-center gap-6">
                {realisations.map((project, i) => (
                  <div key={project.id} className="flex w-full flex-col sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
                    <AnimateIn delay={i * 100} className="flex flex-1 flex-col">
                      <ProjectCard project={project} />
                    </AnimateIn>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <Method />
        <Trust />

        {/* CTA final */}
        <AnimateIn>
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
        </AnimateIn>
      </main>
      <Footer />
    </>
  )
}
