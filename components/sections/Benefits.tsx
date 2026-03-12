const features = [
  {
    icon: '📱',
    title: 'Adapté au téléphone',
    description:
      "Votre site s'affiche parfaitement sur mobile. La majorité de vos clients naviguent depuis leur smartphone.",
  },
  {
    icon: '🕐',
    title: 'Horaires visibles rapidement',
    description:
      "Vos horaires d'ouverture sont affichés clairement, faciles à trouver, même depuis une recherche Google.",
  },
  {
    icon: '📞',
    title: 'Contact immédiat',
    description:
      'Un bouton pour vous appeler directement, un formulaire simple. Vos clients peuvent vous joindre en deux clics.',
  },
  {
    icon: '📸',
    title: 'Vos photos mises en valeur',
    description:
      'Vos produits, votre devanture, votre équipe. Les images donnent envie et rassurent avant la visite.',
  },
  {
    icon: '📍',
    title: 'Plan et adresse intégrés',
    description:
      "Une carte pour vous localiser directement sur votre site. Pas de recherche compliquée pour vous trouver.",
  },
  {
    icon: '✉️',
    title: 'Formulaire de contact simple',
    description:
      "Un formulaire clair et fonctionnel pour que vos clients puissent vous envoyer un message facilement.",
  },
]

export default function Benefits() {
  return (
    <section className="section-pad bg-bg">
      <div className="container-narrow">
        <div className="mb-14 text-center">
          <span className="mb-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-accent">
            Ce que contient votre site
          </span>
          <h2 className="font-heading text-3xl font-extrabold text-ink md:text-4xl">
            Tout ce qu&apos;il faut, rien de trop
          </h2>
          <p className="mt-4 font-body text-base text-muted">
            Des informations utiles, bien présentées. Vos clients trouvent ce qu&apos;ils cherchent
            en quelques secondes.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-md border border-border bg-surface p-7 shadow-sm"
            >
              <div className="mb-4 text-3xl">{f.icon}</div>
              <h3 className="mb-2 font-heading text-lg font-bold text-ink">{f.title}</h3>
              <p className="font-body text-sm leading-relaxed text-muted">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
