import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'
import InactivityLogout from './InactivityLogout'

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
          <div className="flex items-center gap-8">
            <Link href="/admin/projets" className="font-heading text-lg font-bold text-primary">
              Sigweb Admin
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/admin/projets" className="font-body text-sm font-medium text-muted hover:text-primary">
                Projets
              </Link>
              <Link href="/admin/contacts" className="relative font-body text-sm font-medium text-muted hover:text-primary">
                Messages
                {unread > 0 && (
                  <span className="absolute -right-4 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cta px-1 font-body text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden font-body text-xs text-muted sm:block">{user.email}</span>
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
