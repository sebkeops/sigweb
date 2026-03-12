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
  title: {
    default: 'Sigweb — Sites web pour commerces et artisans',
    template: '%s | Sigweb',
  },
  description:
    'Sigweb crée des sites simples, beaux et faciles à gérer pour les boulangeries, artisans et commerces de proximité. Basé à Toulouse.',
  keywords: [
    'création site web',
    'site artisan',
    'site boulangerie',
    'site commerce local',
    'Toulouse',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Sigweb',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${nunito.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
