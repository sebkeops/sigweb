import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import MobileMenu from '@/components/layout/MobileMenu'
import ContactLink from '@/components/layout/ContactLink'

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/simulations', label: 'Simulations' },
  { href: '/realisations', label: 'Réalisations' },
  { href: '/methode', label: 'Ma méthode' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-sm">
      <div className="container-wide section-pad py-0">
        <div className="flex h-16 items-center justify-between">

          {/* Icône maison — mobile uniquement */}
          <Link
            href="/"
            aria-label="Accueil"
            className="flex items-center text-ink transition-colors hover:text-primary md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>

          {/* Logo — centré sur mobile, à gauche sur desktop */}
          <Link href="/" className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5 text-ink md:static md:translate-x-0">
            <Logo size={70} uid="header" />
            <span className="translate-y-[-3px] font-heading text-xl font-bold text-primary">SIGWEB</span>
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

          {/* CTAs desktop */}
          <div className="hidden items-center gap-3 md:flex">
            <ContactLink href="/simulateur" className="rounded-sm border border-primary px-5 py-2.5 font-heading text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white">
              Estimer mon projet
            </ContactLink>
            <ContactLink href="/contact" className="rounded-sm bg-cta px-5 py-2.5 font-heading text-sm font-bold text-white transition-opacity hover:opacity-90">
              Me contacter
            </ContactLink>
          </div>

          {/* Burger mobile */}
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
