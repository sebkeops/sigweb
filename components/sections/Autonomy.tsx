import AnimateIn from '@/components/ui/AnimateIn'

const editableItems = [
  "Vos horaires d'ouverture",
  "Vos photos de produits ou de vitrine",
  "Vos services et prestations",
  "Vos actualités et promotions",
  "Vos informations pratiques",
]

export default function Autonomy() {
  return (
    <section className="section-pad bg-surface">
      <div className="container-wide">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Illustration espace de gestion */}
          <AnimateIn delay={100} className="order-2 lg:order-1">
            <div className="rounded-lg border border-border bg-bg p-8 shadow-sm">
              <p className="mb-6 font-body text-xs font-semibold uppercase tracking-widest text-primary">
                Votre espace de gestion
              </p>
              <div className="space-y-3">
                {editableItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft font-body text-xs font-bold text-primary">
                      ✓
                    </span>
                    <span className="font-body text-sm text-ink">{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center font-body text-xs text-muted">
                Modifiable à tout moment, depuis votre téléphone ou ordinateur.
              </p>
            </div>
          </AnimateIn>

          {/* Texte */}
          <AnimateIn className="order-1 lg:order-2">
            <span className="mb-4 inline-block font-body text-sm font-semibold uppercase tracking-widest text-accent">
              Votre autonomie
            </span>
            <h2 className="mb-6 font-heading text-3xl font-extrabold text-ink md:text-4xl">
              Votre site,{' '}
              <span className="text-primary">vous en gardez la main</span>
            </h2>
            <p className="mb-5 font-body text-base leading-relaxed text-muted">
              Sur certains projets, je crée un espace simple qui vous permet de modifier
              vous-même le contenu de votre site — sans aucune compétence technique.
            </p>
            <p className="font-body text-base leading-relaxed text-muted">
              Vous changez vos horaires, publiez une photo, mettez à jour vos services. Pas
              besoin de m&apos;appeler pour chaque petit changement. La plupart de mes clients
              sont autonomes en moins d&apos;une heure.
            </p>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}
