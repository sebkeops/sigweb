'use client'

import { useEffect } from 'react'

/**
 * Mesure la hauteur réelle du document de la preview admin et la
 * communique au parent (PreviewPane de l'éditeur) via postMessage.
 *
 * Le parent ajuste alors la hauteur de l'iframe pour éliminer :
 *   - le scroll interne (mobile : 2 scrollbars sinon)
 *   - le vide en bas si la maquette est plus courte que l'iframe (desktop)
 *
 * Format message : { type: 'maquette-height', height: number }
 *
 * Mesure : ResizeObserver sur documentElement + 1 mesure initiale après
 * load complet (images, fonts) pour stabiliser la valeur.
 */
export default function PreviewHeightReporter() {
  useEffect(() => {
    let lastSent = 0
    const send = () => {
      const h = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      )
      // Évite de spam le parent si la valeur n'a pas significativement changé.
      if (Math.abs(h - lastSent) < 4) return
      lastSent = h
      window.parent.postMessage({ type: 'maquette-height', height: h }, '*')
    }

    // Première mesure (microtask)
    send()

    // Re-mesure après load complet (les images peuvent rallonger la page)
    const onLoad = () => send()
    window.addEventListener('load', onLoad)

    // Re-mesure sur ResizeObserver de la racine
    const ro = new ResizeObserver(() => send())
    ro.observe(document.documentElement)

    // Filet de sécurité : un poll léger pour les cas où l'image se charge
    // sans déclencher de resize (rare mais possible).
    const interval = setInterval(send, 1500)

    return () => {
      window.removeEventListener('load', onLoad)
      ro.disconnect()
      clearInterval(interval)
    }
  }, [])

  return null
}
