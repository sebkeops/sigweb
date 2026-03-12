import Link from 'next/link'
import Logo from '@/components/ui/Logo'

const navLinks = [
  { href: '/simulations', label: 'Simulations' },
  { href: '/realisations', label: 'Réalisations' },
  { href: '/methode', label: 'Notre méthode' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-sm">
      <div className="container-wide section-pad py-0">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 text-ink">
            <Logo size={70} uid="header" />
            <span className="font-heading text-xl font-bold text-primary">SIGWEB</span>
          </Link>

          {/* Navigation */}
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

          {/* CTA */}
          <Link
            href="/contact"
            className="rounded-sm bg-cta px-5 py-2.5 font-heading text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    </header>
  )
}
