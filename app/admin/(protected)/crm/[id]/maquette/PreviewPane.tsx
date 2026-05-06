'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './styles.module.css'
import { useEditor } from './editor/EditorContext'

interface Props {
  /** URL de la route preview admin (`/admin/maquette-preview/<prospectId>`). */
  previewUrl: string
}

type Viewport = 'desktop' | 'mobile'

// Largeur "logique" du viewport simulé en mode desktop. La maquette publique
// considère ≤ 800 px = mobile, donc on force 1280 px ici puis on scale en CSS
// pour faire tenir le rendu desktop fidèle dans la colonne preview (souvent
// ~700–800 px utiles).
const DESKTOP_LOGICAL_WIDTH = 1280
const MOBILE_LOGICAL_WIDTH = 390

// Hauteur initiale (avant que la preview ne nous communique sa hauteur réelle
// via postMessage). Volontairement large pour ne pas tronquer en attendant
// le 1er message — ajustée au load via PreviewHeightReporter dans la page
// preview admin.
const INITIAL_IFRAME_HEIGHT = 5000

/**
 * Panneau de preview live : iframe pointant vers la route preview admin.
 *
 * Toggle desktop / mobile :
 *   - desktop : iframe avec viewport logique 1280 px, scaled-down via CSS
 *     transform pour tenir dans la colonne preview tout en montrant le
 *     rendu desktop authentique (header complet, nav, sticky CTA off, etc.).
 *   - mobile  : iframe à 390 px, pas de scale.
 *
 * Refresh automatique : on lit `contentVersion` du contexte éditeur, qui
 * incrémente à chaque save réussi. La key React force le remount de l'iframe
 * → re-fetch de la route preview admin avec les données fraîches.
 */
export default function PreviewPane({ previewUrl }: Props) {
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const { contentVersion } = useEditor()

  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  // Hauteur réelle du contenu de l'iframe, communiquée via postMessage par
  // <PreviewHeightReporter />. On démarre sur une valeur prudente, ajustée
  // dès le load de l'iframe.
  const [contentHeight, setContentHeight] = useState(INITIAL_IFRAME_HEIGHT)

  useEffect(() => {
    if (viewport !== 'desktop') {
      setScale(1)
      return
    }
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const w = el.clientWidth
      const usable = Math.max(320, w - 24) // 24 px de respiration interne
      setScale(Math.min(1, usable / DESKTOP_LOGICAL_WIDTH))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewport])

  // Écoute des messages venus de l'iframe : on ajuste l'iframe height à
  // la hauteur réelle du contenu pour ne laisser ni vide ni scroll interne.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { type?: unknown; height?: unknown }
      if (data?.type !== 'maquette-height') return
      if (typeof data.height !== 'number' || !Number.isFinite(data.height)) return
      // Borne de sécurité : on accepte de 400 à 30 000 px.
      const h = Math.max(400, Math.min(30000, Math.round(data.height)))
      setContentHeight(h)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Reset à chaque remount d'iframe (changement de contentVersion) : on évite
  // de garder une hauteur stale entre 2 saves.
  useEffect(() => {
    setContentHeight(INITIAL_IFRAME_HEIGHT)
  }, [contentVersion])

  const logicalWidth = viewport === 'desktop' ? DESKTOP_LOGICAL_WIDTH : MOBILE_LOGICAL_WIDTH
  const iframeStyle: React.CSSProperties = viewport === 'desktop'
    ? {
        width: `${logicalWidth}px`,
        height: `${contentHeight}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }
    : { width: `${logicalWidth}px`, height: `${contentHeight}px` }

  // Wrapper height = hauteur réelle du contenu (scaled en mode desktop).
  // → pas de vide en bas, pas de scroll interne car iframe height = content.
  const wrapperStyle: React.CSSProperties = viewport === 'desktop'
    ? { height: `${Math.round(contentHeight * scale)}px`, minHeight: '500px' }
    : { height: `${contentHeight}px` }

  return (
    <div className={styles.previewPane}>
      <div className={styles.previewToolbar}>
        <div className={styles.previewToggle}>
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            aria-pressed={viewport === 'desktop'}
            className={viewport === 'desktop' ? styles.previewToggleActive : ''}
          >
            🖥 Desktop
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            aria-pressed={viewport === 'mobile'}
            className={viewport === 'mobile' ? styles.previewToggleActive : ''}
          >
            📱 Mobile
          </button>
        </div>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.previewOpen}
        >
          Ouvrir dans un nouvel onglet ↗
        </a>
      </div>
      <div
        ref={containerRef}
        className={styles.previewFrame}
        data-viewport={viewport}
      >
        <div
          className={styles.previewIframeWrapper}
          data-viewport={viewport}
          style={wrapperStyle}
        >
          <iframe
            key={contentVersion}
            src={previewUrl}
            title="Preview de la maquette"
            className={styles.previewIframe}
            style={iframeStyle}
          />
        </div>
      </div>
    </div>
  )
}
