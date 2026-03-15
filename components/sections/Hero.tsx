import Image from 'next/image'
import Link from 'next/link'
import { LinkButton } from '@/components/ui/Button'


export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Image de fond */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-home.webp"
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
                Toulouse – Gers – Occitanie
              </span>

              <h1 className="mb-5 font-heading text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
                Création de sites internet pour{' '}
                <span className="text-accent">commerces locaux</span>
                {', '}artisans et indépendants
              </h1>

              <p className="mb-8 font-body text-lg leading-relaxed text-white/80">
                Boulangeries, pizzerias, boucheries, coiffeurs, artisans&hellip; J&apos;accompagne les commerçants et indépendants entre Toulouse et le Gers pour créer leur site internet — simple, beau et facile à gérer.
              </p>

              <div className="flex flex-wrap justify-center gap-4 md:justify-start">
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

            {/* Chiffres clés */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { value: '2 semaines', label: 'Votre site peut être en ligne en quelques semaines.' },
                { value: '100% personnalisé', label: 'Chaque site est adapté à votre commerce et à vos besoins.' },
                { value: 'Gratuit', label: 'Je peux vous montrer une simulation avant tout engagement.' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg bg-white/10 px-6 py-5 backdrop-blur-sm"
                >
                  <p className="mb-1 font-heading text-2xl font-extrabold text-accent">
                    {item.value}
                  </p>
                  <p className="font-body text-sm text-white/80">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
