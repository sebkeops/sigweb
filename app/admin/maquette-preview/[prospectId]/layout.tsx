import type { ReactNode } from 'react'
import { Fraunces, Manrope } from 'next/font/google'

/**
 * Layout dédié à la preview admin d'une maquette (consommé par l'iframe de
 * l'éditeur). Charge les mêmes fonts que `/demos/[slug]` pour que le rendu
 * soit visuellement identique.
 *
 * Cette route est HORS de `(protected)` à dessein : on évite la barre admin
 * (header avec navigation) qui briserait l'illusion d'aperçu pleine page.
 * L'auth est faite manuellement dans la page (sinon notFound).
 */

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  weight: ['300', '400', '500', '600', '700'],
})
const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata = {
  robots: { index: false, follow: false },
}

export default function MaquettePreviewLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${fraunces.variable} ${manrope.variable}`}>
      {children}
    </div>
  )
}
