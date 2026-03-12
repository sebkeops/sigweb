import Image from 'next/image'
import Link from 'next/link'
import { LinkButton } from '@/components/ui/Button'

const pills = [
  'Boulangeries',
  'Restaurants',
  'Artisans',
  'Coiffeurs',
  'Boucheries',
  'Commerces locaux',
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Image de fond */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1600&q=80"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        {/* Overlay chaud */}
        <div className="absolute inset-0 bg-ink/65" />
      </div>

      {/* Contenu */}
      <div className="relative z-10 section-pad">
        <div className="container-wide">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Texte */}
            <div>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-body text-sm font-semibold text-white/90 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Création de sites web · Toulouse
              </span>

              <h1 className="mb-5 font-heading text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
                Un bon commerce mérite{' '}
                <span className="text-accent">d&apos;être trouvé</span>{' '}
                facilement en ligne.
              </h1>

              <p className="mb-8 font-body text-lg leading-relaxed text-white/80">
                Je crée des sites simples et efficaces pour les commerces locaux.
              </p>

              <div className="flex flex-wrap gap-4">
                <LinkButton href="/simulations" variant="primary" size="lg">
                  Voir les simulations
                </LinkButton>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-sm border border-white/30 bg-transparent px-7 py-3.5 font-heading text-base font-bold text-white transition-colors hover:border-white/60 hover:bg-white/10"
                >
                  Demander un devis
                </Link>
              </div>
            </div>

            {/* Carte démo */}
            <div className="rounded-lg bg-surface p-6 shadow-card lg:p-8">
              <p className="mb-4 font-body text-xs font-semibold uppercase tracking-widest text-primary">
                Pensé pour votre activité
              </p>
              <div className="mb-8 flex flex-wrap gap-2">
                {pills.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-border bg-surface-soft px-4 py-2 font-body text-sm font-semibold text-ink"
                  >
                    {p}
                  </span>
                ))}
              </div>

              <div className="overflow-hidden rounded-md border border-border">
                <div className="bg-primary px-5 py-4">
                  <p className="font-heading text-lg font-bold text-white">Boulangerie Artisane</p>
                  <p className="font-body text-sm text-primary-soft">
                    Ouvert du mardi au dimanche · 7h–13h
                  </p>
                </div>
                <div className="bg-surface-soft p-5">
                  <div className="mb-2 flex items-center gap-2 font-body text-sm text-muted">
                    <span>📍</span>
                    <span>12 rue du Marché, Toulouse</span>
                  </div>
                  <div className="mb-4 flex items-center gap-2 font-body text-sm text-muted">
                    <span>📞</span>
                    <span>05 61 xx xx xx</span>
                  </div>
                  <div className="inline-block rounded-sm bg-cta px-4 py-2 font-body text-sm font-semibold text-white">
                    Commander en ligne
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
