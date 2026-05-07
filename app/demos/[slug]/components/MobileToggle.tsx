'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from '../styles.module.css'

interface Props {
  /** Contenu du panneau mobile (mobileNav + footer). */
  children: ReactNode
  /**
   * Variables CSS de la palette (--cream, --ink, --primary…). DOIVENT être
   * passées explicitement : le panel est rendu via portail dans `document.body`,
   * donc HORS du `.demoRoot` qui porte ces vars sur la page principale.
   * Sans ça, `background: var(--cream)` serait vide et le panel transparent.
   */
  cssVars?: CSSProperties
}

/**
 * Burger + panneau mobile.
 *
 * IMPORTANT — pourquoi `createPortal` vers `document.body` :
 *   le `<header>` parent a `backdrop-filter: blur(12px)`, ce qui crée un
 *   containing block pour les enfants `position: fixed`. Sans portail,
 *   notre panel `inset: 0` serait CONTRAINT à la boîte du header (~70 px de
 *   haut) au lieu de couvrir tout le viewport. On extrait donc le panel
 *   du flow du header en le rendant dans `document.body`.
 *
 * Côté SSR : on n'instancie le portail qu'après mount client (sinon mismatch
 * d'hydratation), c'est pourquoi l'état `mounted`.
 *
 * Fermeture :
 *   - clic sur ×
 *   - clic sur tout `<a data-mobile-link>` (event delegation sur l'aside)
 *   - touche Échap
 *
 * Verrouille le scroll de la page tant que le panneau est ouvert.
 */
export default function MobileToggle({ children, cssVars }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  function handlePanelClick(e: React.MouseEvent<HTMLElement>) {
    const target = e.target as HTMLElement
    if (target.closest('a[data-mobile-link]')) setOpen(false)
  }

  const panel = (
    <aside
      className={`${styles.mobilePanel} ${open ? styles.open : ''}`}
      aria-hidden={!open}
      onClick={handlePanelClick}
      style={cssVars}
    >
      <button
        type="button"
        aria-label="Fermer le menu"
        onClick={(e) => { e.stopPropagation(); setOpen(false) }}
        className={styles.mobilePanelClose}
      >
        ×
      </button>
      {children}
    </aside>
  )

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={`${styles.burger} ${open ? styles.open : ''}`}
      >
        <span /><span /><span />
      </button>

      {mounted && createPortal(panel, document.body)}
    </>
  )
}
