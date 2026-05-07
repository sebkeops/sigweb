import type { ReactNode } from 'react'
import { Fraunces, Manrope } from 'next/font/google'

/**
 * Fonts spécifiques aux pages de démo. Ne touchent PAS aux fonts du site
 * Sigweb (Nunito/Inter) car ce layout est imbriqué : il s'applique
 * uniquement à `/demos/*`. On les expose via CSS variables consommées
 * dans `styles.module.css`.
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

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${fraunces.variable} ${manrope.variable}`}>
      {children}
    </div>
  )
}
