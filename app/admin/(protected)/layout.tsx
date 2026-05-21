import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'
import InactivityLogout from './InactivityLogout'
import MobileNavDrawer from '@/components/admin/MobileNavDrawer'

/** Liens de navigation admin — partagés par la nav desktop et le drawer mobile. */
const ADMIN_NAV_LINKS = [
  { href: '/admin/projets', label: 'Projets' },
  { href: '/admin/crm', label: 'CRM' },
  { href: '/admin/contacts', label: 'Messages' },
]

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { count: unreadCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
  const unread = unreadCount ?? 0

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Barre admin */}
      <header className="border-b border-border bg-surface shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 lg:gap-8">
            {/* Hamburger + drawer — visibles uniquement < lg */}
            <MobileNavDrawer links={ADMIN_NAV_LINKS} unread={unread} userEmail={user.email ?? ''} />

            <Link href="/admin/projets" className="font-heading text-lg font-bold text-primary">
              Sigweb Admin
            </Link>

            {/* Nav desktop — figée au pixel, masquée < lg */}
            <nav className="hidden items-center gap-6 lg:flex">
              {ADMIN_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative font-body text-sm font-medium text-muted hover:text-primary"
                >
                  {link.label}
                  {link.href === '/admin/contacts' && unread > 0 && (
                    <span className="absolute -right-4 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cta px-1 font-body text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Bloc droit desktop — masqué < lg (déconnexion accessible via le drawer) */}
          <div className="hidden items-center gap-4 lg:flex">
            <span className="font-body text-xs text-muted">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
      <InactivityLogout />
    </div>
  )
}
