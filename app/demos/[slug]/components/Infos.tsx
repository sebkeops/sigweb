import { parseItalicMarkers, stripItalicMarkers } from '@/lib/maquette/render/parseItalicMarkers'
import { formatTelHref } from '@/lib/maquette/render/palette'
import type { Prospect } from '@/types'
import styles from '../styles.module.css'

interface Props {
  prospect: Prospect
}

function buildMapsUrl(p: Prospect): string | null {
  const parts = [p.adresse, p.code_postal, p.ville].filter(Boolean)
  if (parts.length === 0) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
}

/**
 * Affiche l'adresse sur 2 lignes (rue puis CP+ville).
 *
 * `prospect.adresse` vient de `formattedAddress` Google et contient déjà
 * généralement TOUT ("53 Av. ..., 32600 L'Isle-Jourdain"). On split sur la
 * virgule pour découper proprement. Si `adresse` est absente ou ne contient
 * pas la ville, on retombe sur la concaténation manuelle code_postal + ville.
 */
function renderAddressLines(p: Prospect): React.ReactNode {
  const fromFormatted = (p.adresse ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (fromFormatted.length > 0) {
    // Déduplication des lignes consécutives identiques (cas observé : certaines
    // fiches Google renvoient un `formattedAddress` du type
    // "Rue X, 32600 L'Isle-Jourdain, 32600 L'Isle-Jourdain"). On évite aussi
    // d'afficher "France" en queue d'adresse — ça fait visuellement chargé
    // pour rien sur une page locale.
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

  // Fallback : pas d'adresse formatée → on assemble depuis code_postal + ville
  const cpVille = [p.code_postal, p.ville].filter(Boolean).join(' ')
  return cpVille || null
}

/**
 * Index du jour courant dans `weekdayDescriptions`.
 * Google renvoie pour locale `fr` : [Lundi, Mardi, ..., Dimanche].
 * `Date.getDay()` : 0=Dim, 1=Lun, ..., 6=Sam → on remappe.
 */
function frenchTodayIndex(now: Date = new Date()): number {
  return (now.getDay() + 6) % 7
}

export default function Infos({ prospect }: Props) {
  const mapsUrl = buildMapsUrl(prospect)
  const tel = formatTelHref(prospect.telephone)
  const titleHtml = parseItalicMarkers(
    prospect.ville ? `Au cœur de *${prospect.ville}*.` : 'Nous *trouver*.'
  )
  const weekdayDescriptions = prospect.google_opening_hours?.weekdayDescriptions ?? []
  const todayIdx = frenchTodayIndex()

  return (
    <section className={`${styles.section} ${styles.infos}`} id="infos">
      <div className={styles.sectionInner}>
        <div className={styles.sectionEyebrow}>Nous trouver</div>
        <h2
          className={styles.sectionTitle}
          dangerouslySetInnerHTML={{ __html: titleHtml }}
        />

        <div className={styles.infosGrid}>
          <div className={styles.infosCard}>
            <h3>Coordonnées</h3>
            <ul className={styles.infosList}>
              {(prospect.adresse || prospect.ville) && (
                <li className={styles.infosItem}>
                  <div className={styles.infosIcon}>📍</div>
                  <div>
                    <div className={styles.infosLabel}>Adresse</div>
                    <div className={styles.infosValue}>
                      {renderAddressLines(prospect)}
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
                      <a href={`tel:${tel}`}>{prospect.telephone}</a>
                    </div>
                  </div>
                </li>
              )}
              {prospect.email && (
                <li className={styles.infosItem}>
                  <div className={styles.infosIcon}>✉</div>
                  <div>
                    <div className={styles.infosLabel}>Email</div>
                    <div className={styles.infosValue}>
                      <a href={`mailto:${prospect.email}`}>{prospect.email}</a>
                    </div>
                  </div>
                </li>
              )}
            </ul>
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
          </div>

          {weekdayDescriptions.length > 0 && (
            <div className={styles.infosCard}>
              <h3>Horaires</h3>
              <table className={styles.horairesTable}>
                <tbody>
                  {weekdayDescriptions.map((line, i) => {
                    // Format Google fr : "Lundi: 06:30 – 13:30, 16:00 – 19:30"
                    // ou "Lundi: Fermé". On split sur le premier `:` pour
                    // séparer libellé jour vs plage horaire.
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
