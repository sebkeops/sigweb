import { parseItalicMarkers, stripItalicMarkers } from '@/lib/maquette/render/parseItalicMarkers'
import { resolvePhotoUrl } from '@/lib/maquette/render/resolvePhotoUrl'
import { getMaquettePhoto } from '@/lib/maquette/photos'
import type { Maquette, MaquetteValeurItem, Prospect } from '@/types'
import styles from '../styles.module.css'

interface Props {
  maquette: Maquette
  prospect: Prospect
  defaultValeurs: MaquetteValeurItem[]
  /**
   * Suptitle de section par défaut depuis le template (fallback si
   * `maquette.histoire_suptitle` est NULL — cas pré-migration BDD).
   */
  defaultSuptitle: string
}

const VALUE_ICONS = ['◐', '◑', '◒', '◓']

export default function Histoire({ maquette, prospect, defaultValeurs, defaultSuptitle }: Props) {
  const photoEntry = getMaquettePhoto(maquette, 'histoire')
  const photo = resolvePhotoUrl(photoEntry?.reference ?? null, { width: 1000 })
  const valeurs = maquette.valeurs_items ?? defaultValeurs

  // Suptitle conditionné par catégorie (édition possible côté admin).
  const suptitle = maquette.histoire_suptitle ?? defaultSuptitle
  // Suffixe d'alt image : on dérive du suptitle en minuscules pour rester
  // cohérent avec le label de section (ex : "Maison X — le cabinet").
  const altSuffix = suptitle.toLowerCase()

  const currentYear = new Date().getFullYear()
  const yearsOfCraft = maquette.annee_creation
    ? Math.max(1, currentYear - maquette.annee_creation)
    : null

  return (
    <section className={`${styles.section} ${styles.histoire}`} id="histoire">
      <div className={styles.sectionInner}>
        <div className={styles.histoireGrid}>
          <div className={styles.histoireImage}>
            {photo
              ? <img
                  src={photo}
                  alt={`${stripItalicMarkers(prospect.nom_commerce)} — ${altSuffix}`}
                />
              : <div className={styles.histoireImageFallback} aria-hidden="true" />
            }
            {yearsOfCraft != null && (
              <div className={styles.histoireStat}>
                <span className={styles.histoireStatValue}>{yearsOfCraft}</span>
                <span className={styles.histoireStatLabel}>
                  {yearsOfCraft > 1 ? 'ans de savoir-faire' : 'an de savoir-faire'}
                </span>
              </div>
            )}
          </div>

          <div className={styles.histoireText}>
            <div className={styles.sectionEyebrow}>{suptitle}</div>
            {maquette.histoire_title && (
              <h2
                className={styles.sectionTitle}
                dangerouslySetInnerHTML={{ __html: parseItalicMarkers(maquette.histoire_title) }}
              />
            )}
            {maquette.histoire_lead && (
              <p className={styles.histoireLead}>{maquette.histoire_lead}</p>
            )}
            {maquette.texte_presentation && (
              <p className={styles.histoireParagraph}>{maquette.texte_presentation}</p>
            )}

            {valeurs.length > 0 && (
              <div className={styles.values}>
                {valeurs.slice(0, 4).map((v, i) => (
                  <div key={i} className={styles.valueItem}>
                    <div className={styles.valueIcon}>{VALUE_ICONS[i % VALUE_ICONS.length]}</div>
                    <div className={styles.valueContent}>
                      <div className={styles.valueTitle}>{v.title}</div>
                      <div className={styles.valueDesc}>{v.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
