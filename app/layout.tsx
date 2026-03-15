import type { Metadata } from 'next'
import { Nunito, Inter } from 'next/font/google'
import StickyContactBar from '@/components/ui/StickyContactBar'
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

// TODO: Renseigner NEXT_PUBLIC_SITE_URL=https://votre-domaine.fr sur Vercel avant mise en ligne
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sigweb.fr'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'SIGWEB',
    url: SITE_URL,
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
  url: SITE_URL,
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
      <head>
        <meta name="theme-color" content="#2f6f4f" />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:font-heading focus:text-sm focus:font-bold focus:text-white"
        >
          Aller au contenu
        </a>
        {children}
        <StickyContactBar />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {process.env.NODE_ENV === 'production' &&
          process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT && (
            <script
              defer
              data-domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN}
              src={process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT}
            />
          )}
      </body>
    </html>
  )
}
