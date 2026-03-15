import type { Metadata } from 'next'
import { Nunito, Inter } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://sigweb.fr'),
  title: {
    default: 'SIGWEB | Création de sites internet pour commerces locaux, artisans et indépendants',
    template: '%s | SIGWEB',
  },
  description:
    'Création de sites internet simples et efficaces pour artisans, indépendants et commerces locaux : boulangeries, boucheries, pizzerias, coiffeurs. Entre Toulouse et le Gers, en Occitanie.',
  keywords: [
    'création site internet',
    'site web artisan',
    'site boulangerie',
    'site pizzeria',
    'site boucherie',
    'site coiffeur',
    'site commerce local',
    'création site Toulouse',
    'création site Gers',
    'site internet Occitanie',
    'site web commerçant',
    'site web indépendant',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'SIGWEB',
    url: 'https://sigweb.fr',
    images: [
      {
        url: '/images/hero-home.webp',
        width: 1200,
        height: 630,
        alt: 'SIGWEB — Création de sites internet pour commerces locaux',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'SIGWEB',
  description:
    'Création de sites internet pour artisans, commerçants et indépendants entre Toulouse et le Gers, en Occitanie.',
  url: 'https://sigweb.fr',
  areaServed: [
    { '@type': 'City', name: 'Toulouse' },
    { '@type': 'AdministrativeArea', name: 'Gers' },
    { '@type': 'AdministrativeArea', name: 'Occitanie' },
  ],
  serviceType: 'Création de sites internet',
  knowsAbout: [
    'Sites internet pour boulangeries',
    'Sites internet pour boucheries',
    'Sites internet pour pizzerias',
    'Sites internet pour salons de coiffure',
    'Sites internet pour artisans',
    'Sites internet pour commerces locaux',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${nunito.variable} ${inter.variable}`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  )
}
