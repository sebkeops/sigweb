'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// TODO: Renseigner NEXT_PUBLIC_PHONE=+336XXXXXXXX sur Vercel
const PHONE = process.env.NEXT_PUBLIC_PHONE ?? '+33600000000'
const PHONE_DISPLAY = process.env.NEXT_PUBLIC_PHONE_DISPLAY ?? '06 00 00 00 00'

export default function StickyContactBar() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex sm:hidden border-t border-border bg-surface shadow-card">
      <a
        href={`tel:${PHONE}`}
        className="flex flex-1 items-center justify-center gap-2 py-4 font-heading text-sm font-bold text-primary transition-colors hover:bg-surface-strong"
        aria-label={`Appeler le ${PHONE_DISPLAY}`}
      >
        <span aria-hidden="true">📞</span>
        Appeler
      </a>
      <div className="w-px bg-border" />
      <Link
        href="/contact"
        className="flex flex-1 items-center justify-center gap-2 bg-cta py-4 font-heading text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        <span aria-hidden="true">✉️</span>
        Contact
      </Link>
    </div>
  )
}
