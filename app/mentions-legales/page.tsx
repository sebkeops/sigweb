import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Mentions légales',
  robots: { index: true, follow: true },
}

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <main className="section-pad">
        <div className="container-narrow">
          <h1 className="mb-10 font-heading text-3xl font-extrabold text-ink">Mentions légales</h1>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">Éditeur du site</h2>
            <p className="font-body text-sm leading-relaxed text-text">
              {/* TODO: Remplacer par vos vraies informations */}
              <strong>Nom : </strong>Sébastien SIGUENZA<br />
              <strong>Statut : </strong>Auto-entrepreneur<br />
              {/* <strong>SIRET :</strong> TODO<br /> */}
              <strong>Adresse : </strong>33 impasse de l'autan 32600 SEGOUFIELLE<br />
              <strong>Email : </strong>contact@sigweb.fr <br />
              <strong>Téléphone : </strong>06.51.92.73.81
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">Hébergeur</h2>
            <p className="font-body text-sm leading-relaxed text-text">
              <strong>Vercel Inc.</strong><br />
              440 N Barranca Ave #4133, Covina, CA 91723, USA<br />
              <a href="https://vercel.com" className="text-primary hover:underline">vercel.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">Propriété intellectuelle</h2>
            <p className="font-body text-sm leading-relaxed text-text">
              L&apos;ensemble du contenu de ce site (textes, images, graphismes, logos) est la propriété
              exclusive de SIGWEB, sauf mention contraire. Toute reproduction, même partielle, est
              interdite sans autorisation préalable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">Données personnelles</h2>
            <p className="font-body text-sm leading-relaxed text-text">
              Les données collectées via le formulaire de contact sont utilisées uniquement pour
              répondre à vos demandes. Elles ne sont pas cédées à des tiers.
              Pour exercer vos droits, consultez notre{' '}
              <a href="/politique-confidentialite" className="text-primary hover:underline">
                politique de confidentialité
              </a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold text-ink">Cookies</h2>
            <p className="font-body text-sm leading-relaxed text-text">
              Ce site utilise des outils d&apos;analyse d&apos;audience anonymisés (sans cookie de traçage
              personnel). Aucun cookie publicitaire n&apos;est déposé.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
