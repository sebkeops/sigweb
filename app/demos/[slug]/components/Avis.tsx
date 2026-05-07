import type { GoogleReviewItem, MaquetteAvisItem, Prospect } from '@/types'
import { formatRelativeTime } from '@/lib/maquette/render/formatRelativeTime'
import styles from '../styles.module.css'

interface Props {
  prospect: Prospect
  /** En V1, toujours null (édition manuelle des avis = Session 4). */
  customAvis: MaquetteAvisItem[] | null
}

interface NormalizedAvis {
  text: string
  rating: number
  author: string
  authorInitial: string
  publishTime: string | null
}

function fromGoogleReview(r: GoogleReviewItem): NormalizedAvis {
  return {
    text: r.text,
    rating: r.rating,
    author: r.author_name || 'Avis Google',
    authorInitial: r.author_initial ?? '?',
    publishTime: r.publish_time,
  }
}

function fromMaquetteAvis(a: MaquetteAvisItem): NormalizedAvis {
  const fallbackInitial = a.author.charAt(0).toUpperCase() || '?'
  return {
    text: a.text,
    rating: a.rating,
    author: a.author,
    authorInitial: a.author_initial ?? fallbackInitial,
    publishTime: a.date,
  }
}

export default function Avis({ prospect, customAvis }: Props) {
  const items: NormalizedAvis[] = customAvis
    ? customAvis.map(fromMaquetteAvis)
    : (prospect.google_reviews ?? []).slice(0, 3).map(fromGoogleReview)

  if (items.length === 0) return null

  return (
    <section className={`${styles.section} ${styles.avis}`} id="avis">
      <div className={styles.sectionInner}>
        <div className={styles.sectionEyebrow}>Avis clients</div>
        <h2 className={styles.sectionTitle}>
          Ce qu&apos;en pensent nos <em>habitués</em>.
        </h2>

        <div className={styles.avisGrid}>
          {items.map((a, i) => {
            const stars = '★'.repeat(Math.max(1, Math.min(5, a.rating)))
            const relative = formatRelativeTime(a.publishTime)
            return (
              <div key={i} className={styles.avisCard}>
                <div className={styles.avisStars}>{stars}</div>
                <p className={styles.avisText}>{a.text}</p>
                <div className={styles.avisAuthor}>
                  <div className={styles.avisAvatar}>{a.authorInitial}</div>
                  <div>
                    <div className={styles.avisName}>{a.author}</div>
                    <div className={styles.avisSource}>
                      Avis Google{relative ? ` · ${relative}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {prospect.google_rating != null && prospect.google_reviews_count != null && (
          <div className={styles.avisFooter}>
            <span>Note moyenne</span>
            <span className={styles.avisGoogle}>
              {'★'.repeat(Math.round(prospect.google_rating))}{' '}
              {prospect.google_rating.toFixed(1)}/5 — {prospect.google_reviews_count} avis Google
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
