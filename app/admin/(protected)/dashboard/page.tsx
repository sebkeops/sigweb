import type { Metadata } from 'next'
import { fetchDashboardData } from '@/lib/admin/dashboard-data'
import StatusFunnelCard from '@/components/admin/dashboard/StatusFunnelCard'
import Activity7dCard from '@/components/admin/dashboard/Activity7dCard'
import UpcomingMeetingsCard from '@/components/admin/dashboard/UpcomingMeetingsCard'
import RelancesPendingCard from '@/components/admin/dashboard/RelancesPendingCard'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Dashboard admin (CRM v3 Phase 6).
 *
 * Server Component qui fetch les 4 KPIs en 1 appel parallèle Supabase
 * et délègue le rendu aux 4 cartes spécialisées.
 *
 * Grid responsive :
 *   - mobile : 1 colonne, ordre = priorité d'action
 *     (relances → RDV → activité → entonnoir)
 *   - desktop : 2 colonnes
 *
 * Ordre mobile pensé pour le « quoi faire maintenant » : ce qui presse
 * en haut, ce qui mesure en bas.
 */
export default async function AdminDashboardPage() {
  const data = await fetchDashboardData()

  const totalProspects = data.statusFunnel.reduce((s, r) => s + r.count, 0)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 font-body text-sm text-muted">
          Vue d'ensemble du pipeline commercial — données filtrées des envois
          de test.
        </p>
      </header>

      {/* min-w-0 sur les grid items : CSS Grid impose min-width=auto par
          defaut, ce qui empeche les items de shrink en dessous de leur
          min-content. Si une carte contient un texte ou flex enfant
          indivisible plus large que la colonne, l'item ET la carte
          debordent visuellement. min-w-0 autorise le shrink jusqu'a 0
          et delegue la responsabilite du wrap aux contenus internes
          (truncate, break-words, min-w-0 sur les flex enfants). */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        {/* Mobile : priorité d'action en haut */}
        <div className="order-1 lg:order-1">
          <RelancesPendingCard rows={data.relancesPending} />
        </div>
        <div className="order-2 lg:order-2">
          <UpcomingMeetingsCard rows={data.upcomingMeetings} />
        </div>
        <div className="order-3 lg:order-3">
          <Activity7dCard data={data.activity7d} />
        </div>
        <div className="order-4 lg:order-4">
          <StatusFunnelCard rows={data.statusFunnel} total={totalProspects} />
        </div>
      </div>
    </div>
  )
}
