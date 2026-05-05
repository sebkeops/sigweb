import type { Metadata } from 'next'
import Link from 'next/link'
import SourcingPage from './SourcingPage'

export const metadata: Metadata = { title: 'Sourcing de prospects | Admin Sigweb' }

export default async function SourcingPageWrapper() {
  // Coords centrales lues côté serveur (env privées non NEXT_PUBLIC_).
  // On les transmet juste pour affichage en lecture seule au client.
  const lat = parseFloat(process.env.SIGWEB_BASE_LATITUDE ?? '')
  const lng = parseFloat(process.env.SIGWEB_BASE_LONGITUDE ?? '')
  const baseCoords =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? { lat, lng }
      : null

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Link href="/admin/crm" className="font-body text-sm text-muted hover:text-primary">
          ← Prospects
        </Link>
        <span className="text-muted">/</span>
        <h1 className="font-heading text-2xl font-extrabold text-ink">Sourcing de prospects</h1>
      </div>

      <SourcingPage baseCoords={baseCoords} />
    </div>
  )
}
