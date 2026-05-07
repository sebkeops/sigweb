import type { CSSProperties } from 'react'
import { stripItalicMarkers } from '@/lib/maquette/render/parseItalicMarkers'
import { resolvePhotoUrl } from '@/lib/maquette/render/resolvePhotoUrl'
import { formatTelHref } from '@/lib/maquette/render/palette'
import { resolveInfos } from '@/lib/maquette/render/resolveInfos'
import type { Maquette, Prospect } from '@/types'
import styles from '../styles.module.css'
import MobileToggle from './MobileToggle'

interface Props {
  maquette: Maquette
  prospect: Prospect
  brandTagline: string
  /** Propagé jusqu'au panel mobile (rendu via portail hors `.demoRoot`). */
  cssVars: CSSProperties
}

export default function Header({ maquette, prospect, brandTagline, cssVars }: Props) {
  const resolved = resolveInfos(prospect, maquette.infos_overrides)
  const tel = formatTelHref(resolved.telephone)
  const logoUrl = resolvePhotoUrl(maquette.logo_url, { width: 80 })
  const mapsUrl = resolved.adresseLine
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resolved.adresseLine)}`
    : null

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <MobileToggle cssVars={cssVars}>
            <nav className={styles.mobileNav}>
              <a href="#histoire" data-mobile-link>La maison</a>
              <a href="#univers" data-mobile-link>Nos créations</a>
              <a href="#avis" data-mobile-link>Avis</a>
              <a href="#infos" data-mobile-link>Nous trouver</a>
            </nav>
            <div className={styles.mobilePanelFooter}>
              {tel && (
                <a href={`tel:${tel}`} className={`${styles.btn} ${styles.btnPrimary}`}>
                  <span>📞</span> {resolved.telephone}
                </a>
              )}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.btn} ${styles.btnGhost}`}
                >
                  <span>📍</span> Itinéraire
                </a>
              )}
            </div>
          </MobileToggle>

          <a href="#" className={styles.brand}>
            <div className={styles.brandMark}>
              {logoUrl
                ? <img src={logoUrl} alt={`Logo ${stripItalicMarkers(prospect.nom_commerce)}`} />
                : (maquette.logo_initial ?? '')}
            </div>
            <div>
              <div className={styles.brandName}>{stripItalicMarkers(prospect.nom_commerce)}</div>
              <div className={styles.brandTagline}>{brandTagline}</div>
            </div>
          </a>

          <nav className={styles.nav}>
            <a href="#histoire">La maison</a>
            <a href="#univers">Nos créations</a>
            <a href="#avis">Avis</a>
            <a href="#infos">Nous trouver</a>
          </nav>

          {tel ? (
            <a href={`tel:${tel}`} className={styles.ctaTel}>
              <span>📞</span> {resolved.telephone}
            </a>
          ) : (
            <span className={styles.headerSpacer} />
          )}
          <span className={styles.headerSpacer} />
        </div>
      </header>

      {tel && (
        <div className={styles.stickyCta}>
          <a href={`tel:${tel}`}>
            <span>📞</span> Appeler
          </a>
        </div>
      )}
    </>
  )
}
