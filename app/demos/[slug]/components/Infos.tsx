import { parseItalicMarkers, stripItalicMarkers } from '@/lib/maquette/render/parseItalicMarkers'
import { formatTelHref } from '@/lib/maquette/render/palette'
import { resolveInfos } from '@/lib/maquette/render/resolveInfos'
import type { MaquetteInfosOverrides, Prospect } from '@/types'
import styles from '../styles.module.css'

interface Props {
  prospect: Prospect
  overrides: MaquetteInfosOverrides | null
}

/**
 * Index du jour courant dans `weekdayDescriptions`.
 * Google renvoie pour locale `fr` : [Lundi, Mardi, ..., Dimanche].
 * `Date.getDay()` : 0=Dim, 1=Lun, ..., 6=Sam → on remappe.
 */
function frenchTodayIndex(now: Date = new Date()): number {
  return (now.getDay() + 6) % 7
}

/**
 * Affiche l'adresse résolue. Si elle vient d'un `formattedAddress` Google
 * (présence de virgules), on split pour 2 lignes propres. Si c'est un
 * override custom de l'admin, on rend tel quel (avec retour à la ligne sur
 * '\n' si présent).
 */
function renderAddressLines(adresseLine: string): React.ReactNode {
  const fromFormatted = adresseLine
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (fromFormatted.length > 1) {
    // Déduplication des lignes consécutives identiques + retrait de "France" en queue
    const dedup: string[] = []
    for (const line of fromFormatted) {
      if (line.toLowerCase() === 'france') continue
      if (dedup.length > 0 && dedup[dedup.length - 1].toLowerCase() === line.toLowerCase()) continue
      dedup.push(line)
    }
    return dedup.map((line, i) => (
      <span key={i}>
        {i > 0 && <br />}
        {line}
      </span>
    ))
  }

  // Adresse simple (override ou single-line) : on respecte les `\n` naturels
  return adresseLine.split('\n').map((line, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {line}
    </span>
  ))
}

export default function Infos({ prospect, overrides }: Props) {
  const resolved = resolveInfos(prospect, overrides)
  const tel = formatTelHref(resolved.telephone)
  const mapsUrl = resolved.adresseLine
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resolved.adresseLine)}`
    : null

  const titleHtml = parseItalicMarkers(
    prospect.ville ? `Au cœur de *${prospect.ville}*.` : 'Nous *trouver*.'
  )
  const weekdayDescriptions = prospect.google_opening_hours?.weekdayDescriptions ?? []
  const todayIdx = frenchTodayIndex()

  const hasAnyContact = resolved.adresseLine || tel || resolved.email

  return (
    <section className={`${styles.section} ${styles.infos}`} id="infos">
      <div className={styles.sectionInner}>
        <div className={styles.sectionEyebrow}>Nous trouver</div>
        <h2
          className={styles.sectionTitle}
          dangerouslySetInnerHTML={{ __html: titleHtml }}
        />

        <div className={styles.infosGrid}>
          {hasAnyContact && (
            <div className={styles.infosCard}>
              <h3>Coordonnées</h3>
              <ul className={styles.infosList}>
                {resolved.adresseLine && (
                  <li className={styles.infosItem}>
                    <div className={styles.infosIcon}>📍</div>
                    <div>
                      <div className={styles.infosLabel}>Adresse</div>
                      <div className={styles.infosValue}>
                        {renderAddressLines(resolved.adresseLine)}
                      </div>
                    </div>
                  </li>
                )}
                {tel && (
                  <li className={styles.infosItem}>
                    <div className={styles.infosIcon}>📞</div>
                    <div>
                      <div className={styles.infosLabel}>Téléphone</div>
                      <div className={styles.infosValue}>
                        <a href={`tel:${tel}`}>{resolved.telephone}</a>
                      </div>
                    </div>
                  </li>
                )}
                {resolved.email && (
                  <li className={styles.infosItem}>
                    <div className={styles.infosIcon}>✉</div>
                    <div>
                      <div className={styles.infosLabel}>Email</div>
                      <div className={styles.infosValue}>
                        <a href={`mailto:${resolved.email}`}>{resolved.email}</a>
                      </div>
                    </div>
                  </li>
                )}
              </ul>
              {(mapsUrl || tel) && (
                <div className={styles.infosActions}>
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                       className={`${styles.btn} ${styles.btnPrimary}`}>
                      <span>📍</span> Itinéraire
                    </a>
                  )}
                  {tel && (
                    <a href={`tel:${tel}`} className={`${styles.btn} ${styles.btnGhost}`}>
                      <span>📞</span> Appeler
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {weekdayDescriptions.length > 0 && (
            <div className={styles.infosCard}>
              <h3>Horaires</h3>
              <table className={styles.horairesTable}>
                <tbody>
                  {weekdayDescriptions.map((line, i) => {
                    const colonIdx = line.indexOf(':')
                    const day = colonIdx > 0 ? line.slice(0, colonIdx) : line
                    const hours = colonIdx > 0 ? line.slice(colonIdx + 1).trim() : ''
                    const isToday = i === todayIdx
                    return (
                      <tr key={i} className={isToday ? styles.today : ''}>
                        <td>{stripItalicMarkers(day)}{isToday ? ' · aujourd\'hui' : ''}</td>
                        <td>{hours}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
