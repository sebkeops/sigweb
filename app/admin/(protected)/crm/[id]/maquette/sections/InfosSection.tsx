import type { Prospect } from '@/types'
import SectionShell from './SectionShell'

interface Props { prospect: Prospect }

export default function InfosSection({ prospect }: Props) {
  return (
    <SectionShell
      comingIn="Disponible en Session 3.4"
      description="Override des coordonnées affichées (adresse, téléphone, email) et possibilité de masquer une info."
      preview={
        <dl className="space-y-2 font-body text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Adresse</dt>
            <dd className="text-right text-ink">{prospect.adresse ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Téléphone</dt>
            <dd className="text-ink">{prospect.telephone ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Email</dt>
            <dd className="text-ink">{prospect.email ?? '—'}</dd>
          </div>
        </dl>
      }
    />
  )
}
