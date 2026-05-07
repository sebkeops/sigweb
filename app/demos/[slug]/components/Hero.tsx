import { parseItalicMarkers, stripItalicMarkers } from '@/lib/maquette/render/parseItalicMarkers'
import { resolvePhotoUrl } from '@/lib/maquette/render/resolvePhotoUrl'
import { buildHeroMeta } from '@/lib/maquette/render/heroMeta'
import { getMaquettePhoto } from '@/lib/maquette/photos'
import type { Maquette, Prospect } from '@/types'
import styles from '../styles.module.css'

interface Props {
  maquette: Maquette
  prospect: Prospect
}

export default function Hero({ maquette, prospect }: Props) {
  // Source de vérité Session 3.0+ : pool + assignations.
  // L'ancien champ `maquette.hero_photo_url` reste rempli en parallèle pour
  // compat mais on ne le lit plus côté rendu (cf. CLEANUP-TODO.md).
  const photoEntry = getMaquettePhoto(maquette, 'hero')
  const heroPhoto = resolvePhotoUrl(photoEntry?.reference ?? null, { width: 1200 })
  const meta = buildHeroMeta(maquette, prospect)

  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div>
          {maquette.hero_eyebrow && (
            <div className={styles.heroEyebrow}>{maquette.hero_eyebrow}</div>
          )}

          {maquette.hero_title && (
            <h1
              className={styles.heroTitle}
              dangerouslySetInnerHTML={{ __html: parseItalicMarkers(maquette.hero_title) }}
            />
          )}

          {maquette.hero_lead && (
            <p className={styles.heroLead}>{maquette.hero_lead}</p>
          )}

          <div className={styles.heroActions}>
            <a href="#univers" className={`${styles.btn} ${styles.btnPrimary}`}>
              Voir nos créations →
            </a>
            <a href="#infos" className={`${styles.btn} ${styles.btnGhost}`}>
              Nous trouver
            </a>
          </div>

          {meta.show && (
            <div className={`${styles.heroMeta} ${meta.items.length === 2 ? styles.cols2 : ''}`}>
              {meta.items.map((item, i) => (
                <div key={i} className={styles.metaItem}>
                  <span className={styles.metaValue}>{item.value}</span>
                  <span className={styles.metaLabel}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.heroVisual}>
          {heroPhoto
            ? <img
                className={styles.heroImage}
                src={heroPhoto}
                alt={`${stripItalicMarkers(prospect.nom_commerce)} — photo principale`}
              />
            : <div className={styles.heroImageFallback} />
          }
          {maquette.hero_quote && (
            <div className={styles.heroQuote}>
              « {maquette.hero_quote} »
              {maquette.hero_quote_author && (
                <span className={styles.heroQuoteAuthor}>{maquette.hero_quote_author}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
