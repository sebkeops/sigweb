import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Simulateur from '@/components/simulateur/Simulateur'

export const metadata: Metadata = {
  title: 'Estimez votre projet de site internet',
  description:
    'Obtenez une première estimation de votre projet de site internet en 2 minutes. Quelques questions simples, un résultat clair et sans engagement.',
  openGraph: {
    title: 'Estimez votre projet en 2 minutes — SIGWEB',
    description:
      'Quelques questions simples pour obtenir une estimation claire de votre site internet. Sans engagement.',
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sigweb.fr'}/simulateur`,
  },
  robots: { index: true, follow: true },
}

export default function SimulateurPage() {
  return (
    <>
      <Header />
      <main>
        {/* Intro SEO visible (pour les moteurs) */}
        <div className="border-b border-border bg-surface px-6 py-8 md:px-12">
          <div className="mx-auto max-w-2xl">
            <p className="font-body text-sm text-muted">
              Créez votre site internet avec SIGWEB · Toulouse – Gers – Occitanie
            </p>
          </div>
        </div>

        <Simulateur />
      </main>
      <Footer />
    </>
  )
}
