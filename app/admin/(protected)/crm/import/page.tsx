import type { Metadata } from 'next'
import Link from 'next/link'
import SearchTab from './SearchTab'
import UrlTab from './UrlTab'

export const metadata: Metadata = { title: 'Importer un prospect | Admin Sigweb' }

type Mode = 'search' | 'url'

interface Props {
  searchParams: Promise<{ mode?: string; bind?: string; name?: string }>
}

export default async function ImportPage({ searchParams }: Props) {
  const sp = await searchParams
  const mode: Mode = sp.mode === 'url' ? 'url' : 'search'
  const bindMode = !!(sp.bind && /^[0-9a-f-]{36}$/i.test(sp.bind))

  const tabClass = (active: boolean) =>
    `rounded-sm px-4 py-2 font-body text-sm font-semibold transition-colors ${
      active
        ? 'bg-primary text-white'
        : 'bg-surface text-muted hover:bg-surface-soft hover:text-primary border border-border'
    }`

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Link href="/admin/crm" className="font-body text-sm text-muted hover:text-primary">
          ← Prospects
        </Link>
        <span className="text-muted">/</span>
        <h1 className="font-heading text-2xl font-extrabold text-ink">
          {bindMode ? 'Lier une fiche existante à Google' : 'Importer un prospect depuis Google'}
        </h1>
      </div>

      {bindMode && (
        <div className="mb-6 rounded-md border border-primary/30 bg-primary-soft/40 p-4">
          <p className="font-body text-sm text-primary-dark">
            🔗 Mode <strong>Lier à Google</strong> — recherchez le bon commerce
            {sp.name ? ` ("${sp.name}")` : ''} et cliquez sur le résultat. Les données Google
            viendront enrichir votre fiche existante, sans créer de doublon.
          </p>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        <Link href="/admin/crm/import?mode=search" className={tabClass(mode === 'search')}>
          Recherche par nom + ville
        </Link>
        <Link href="/admin/crm/import?mode=url" className={tabClass(mode === 'url')}>
          URL Google Maps
        </Link>
      </div>

      {mode === 'search' ? <SearchTab /> : <UrlTab />}
    </div>
  )
}
