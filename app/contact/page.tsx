import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ContactForm from '@/components/sections/ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Parlez-moi de votre projet de site internet. Je vous réponds rapidement et vous prépare une simulation gratuite. J\'accompagne les artisans et commerçants entre Toulouse et le Gers.',
}

export default function ContactPage() {
  return (
    <>
      <Header />
      <main>
        <section className="section-pad bg-bg">
          <div className="container-wide">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr]">
              {/* Intro */}
              <div>
                <h1 className="mb-4 font-heading text-4xl font-extrabold text-ink md:text-5xl">
                  Parlons de votre projet
                </h1>
                <p className="mb-8 font-body text-lg leading-relaxed text-muted">
                  Remplissez ce formulaire et on je vous réponds sous 48h. Pas de pression, pas de
                  devis agressif. Juste un échange simple pour voir si je peux vous aider.
                </p>

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg">
                      📍
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold text-ink">Basé près de Toulouse</p>
                      <p className="font-body text-sm text-muted">
                        Je travaille avec des commerces et artisans de toute la région Occitanie.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg">
                      ⏱️
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold text-ink">Réponse sous 48h</p>
                      <p className="font-body text-sm text-muted">
                        Je prends le temps de lire chaque message et de répondre personnellement.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg">
                      💬
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold text-ink">Sans engagement</p>
                      <p className="font-body text-sm text-muted">
                        Notre premier échange est gratuit. Vous pourrez ensuite décider tranquillement si vous souhaitez aller plus loin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulaire */}
              <div className="rounded-lg bg-surface p-8 shadow-card">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
