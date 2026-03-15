import AnimateIn from '@/components/ui/AnimateIn'

const points = [
  {
    title: 'Un site bien référencé localement',
    description:
      "Votre site est structuré pour que Google comprenne votre activité et votre localisation. Quand quelqu'un cherche près de chez vous, vous avez une chance d'apparaître.",
  },
  {
    title: 'Votre fiche Google Business',
    description:
      "J'optimise ou crée votre fiche Google pour que vos horaires, photos et coordonnées soient bien mis en avant dans les résultats de recherche.",
  },
  {
    title: 'Des informations claires et à jour',
    description:
      "Horaires, téléphone, adresse — tout est visible et facile à retrouver. Un client qui cherche un renseignement rapide le trouve en quelques secondes.",
  },
]

export default function LocalVisibility() {
  return (
    <section className="section-pad bg-primary">
      <div className="container-wide">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Texte */}
          <AnimateIn>
            <span className="mb-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-primary-soft">
              Visibilité locale
            </span>
            <h2 className="mb-6 font-heading text-3xl font-extrabold text-white md:text-4xl">
              Vos clients vous cherchent sur Google.{' '}
              <span className="text-accent-soft">Soyez présent au moment où ils en ont besoin.</span>
            </h2>
            <p className="font-body text-base leading-relaxed text-primary-soft">
              Chaque jour, des gens cherchent une boulangerie, un coiffeur ou un artisan près de
              chez eux. Un site bien construit vous permet d&apos;apparaître là où vos clients vous
              cherchent.
            </p>
          </AnimateIn>

          {/* Points */}
          <AnimateIn delay={150}>
            <div className="space-y-4">
              {points.map((item) => (
                <div key={item.title} className="rounded-md bg-white/10 p-5">
                  <h3 className="mb-2 font-heading text-base font-bold text-white">{item.title}</h3>
                  <p className="font-body text-sm leading-relaxed text-primary-soft">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}
