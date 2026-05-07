import { parseItalicMarkers } from '@/lib/maquette/render/parseItalicMarkers'
import { resolvePhotoUrl } from '@/lib/maquette/render/resolvePhotoUrl'
import { getMaquettePhoto } from '@/lib/maquette/photos'
import type { Maquette, MaquettePhotoSlot, MaquetteUniversItem } from '@/types'
import styles from '../styles.module.css'

interface Props {
  maquette: Maquette
  defaultItems: MaquetteUniversItem[]
  /** Titre de section, tiré du template (édition manuelle possible en Session 4). */
  sectionTitle: string
  /** Phrase d'intro sous le titre, idem. */
  sectionIntro: string
}

// Mapping 1:1 carte i (0-indexé) → slot `univers_${i+1}`.
const UNIVERS_SLOTS: readonly MaquettePhotoSlot[] = [
  'univers_1', 'univers_2', 'univers_3', 'univers_4', 'univers_5',
] as const

export default function Univers({ maquette, defaultItems, sectionTitle, sectionIntro }: Props) {
  const items = (maquette.univers_items ?? defaultItems).slice(0, 5)

  return (
    <section className={`${styles.section} ${styles.univers}`} id="univers">
      <div className={styles.sectionInner}>
        <div className={styles.universHeader}>
          <div>
            <div className={styles.sectionEyebrow}>Nos créations</div>
            <h2
              className={styles.sectionTitle}
              dangerouslySetInnerHTML={{ __html: parseItalicMarkers(sectionTitle) }}
            />
          </div>
          {sectionIntro && (
            <p className={styles.universIntro}>{sectionIntro}</p>
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.universGrid}>
            {items.map((item, i) => {
              const slot = UNIVERS_SLOTS[i]
              const entry = slot ? getMaquettePhoto(maquette, slot) : null
              const photoUrl = resolvePhotoUrl(entry?.reference ?? null, { width: 800 })
              const isLarge = i === 0
              return (
                <div
                  key={i}
                  className={`${styles.universCard} ${isLarge ? styles.universCardLarge : ''}`}
                >
                  <div className={styles.universImage}>
                    {photoUrl
                      ? <img src={photoUrl} alt={item.name} />
                      : <div className={styles.universImagePlaceholder} aria-hidden="true" />
                    }
                  </div>
                  <div className={styles.universContent}>
                    <div className={styles.universCat}>{item.cat}</div>
                    <h3 className={styles.universName}>{item.name}</h3>
                    <p className={styles.universDesc}>{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
