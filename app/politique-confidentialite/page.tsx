import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  robots: { index: true, follow: true },
}

export default function PolitiqueConfidentialitePage() {
  return (
    <>
      <Header />
      <main className="section-pad">
        <div className="container-narrow">
          <h1 className="mb-10 font-heading text-3xl font-extrabold text-ink">
            Politique de confidentialité
          </h1>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">
              Responsable du traitement
            </h2>
            <p className="font-body text-sm leading-relaxed text-text">
              {/* TODO: Remplacer par vos vraies informations */}
              [Votre nom et prénom] — SIGWEB<br />
              Email : [contact@sigweb.fr — à compléter]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">
              Données collectées
            </h2>
            <p className="font-body text-sm leading-relaxed text-text">
              Via le formulaire de contact, nous collectons :
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 font-body text-sm text-text">
              <li>Nom et prénom</li>
              <li>Nom du commerce (optionnel)</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone (optionnel)</li>
              <li>Type d&apos;activité (optionnel)</li>
              <li>Contenu de votre message</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">
              Finalités du traitement
            </h2>
            <p className="font-body text-sm leading-relaxed text-text">
              Ces données sont collectées uniquement pour répondre à vos demandes de contact et
              vous accompagner dans votre projet de création de site internet.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">
              Durée de conservation
            </h2>
            <p className="font-body text-sm leading-relaxed text-text">
              Vos données sont conservées pendant une durée maximale de 3 ans à compter de notre
              dernier échange, puis supprimées.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">
              Partage des données
            </h2>
            <p className="font-body text-sm leading-relaxed text-text">
              Vos données ne sont jamais vendues ni cédées à des tiers à des fins commerciales.
              Elles sont hébergées via Supabase (infrastructure sécurisée) et accessibles uniquement
              par le responsable du traitement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">
              Vos droits
            </h2>
            <p className="font-body text-sm leading-relaxed text-text">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 font-body text-sm text-text">
              <li>Droit d&apos;accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l&apos;effacement (« droit à l&apos;oubli »)</li>
              <li>Droit à la limitation du traitement</li>
              <li>Droit d&apos;opposition</li>
            </ul>
            <p className="mt-3 font-body text-sm leading-relaxed text-text">
              Pour exercer ces droits, contactez-nous à :{' '}
              {/* TODO: Remplacer par votre vraie adresse email */}
              <a href="mailto:contact@sigweb.fr" className="text-primary hover:underline">
                contact@sigweb.fr
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">
              Réclamation
            </h2>
            <p className="font-body text-sm leading-relaxed text-text">
              En cas de réclamation, vous pouvez contacter la CNIL :{' '}
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                cnil.fr
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
