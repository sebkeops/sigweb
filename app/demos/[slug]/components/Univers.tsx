import { parseItalicMarkers } from '@/lib/maquette/render/parseItalicMarkers'
import { resolvePhotoUrl } from '@/lib/maquette/render/resolvePhotoUrl'
import { getMaquettePhoto } from '@/lib/maquette/photos'
import type { Maquette, MaquettePhotoSlot, MaquetteUniversItem } from '@/types'
import styles from '../styles.module.css'

interface Props {
  maquette: Maquette
  defaultItems: MaquetteUniversItem[]
  /**
   * Suptitle par défaut depuis le template (fallback si la maquette n'a
   * pas encore de valeur persistée — cas avant migration BDD).
   */
  defaultSuptitle: string
  /** Titre par défaut depuis le template (markdown italique supporté). */
  defaultTitle: string
  /** Phrase d'intro par défaut depuis le template. */
  defaultIntro: string
}

// Mapping 1:1 carte i (0-indexé) → slot `univers_${i+1}`.
const UNIVERS_SLOTS: readonly MaquettePhotoSlot[] = [
  'univers_1', 'univers_2', 'univers_3', 'univers_4', 'univers_5',
] as const

export default function Univers({
  maquette,
  defaultItems,
  defaultSuptitle,
  defaultTitle,
  defaultIntro,
}: Props) {
  const items = (maquette.univers_items ?? defaultItems).slice(0, 5)

  // Les 3 champs de la section "Nos créations" sont éditables depuis
  // la généralisation Famille 2 → toutes catégories. La valeur de la
  // maquette prime ; on retombe sur le template uniquement si l'édit n'a
  // pas encore eu lieu (ou pour les anciennes maquettes pré-migration).
  const suptitle = maquette.univers_section_suptitle ?? defaultSuptitle
  const sectionTitle = maquette.univers_section_title ?? defaultTitle
  const sectionIntro = maquette.univers_section_intro ?? defaultIntro

  return (
    <section className={`${styles.section} ${styles.univers}`} id="univers">
      <div className={styles.sectionInner}>
        <div className={styles.universHeader}>
          <div>
            {suptitle && (
              <div className={styles.sectionEyebrow}>{suptitle}</div>
            )}
            {sectionTitle && (
              <h2
                className={styles.sectionTitle}
                dangerouslySetInnerHTML={{ __html: parseItalicMarkers(sectionTitle) }}
              />
            )}
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
