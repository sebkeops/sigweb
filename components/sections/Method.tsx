import AnimateIn from '@/components/ui/AnimateIn'

const steps = [
  {
    num: '01',
    title: 'Une simulation pour commencer',
    description:
      "Avant de vous demander quoi que ce soit, je crée une simulation de site adaptée à votre commerce. Vous pouvez voir à quoi ça ressemblerait concrètement.",
  },
  {
    num: '02',
    title: 'Je vous présente le résultat',
    description:
      "Je vous envoie un lien ou un QR code pour consulter la simulation. On en discute ensemble, sans engagement. Vous posez vos questions, on ajuste.",
  },
  {
    num: '03',
    title: "On lance le vrai site si ça vous convient",
    description:
      "Si la simulation vous plaît, on démarre la réalisation du site. Je m'occupe de tout, vous suivez l'avancée à votre rythme.",
  },
]

export default function Method() {
  return (
    <section className="section-pad bg-bg" id="methode">
      <div className="container-narrow">
        <AnimateIn>
          <div className="mb-14 text-center">
            <span className="mb-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-accent">
              Comment ça se passe
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-ink md:text-4xl">
              Simple, concret, sans surprise
            </h2>
            <p className="mt-4 font-body text-base text-muted">
              Mon approche commence toujours par une simulation. Vous voyez le résultat avant de
              vous engager.
            </p>
          </div>
        </AnimateIn>

        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <AnimateIn key={step.num} delay={i * 100}>
              <div className="h-full rounded-md border border-border bg-surface p-7 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-card">
                <span className="mb-4 block font-heading text-4xl font-extrabold text-primary-soft">
                  {step.num}
                </span>
                <h3 className="mb-2 min-h-[3.5rem] font-heading text-lg font-bold text-ink">{step.title}</h3>
                <p className="font-body text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
            </AnimateIn>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="/methode"
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-dark"
          >
            En savoir plus sur ma méthode →
          </a>
        </div>
      </div>
    </section>
  )
}
