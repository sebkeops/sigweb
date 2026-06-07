'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  unread: number
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  /** Préfixes alternatifs qui marquent l'item comme actif. */
  activePrefixes?: string[]
}

/**
 * BottomNav admin mobile (CRM v3 Phase 6).
 *
 * Visible uniquement < lg, en bas de l'écran, sticky. Le drawer hamburger
 * reste actif (header + slide-in gauche) pour les routes secondaires
 * (Projets, Sourcing, etc.) qui ne tiennent pas dans 4 items.
 *
 * Couvre `env(safe-area-inset-bottom)` pour les iPhone avec barre home.
 * Tap targets ≥ 56px (min-h-14 + py).
 *
 * Pas d'animation d'apparition — la nav doit toujours être là, pas
 * surgir, pour ne pas désorienter.
 */
export default function AdminBottomNav({ unread }: Props) {
  const pathname = usePathname()

  const items: NavItem[] = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M3 9.5L12 3l9 6.5V21H3V9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
      ),
    },
    {
      href: '/admin/crm',
      label: 'Prospects',
      activePrefixes: ['/admin/crm'],
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      href: '/admin/contacts',
      label: 'Messages',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      href: '#more',
      label: 'Plus',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
  ]

  function isActive(item: NavItem): boolean {
    if (item.href === '#more') return false
    if (pathname === item.href) return true
    if (item.activePrefixes) {
      return item.activePrefixes.some((p) => pathname.startsWith(p + '/') || pathname === p)
    }
    return false
  }

  function handleMoreClick(e: React.MouseEvent) {
    e.preventDefault()
    // Trigger le bouton hamburger existant (cherche par aria-label dans le header).
    const hamburger = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Ouvrir le menu"]'
    )
    hamburger?.click()
  }

  return (
    <nav
      aria-label="Navigation admin"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface shadow-[0_-2px_8px_rgba(0,0,0,0.04)] lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = isActive(item)
          const isMore = item.href === '#more'
          const showBadge = item.href === '/admin/contacts' && unread > 0

          const sharedClasses = `flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 py-2 transition-colors ${
            active ? 'text-primary' : 'text-muted hover:text-ink'
          }`

          return (
            <li key={item.label} className="relative">
              {isMore ? (
                <button
                  type="button"
                  onClick={handleMoreClick}
                  className={`${sharedClasses} w-full`}
                >
                  {item.icon}
                  <span className="font-body text-[11px] font-medium">{item.label}</span>
                </button>
              ) : (
                <Link href={item.href} className={sharedClasses}>
                  {item.icon}
                  <span className="font-body text-[11px] font-medium">{item.label}</span>
                </Link>
              )}
              {showBadge && (
                <span
                  aria-label={`${unread} message${unread > 1 ? 's' : ''} non lu${unread > 1 ? 's' : ''}`}
                  className="absolute right-3 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cta px-1 font-body text-[10px] font-bold leading-none text-white"
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
