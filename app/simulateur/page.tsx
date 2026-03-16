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
      <main className="min-h-[calc(100vh-4rem)]">
        <Simulateur />
      </main>
      <Footer />
    </>
  )
}
