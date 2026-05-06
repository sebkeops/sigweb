import type { GoogleReviewItem, Prospect } from '@/types'
import SectionShell from './SectionShell'

interface Props { prospect: Prospect }

export default function AvisSection({ prospect }: Props) {
  const reviews = (prospect.google_reviews ?? []) as GoogleReviewItem[]
  return (
    <SectionShell
      comingIn="Disponible en Session 3.4"
      description="Sélection des 3 avis à afficher (parmi ceux de Google) et override possible du texte."
      preview={
        <div className="space-y-2 font-body text-sm">
          <div className="text-muted">
            {reviews.length} avis Google récupéré{reviews.length > 1 ? 's' : ''} (max 3 affichés)
          </div>
          <ul className="space-y-2">
            {reviews.slice(0, 3).map((r, i) => (
              <li key={i} className="rounded-md bg-surface-strong p-2">
                <div className="text-xs text-muted">{r.author_name} · {'★'.repeat(r.rating)}</div>
                <div className="text-ink">{r.text}</div>
              </li>
            ))}
          </ul>
        </div>
      }
    />
  )
}
