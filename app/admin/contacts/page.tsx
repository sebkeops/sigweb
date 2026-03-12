import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Contact } from '@/types'
import { Badge } from '@/components/ui/Badge'
import MarkReadButton from './MarkReadButton'

export const metadata: Metadata = { title: 'Messages | Admin Sigweb' }

async function getContacts(): Promise<Contact[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminContactsPage() {
  const contacts = await getContacts()
  const unread = contacts.filter((c) => !c.is_read).length

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <h1 className="font-heading text-2xl font-extrabold text-ink">Messages de contact</h1>
        {unread > 0 && (
          <Badge variant="orange">{unread} non lu{unread > 1 ? 's' : ''}</Badge>
        )}
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-md border border-border bg-surface py-16 text-center">
          <p className="font-body text-base text-muted">Aucun message pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`rounded-md border bg-surface p-6 shadow-sm transition-colors ${
                contact.is_read ? 'border-border' : 'border-accent/40 bg-accent-soft/20'
              }`}
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-heading text-base font-bold text-ink">{contact.name}</p>
                    {contact.business_name && (
                      <span className="font-body text-sm text-muted">— {contact.business_name}</span>
                    )}
                    {!contact.is_read && <Badge variant="orange">Nouveau</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-4">
                    <a
                      href={`mailto:${contact.email}`}
                      className="font-body text-sm text-primary hover:underline"
                    >
                      {contact.email}
                    </a>
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="font-body text-sm text-muted hover:text-primary"
                      >
                        {contact.phone}
                      </a>
                    )}
                    {contact.business_type && (
                      <span className="font-body text-sm text-muted">{contact.business_type}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-body text-xs text-muted">{formatDate(contact.created_at)}</span>
                  {!contact.is_read && <MarkReadButton id={contact.id} />}
                </div>
              </div>

              <div className="rounded-sm bg-surface-soft p-4">
                <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-text">
                  {contact.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
