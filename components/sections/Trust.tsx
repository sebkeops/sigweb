import AnimateIn from '@/components/ui/AnimateIn'

const reasons = [
  {
    icon: '🤝',
    title: 'Je comprends les petits commerces',
    description:
      "Pas de discours technique. Je prends le temps de comprendre votre activité, vos clients et ce dont vous avez vraiment besoin.",
  },
  {
    icon: '🎯',
    title: 'Des solutions simples et efficaces',
    description:
      "Rien d'inutile. Un site clair, bien structuré, qui donne les bonnes informations au bon moment.",
  },
  {
    icon: '👤',
    title: 'Un interlocuteur unique',
    description:
      "C'est moi qui m'occupe de tout, du premier échange à la mise en ligne. Pas de prestataire intermédiaire, pas de chaîne de relais.",
  },
  {
    icon: '⚡',
    title: 'Mise en ligne rapide',
    description:
      "De la simulation au site en ligne en quelques semaines. Vous obtenez un résultat concret rapidement, sans attendre des mois.",
  },
]

export default function Trust() {
  return (
    <section className="section-pad bg-surface">
      <div className="container-narrow">
        <AnimateIn>
          <div className="mb-14 text-center">
            <span className="mb-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-accent">
              Pourquoi Sigweb ?
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-ink md:text-4xl">
              Un accompagnement humain et concret
            </h2>
            <p className="mt-4 font-body text-base text-muted">
              Je travaille avec des commerçants locaux. Je sais ce qui compte vraiment pour eux.
            </p>
          </div>
        </AnimateIn>

        <div className="grid gap-6 sm:grid-cols-2">
          {reasons.map((r, i) => (
            <AnimateIn key={r.title} delay={i * 80}>
              <div className="flex h-full items-center gap-5 rounded-md border border-border bg-bg p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-card">
                <div className="flex-shrink-0 text-3xl">{r.icon}</div>
                <div>
                  <h3 className="mb-2 font-heading text-lg font-bold text-ink">{r.title}</h3>
                  <p className="font-body text-sm leading-relaxed text-muted">{r.description}</p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}
