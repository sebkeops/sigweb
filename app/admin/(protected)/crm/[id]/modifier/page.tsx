import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProspectForm from '@/components/admin/ProspectForm'
import { createClient } from '@/lib/supabase/server'
import { updateProspect } from '@/lib/actions/prospect'
import type { Prospect } from '@/types'

export const metadata: Metadata = { title: 'Modifier un prospect | Admin Sigweb' }

interface Props {
  params: Promise<{ id: string }>
}

async function getProspect(id: string): Promise<Prospect | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('prospects').select('*').eq('id', id).single()
  return (data as Prospect | null) ?? null
}

export default async function EditProspectPage({ params }: Props) {
  const { id } = await params
  const prospect = await getProspect(id)

  if (!prospect) notFound()

  const updateWithId = updateProspect.bind(null, prospect.id)

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Link href="/admin/crm" className="font-body text-sm text-muted hover:text-primary">
          ← Prospects
        </Link>
        <span className="text-muted">/</span>
        <Link
          href={`/admin/crm/${prospect.id}`}
          className="font-body text-sm text-muted hover:text-primary"
        >
          {prospect.nom_commerce}
        </Link>
        <span className="text-muted">/</span>
        <h1 className="font-heading text-2xl font-extrabold text-ink">Modifier</h1>
      </div>

      <div className="max-w-4xl">
        <ProspectForm prospect={prospect} action={updateWithId} />
      </div>
    </div>
  )
}
