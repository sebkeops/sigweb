'use client'

import { useState } from 'react'
import Link from 'next/link'

const navLinks = [
  { href: '/simulations', label: 'Simulations' },
  { href: '/realisations', label: 'Réalisations' },
  { href: '/methode', label: 'Ma méthode' },
]

export default function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      {/* Burger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={open}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-sm transition-colors hover:bg-surface-soft"
      >
        <span
          className={`block h-0.5 w-5 bg-ink transition-all duration-200 ${open ? 'translate-y-2 rotate-45' : ''}`}
        />
        <span
          className={`block h-0.5 w-5 bg-ink transition-all duration-200 ${open ? 'opacity-0' : ''}`}
        />
        <span
          className={`block h-0.5 w-5 bg-ink transition-all duration-200 ${open ? '-translate-y-2 -rotate-45' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-16 z-40 border-b border-border bg-surface shadow-card">
          <nav className="flex flex-col px-6 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-4 font-body text-base font-medium text-ink transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="mt-6 block rounded-sm bg-cta px-5 py-3 text-center font-heading text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Me contacter
            </Link>
          </nav>
        </div>
      )}
    </div>
  )
}
