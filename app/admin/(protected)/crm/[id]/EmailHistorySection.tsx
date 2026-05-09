import type { EmailSend, EmailSendStatus } from '@/types'
import { Badge } from '@/components/ui/Badge'

interface Props {
  emails: EmailSend[]
}

const STATUS_LABELS: Record<EmailSendStatus, string> = {
  pending: 'En attente',
  sent: 'Envoyé',
  delivered: 'Livré',
  opened: 'Ouvert',
  clicked: 'Cliqué',
  bounced: 'Bounce',
  complained: 'Plainte spam',
}

const STATUS_BADGE: Record<EmailSendStatus, 'gray' | 'blue' | 'indigo' | 'yellow' | 'green' | 'red'> = {
  pending: 'gray',
  sent: 'blue',
  delivered: 'indigo',
  opened: 'yellow',
  clicked: 'green',
  bounced: 'red',
  complained: 'red',
}

const VARIANT_LABELS: Record<EmailSend['variant'], string> = {
  'sans-site': 'Sans site',
  'avec-site': 'Avec site',
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

export default function EmailHistorySection({ emails }: Props) {
  if (emails.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 font-heading text-base font-bold text-ink">
          Historique des emails
        </h2>
        <p className="font-body text-sm text-muted">
          Aucun email envoyé pour l&apos;instant.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
      <h2 className="mb-4 font-heading text-base font-bold text-ink">
        Historique des emails{' '}
        <span className="font-body text-sm font-normal text-muted">
          ({emails.length})
        </span>
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-border">
            <tr>
              <th className="py-2 pr-4 font-body text-xs font-semibold uppercase tracking-wider text-muted">
                Envoyé le
              </th>
              <th className="hidden py-2 pr-4 font-body text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">
                Variante
              </th>
              <th className="py-2 pr-4 font-body text-xs font-semibold uppercase tracking-wider text-muted">
                Sujet
              </th>
              <th className="py-2 pr-4 font-body text-xs font-semibold uppercase tracking-wider text-muted">
                Statut
              </th>
              <th className="py-2 pr-4 text-right font-body text-xs font-semibold uppercase tracking-wider text-muted">
                Ouv.
              </th>
              <th className="py-2 text-right font-body text-xs font-semibold uppercase tracking-wider text-muted">
                Clics
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {emails.map((e) => {
              const isFailed = e.status === 'bounced' || e.status === 'complained'
              const sentAt = e.sent_at ?? e.created_at
              return (
                <tr key={e.id} className="align-top">
                  <td className="py-3 pr-4">
                    <span className="font-body text-sm text-ink">
                      {formatDateTime(sentAt)}
                    </span>
                  </td>
                  <td className="hidden py-3 pr-4 md:table-cell">
                    <span className="font-body text-sm text-muted">
                      {VARIANT_LABELS[e.variant]}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className="font-body text-sm text-ink"
                      title={e.subject}
                    >
                      {truncate(e.subject, 60)}
                    </span>
                    {isFailed && e.bounce_reason && (
                      <p className="mt-1 font-body text-xs text-red-600">
                        {e.bounce_reason}
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={STATUS_BADGE[e.status]}>
                      {STATUS_LABELS[e.status]}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span
                      className="font-body text-sm text-ink"
                      title={
                        e.first_opened_at
                          ? `1ère ouv. : ${formatDateTime(e.first_opened_at)}`
                          : undefined
                      }
                    >
                      {e.open_count}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className="font-body text-sm text-ink"
                      title={
                        e.first_clicked_at
                          ? `1er clic : ${formatDateTime(e.first_clicked_at)}`
                          : undefined
                      }
                    >
                      {e.click_count}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
