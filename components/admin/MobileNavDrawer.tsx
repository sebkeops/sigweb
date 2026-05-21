'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Drawer } from '@/components/ui/Drawer'
import { useIsMobile } from '@/hooks/useIsMobile'
import LogoutButton from '@/app/admin/(protected)/LogoutButton'

interface AdminNavLink {
  href: string
  label: string
}

interface MobileNavDrawerProps {
  links: AdminNavLink[]
  unread: number
  userEmail: string
}

/**
 * Bouton hamburger + drawer de navigation admin, visibles uniquement < lg.
 * La nav desktop reste rendue (et figée au pixel) par le layout admin ; ce
 * composant ne fait qu'ajouter la voie mobile.
 */
export default function MobileNavDrawer({ links, unread, userEmail }: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isMobile = useIsMobile()

  // Repli auto si on repasse en desktop (rotation / redimensionnement).
  useEffect(() => {
    if (!isMobile) setOpen(false)
  }, [isMobile])

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        // `-my-[3px]` : le bouton garde sa cible tactile de 44px mais ne gonfle
        // pas la hauteur du header mobile — celle-ci reste alignee sur le desktop.
        className="-my-[3px] -ml-1 flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-sm text-ink transition-colors hover:bg-surface-soft"
      >
        <span className="block h-0.5 w-6 rounded-full bg-current" />
        <span className="block h-0.5 w-6 rounded-full bg-current" />
        <span className="block h-0.5 w-6 rounded-full bg-current" />
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} side="left" title="Menu">
        <nav className="flex flex-col">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-between border-b border-border py-4 font-body text-base font-medium transition-colors ${
                  active ? 'text-primary' : 'text-ink hover:text-primary'
                }`}
              >
                {link.label}
                {link.href === '/admin/contacts' && unread > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cta px-1.5 font-body text-xs font-bold text-white">
                    {unread}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="mt-6 space-y-3">
          <p className="font-body text-xs text-muted">{userEmail}</p>
          <LogoutButton />
        </div>
      </Drawer>
    </div>
  )
}
