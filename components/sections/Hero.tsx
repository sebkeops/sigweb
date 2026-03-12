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
    <section className="section-pad bg-bg">
      <div className="container-wide">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Texte */}
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 font-body text-sm font-semibold text-primary-dark">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Création de sites web · Toulouse
            </span>

            <h1 className="mb-5 font-heading text-4xl font-extrabold leading-tight text-ink md:text-5xl lg:text-6xl">
              Des sites internet{' '}
              <span className="text-primary">simples et efficaces</span>{' '}
              pour les commerces locaux
            </h1>

            <p className="mb-8 font-body text-lg leading-relaxed text-muted">
              Boulangeries, salons de coiffure, restaurants, artisans… Je crée des sites
              clairs, modernes et faciles à gérer pour améliorer votre visibilité locale.
            </p>

            <div className="flex flex-wrap gap-4">
              <LinkButton href="/simulations" variant="primary" size="lg">
                Voir les simulations
              </LinkButton>
              <LinkButton href="/contact" variant="ghost" size="lg">
                Demander un devis
              </LinkButton>
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
              {/* Mini-site simulé */}
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
    </section>
  )
}
