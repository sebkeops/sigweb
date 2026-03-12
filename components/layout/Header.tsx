import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import MobileMenu from '@/components/layout/MobileMenu'

const navLinks = [
  { href: '/simulations', label: 'Simulations' },
  { href: '/realisations', label: 'Réalisations' },
  { href: '/methode', label: 'Ma méthode' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-sm">
      <div className="container-wide section-pad py-0">
        <div className="flex h-16 items-center justify-between">
          {/* Logo — centré sur mobile, à gauche sur desktop */}
          <Link href="/" className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5 text-ink md:static md:translate-x-0">
            <Logo size={70} uid="header" />
            <span className="font-heading text-xl font-bold text-primary">SIGWEB</span>
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-sm font-medium text-muted transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA desktop */}
          <Link
            href="/contact"
            className="hidden rounded-sm bg-cta px-5 py-2.5 font-heading text-sm font-bold text-white transition-opacity hover:opacity-90 md:inline-block"
          >
            Me contacter
          </Link>

          {/* Burger mobile */}
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
