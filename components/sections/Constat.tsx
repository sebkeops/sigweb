import AnimateIn from '@/components/ui/AnimateIn'

const problems = [
  "Pas de site du tout — vos clients ne vous trouvent pas en ligne",
  "Un site créé il y a des années, peu lisible sur téléphone",
  "Seulement une page Facebook, difficile à mettre à jour",
  "Des horaires ou un numéro de téléphone introuvables",
  "Un site existant, mais personne ne sait comment le modifier",
]

export default function Constat() {
  return (
    <section className="section-pad bg-surface">
      <div className="container-wide">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Texte */}
          <AnimateIn>
            <span className="mb-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-accent">
              Un constat simple
            </span>
            <h2 className="mb-6 font-heading text-3xl font-extrabold text-ink md:text-4xl">
              Beaucoup de bons commerces restent invisibles en ligne
            </h2>
            <p className="font-body text-base leading-relaxed text-muted">
              Ce n&apos;est pas un manque de qualité. C&apos;est juste que la présence en ligne
              n&apos;a pas encore été traitée sérieusement. Et aujourd&apos;hui, ça fait vraiment
              la différence.
            </p>
          </AnimateIn>

          {/* Liste des problèmes */}
          <AnimateIn delay={150}>
            <ul className="space-y-3">
              {problems.map((problem) => (
                <li
                  key={problem}
                  className="flex items-start gap-4 rounded-md border border-border bg-bg p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent-soft font-body text-sm font-bold text-accent">
                    !
                  </span>
                  <span className="font-body text-sm leading-relaxed text-muted">{problem}</span>
                </li>
              ))}
            </ul>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}
