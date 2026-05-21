'use client'

import { useEffect, useRef, useState } from 'react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  /** Bord depuis lequel le panneau glisse. `left` pour la nav, `bottom` pour les filtres. */
  side?: 'left' | 'bottom'
  title: string
  children: React.ReactNode
}

const SIDE = {
  left: {
    panel: 'inset-y-0 left-0 h-full w-[82%] max-w-xs',
    hidden: '-translate-x-full',
  },
  bottom: {
    panel: 'inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-lg',
    hidden: 'translate-y-full',
  },
}

/**
 * Panneau coulissant générique, mutualisé par la nav mobile et le drawer de
 * filtres. Glisse depuis la gauche (`side="left"`) ou le bas (`side="bottom"`).
 *
 * Comportement : overlay assombri, fermeture au clic overlay / touche Échap /
 * bouton ×, verrou du scroll de fond, focus initial sur le bouton de fermeture.
 * Le démontage est différé de 200 ms pour laisser jouer l'animation de sortie.
 *
 * Composant purement mobile : les écrans qui l'utilisent le rendent sous une
 * condition `lg:hidden` / état local — il n'a aucun effet en desktop.
 */
export function Drawer({ open, onClose, side = 'left', title, children }: DrawerProps) {
  // `mounted` garde le DOM présent le temps de l'animation de sortie.
  const [mounted, setMounted] = useState(open)
  // `shown` pilote la translation (false = panneau hors écran).
  const [shown, setShown] = useState(false)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  // Ref sur onClose : garde les effets stables même si le parent passe une
  // closure inline (sinon re-souscription / vol de focus à chaque rendu).
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Montage immédiat à l'ouverture ; démontage différé à la fermeture.
  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    setShown(false)
    const id = setTimeout(() => setMounted(false), 200)
    return () => clearTimeout(id)
  }, [open])

  // Panneau monté hors écran → déclenche le slide-in au frame suivant.
  useEffect(() => {
    if (!mounted || !open) return
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [mounted, open])

  // Échap + verrou du scroll de fond + focus initial, tant que le drawer existe.
  useEffect(() => {
    if (!mounted) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handler)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = prevOverflow
    }
  }, [mounted])

  if (!mounted) return null

  const conf = SIDE[side]

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50">
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          shown ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`absolute flex flex-col bg-surface shadow-card transition-transform duration-200 ease-out ${conf.panel} ${
          shown ? '' : conf.hidden
        }`}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-2 flex h-11 w-11 items-center justify-center font-body text-3xl leading-none text-muted hover:text-ink"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
