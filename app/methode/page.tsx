import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageHero from '@/components/ui/PageHero'
import { LinkButton } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Notre méthode',
  description:
    "Comment Sigweb crée votre site web : de l'écoute à la mise en ligne, en passant par la formation. Simple, transparent et adapté aux commerçants.",
}

const steps = [
  {
    num: '01',
    title: 'On écoute votre projet',
    description: [
      "Tout commence par un échange simple — en personne, par téléphone ou en visio. On vous écoute parler de votre commerce, de vos clients, de ce que vous voulez que les gens trouvent sur votre site.",
      "Pas de jargon, pas de présentation commerciale. Juste une conversation pour comprendre ce dont vous avez besoin.",
    ],
  },
  {
    num: '02',
    title: 'On crée votre site',
    description: [
      "On s'occupe de tout : le design, les textes, la structure, les photos. On vous présente des maquettes avant de commencer à coder.",
      "Vous validez à chaque étape. Si quelque chose ne vous convient pas, on ajuste. C'est votre site, pas le nôtre.",
    ],
  },
  {
    num: '03',
    title: 'On vous forme',
    description: [
      "Avant la mise en ligne, on passe du temps à vous expliquer comment fonctionne votre espace d'administration. Comment mettre à jour vos horaires, publier une actualité, changer une photo.",
      "C'est fait pour être simple. La plupart de nos clients sont autonomes en moins d'une heure.",
    ],
  },
  {
    num: '04',
    title: 'Votre site est en ligne',
    description: [
      "Votre site est mis en ligne, référencé, et prêt à accueillir vos clients. Vous avez la main sur vos contenus.",
      "On reste disponibles pour vous accompagner si besoin, faire des évolutions ou ajouter de nouvelles fonctionnalités.",
    ],
  },
]

const faq = [
  {
    q: 'Combien de temps ça prend ?',
    a: "Entre deux semaines et un mois selon la complexité du projet. On s'adapte à votre rythme.",
  },
  {
    q: 'Est-ce que je peux vraiment modifier moi-même ?',
    a: "Oui. C'est même l'un de nos engagements. Vous pouvez modifier vos horaires, vos actualités et vos photos sans faire appel à nous.",
  },
  {
    q: "Et si j'ai besoin d'aide après ?",
    a: "On reste disponibles. Pour des petites questions, par email ou téléphone. Pour des évolutions plus importantes, on établit un devis.",
  },
  {
    q: 'Mon commerce est-il trop petit ?',
    a: "Non. Nos sites sont justement pensés pour les petits commerces et artisans. Pas besoin d'une grande structure pour avoir un beau site.",
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
          description="Je crois qu'un bon site ça commence par une bonne écoute. Voici comment je travaille, de a à z."
          imageUrl="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1600&q=80"
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
              Parlez-nous de votre commerce. L&apos;échange est gratuit et sans engagement.
            </p>
            <LinkButton href="/contact" variant="cta" size="lg">
              Prendre contact
            </LinkButton>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
