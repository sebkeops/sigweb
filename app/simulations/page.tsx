import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageHero from '@/components/ui/PageHero'
import { LinkButton } from '@/components/ui/Button'
import SimulationsGallery from '@/components/simulations/SimulationsGallery'
import { getAllPublishedSimulationsForList } from '@/lib/data/simulations/db'

export const metadata: Metadata = {
  title: 'Exemples de sites internet pour commerces locaux et artisans',
  description:
    'Découvrez des exemples concrets de sites internet pour boulangeries, boucheries, pizzerias, coiffeurs et artisans. Visualisez ce que je peux créer pour votre commerce, entre Toulouse et le Gers.',
}

export default async function SimulationsPage() {
  const projects = await getAllPublishedSimulationsForList()

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

        {/* Grille + filtres famille (composant client — gère le filtrage et
            la sync URL ?famille=... sans round-trip serveur). Wrappé dans
            Suspense car SimulationsGallery utilise `useSearchParams()`, ce
            qui sinon bascule toute la page en CSR (Next.js 15). Le fallback
            est statique et identique au layout final pour éviter tout flash. */}
        <section className="section-pad bg-surface">
          <div className="container-wide">
            <Suspense
              fallback={
                <div className="rounded-md border border-border bg-surface-soft py-20 text-center">
                  <p className="font-body text-base text-muted">Chargement…</p>
                </div>
              }
            >
              <SimulationsGallery simulations={projects} />
            </Suspense>
          </div>
        </section>

        {/* CTA conversion */}
        <section className="section-pad bg-primary">
          <div className="container-narrow text-center">
            <h2 className="mb-4 font-heading text-2xl font-extrabold text-white md:text-3xl">
              Une de ces simulations vous correspond ?
            </h2>
            <p className="mb-8 font-body text-base text-primary-soft">
              Estimez votre projet en 2 minutes ou parlez-moi directement de votre activité.
              Sans engagement.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <LinkButton href="/simulateur" variant="cta" size="lg">
                Estimer mon projet
              </LinkButton>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-sm border border-white/30 bg-transparent px-7 py-3.5 font-heading text-base font-bold text-white transition-colors hover:border-white/60 hover:bg-white/10"
              >
                Me contacter
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
