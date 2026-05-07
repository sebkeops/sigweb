import { parseItalicMarkers } from '@/lib/maquette/render/parseItalicMarkers'
import { formatTelHref } from '@/lib/maquette/render/palette'
import { resolveInfos } from '@/lib/maquette/render/resolveInfos'
import type { Maquette, Prospect } from '@/types'
import styles from '../styles.module.css'

interface Props {
  maquette: Maquette
  prospect: Prospect
}

export default function CtaBanner({ maquette, prospect }: Props) {
  const resolved = resolveInfos(prospect, maquette.infos_overrides)
  const tel = formatTelHref(resolved.telephone)

  return (
    <section className={styles.ctaBanner}>
      <div className={styles.ctaInner}>
        {maquette.cta_banner_title && (
          <h2
            className={styles.ctaTitle}
            dangerouslySetInnerHTML={{ __html: parseItalicMarkers(maquette.cta_banner_title) }}
          />
        )}
        {maquette.cta_banner_text && (
          <p className={styles.ctaText}>{maquette.cta_banner_text}</p>
        )}
        <div className={styles.ctaActions}>
          {tel && (
            <a href={`tel:${tel}`} className={`${styles.btn} ${styles.btnPrimary}`}>
              <span>📞</span> {resolved.telephone}
            </a>
          )}
          <a href="#infos" className={`${styles.btn} ${styles.btnGhost}`}>
            Voir nos horaires
          </a>
        </div>
      </div>
    </section>
  )
}
