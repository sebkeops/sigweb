import type { Metadata } from 'next'
import Link from 'next/link'
import ProspectForm from '@/components/admin/ProspectForm'
import { createProspect } from '@/lib/actions/prospect'
import { consumeEnrichedCookieAsToken } from '@/lib/crm/enriched-cookie'
import { enrichedToFormDefaults } from '@/lib/crm/google-mapping'

export const metadata: Metadata = { title: 'Nouveau prospect | Admin Sigweb' }

interface Props {
  searchParams: Promise<{ from?: string }>
}

export default async function NouveauProspectPage({ searchParams }: Props) {
  const sp = await searchParams
  const fromEnrich = sp.from === 'enrich'

  // Extrait le token + supprime le cookie immédiatement. À partir d'ici,
  // le payload signé est porté par le formulaire (input hidden), pas par
  // un cookie qui pourrait être écrasé par un autre onglet.
  const { token: enrichedToken, data: enriched } = fromEnrich
    ? await consumeEnrichedCookieAsToken()
    : { token: null, data: null }
  const initialData = enriched ? enrichedToFormDefaults(enriched) : undefined

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Link href="/admin/crm" className="font-body text-sm text-muted hover:text-primary">
          ← Prospects
        </Link>
        <span className="text-muted">/</span>
        <h1 className="font-heading text-2xl font-extrabold text-ink">Nouveau prospect</h1>
      </div>

      {fromEnrich && enriched && (
        <div className="mb-6 max-w-4xl rounded-md border border-primary/30 bg-primary-soft/40 p-4">
          <p className="font-body text-sm text-primary-dark">
            ✨ Formulaire pré-rempli depuis Google ({enriched.name}). Vérifiez les valeurs,
            corrigez si besoin, puis complétez les champs propres au CRM (score, canal, statut, notes).
          </p>
        </div>
      )}

      {fromEnrich && !enriched && (
        <div className="mb-6 max-w-4xl rounded-md border border-orange-200 bg-orange-50 p-4">
          <p className="font-body text-sm text-orange-800">
            La session d&apos;enrichissement a expiré. Recommencez depuis{' '}
            <Link href="/admin/crm/import" className="underline">l&apos;import Google</Link>.
          </p>
        </div>
      )}

      <div className="max-w-4xl">
        <ProspectForm
          action={createProspect}
          initialData={initialData}
          enrichedToken={enrichedToken}
        />
      </div>
    </div>
  )
}
