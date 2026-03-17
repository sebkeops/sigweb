'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ContactLink from '@/components/layout/ContactLink'

export default function StickyContactBar() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex sm:hidden border-t border-border bg-surface shadow-card">
      <ContactLink
        href="/simulateur"
        className="flex flex-1 items-center justify-center gap-2 bg-cta py-4 font-heading text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        <span aria-hidden="true">🖥️</span>
        Estimer mon projet
      </ContactLink>
      <div className="w-px bg-border" />
      <Link
        href="/contact"
        className="flex flex-1 items-center justify-center gap-2 py-4 font-heading text-sm font-bold text-primary transition-colors hover:bg-surface-strong"
      >
        <span aria-hidden="true">✉️</span>
        Me contacter
      </Link>
    </div>
  )
}
