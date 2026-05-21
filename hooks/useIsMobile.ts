'use client'

import { useEffect, useState } from 'react'

/**
 * Renvoie `true` quand le viewport est en deçà du breakpoint `lg` de Tailwind
 * (< 1024px) — la frontière desktop / mobile du chantier responsive admin.
 *
 * Réservé aux comportements JS qui ne peuvent pas être traités en CSS pur
 * (ex : fermer automatiquement un drawer quand on repasse en desktop). Pour le
 * simple affichage conditionnel, préférer les classes Tailwind `lg:`.
 *
 * Rend `false` au premier rendu (SSR + hydratation) puis se synchronise au
 * montage — pas de mismatch d'hydratation.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)')
    const sync = () => setIsMobile(mql.matches)
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [])

  return isMobile
}
