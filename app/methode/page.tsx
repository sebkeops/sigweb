import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageHero from '@/components/ui/PageHero'
import { LinkButton } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Ma méthode',
  description:
    "Comment je crée votre site internet : écoute, simulation, création et accompagnement. Une méthode simple et transparente pour artisans, commerçants et indépendants entre Toulouse et le Gers.",
}

const steps = [
  {
    num: '01',
    title: "J'écoute votre projet",
    description: [
      "On prend le temps d’échanger sur votre commerce : ce que vous faites, vos clients, et ce que vous voulez montrer sur votre site.",
      "Pas de jargon, pas de discours commercial. Juste une discussion simple pour comprendre votre besoin.",
    ],
  },
  {
    num: '02',
    title: 'Je crée votre site',
    description: [
      "Je m’occupe de tout : design, structure du site, textes et mise en page.",
      "Je vous présente des maquettes avant la mise en ligne pour que vous puissiez valider chaque étape.",
    ],
  },
  {
    num: '03',
    title: 'Je vous montre comment l’utiliser',
    description: [
      "Avant la mise en ligne, je vous explique comment gérer votre site.",
      "Modifier un horaire, ajouter une photo ou publier une actualité devient très simple.",
    ],
  },
  {
    num: '04',
    title: 'Votre site est en ligne',
    description: [
      "Votre site est prêt à accueillir vos clients.",
      "Vous restez libre de modifier vos contenus, et je reste disponible si vous avez besoin d’aide ou d’évolutions.",
    ],
  },
]

const faq = [
  {
    q: 'Combien de temps ça prend ?',
    a: "La plupart des sites sont réalisés en 2 à 4 semaines selon le projet.",
  },
  {
    q: 'Est-ce que je peux modifier mon site moi-même ?',
    a: "Oui. Vous pouvez modifier vos horaires, vos photos ou vos actualités facilement.",
  },
  {
    q: "Et si j’ai besoin d’aide après ?",
    a: "Je reste disponible. Pour de petites questions, un simple message suffit.",
  },
  {
    q: 'Mon commerce est-il trop petit ?',
    a: "Non. Je travaille principalement avec des petits commerces et des artisans.",
  },
]

export default function MethodePage() {
  return (
    <>
      <Header />
      <main>
        <PageHero
          label="Comment ça se passe"
          title="Ma méthode"
          description="Je travaille simplement. On échange sur votre commerce, je crée votre site, puis je vous montre comment le gérer facilement."
          imageUrl="/images/hero-methode.webp"
          imageAlt="Échange avec un commerçant"
        />

        {/* Étapes */}
        <section className="section-pad bg-surface">
          <div className="container-narrow">
            <div className="space-y-8">
              {steps.map((step) => (
                <div
                  key={step.num}
                  className="grid gap-6 rounded-md border border-border bg-surface-soft p-8 sm:grid-cols-[auto_1fr] sm:items-center"
                >
                  <div className="flex items-center justify-center sm:items-center sm:justify-start">
                    <span className="font-heading text-5xl font-extrabold text-primary-soft">
                      {step.num}
                    </span>
                  </div>
                  <div>
                    <h2 className="mb-4 font-heading text-2xl font-bold text-ink">
                      {step.title}
                    </h2>
                    <div className="space-y-3">
                      {step.description.map((p, j) => (
                        <p key={j} className="font-body text-base leading-relaxed text-muted">
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section-pad bg-bg">
          <div className="container-narrow">
            <h2 className="mb-10 font-heading text-3xl font-extrabold text-ink">
              Questions fréquentes
            </h2>
            <div className="space-y-5">
              {faq.map((item) => (
                <div key={item.q} className="rounded-md border border-border bg-surface p-6">
                  <h3 className="mb-2 font-heading text-lg font-bold text-ink">{item.q}</h3>
                  <p className="font-body text-sm leading-relaxed text-muted">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-pad bg-primary">
          <div className="container-narrow text-center">
            <h2 className="mb-4 font-heading text-3xl font-extrabold text-white">
              Prêt à lancer votre projet ?
            </h2>
            <p className="mb-8 font-body text-base text-primary-soft">
              Parlez-moi de votre commerce. L&apos;échange est gratuit et sans engagement.
            </p>
            <LinkButton href="/contact" variant="cta" size="lg">
              Me contacter
            </LinkButton>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
