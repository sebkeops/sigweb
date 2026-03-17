import Link from 'next/link'
import Logo from '@/components/ui/Logo'

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/simulations', label: 'Simulations' },
  { href: '/realisations', label: 'Réalisations' },
  { href: '/methode', label: 'Ma méthode' },
  { href: '/simulateur', label: 'Estimer mon projet' },
  { href: '/contact', label: 'Contact' },
]

const legalLinks = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/politique-confidentialite', label: 'Politique de confidentialité' },
]

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-wide section-pad py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">

          {/* Colonne 1 — Marque */}
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-2.5">
              <Logo size={52} uid="footer" />
              <span className="font-heading text-lg font-bold text-primary">SIGWEB</span>
            </Link>
            <p className="font-body text-sm text-muted">Entre Toulouse et le Gers, en Occitanie</p>
            <p className="mt-1 font-body text-sm text-muted">
              Création de sites internet pour artisans et commerces locaux
            </p>
          </div>

          {/* Colonne 2 — Navigation */}
          <nav aria-label="Navigation du site">
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-muted">
              Navigation
            </p>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-muted transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Colonne 3 — Légal */}
          <div>
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-muted">
              Informations légales
            </p>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-sm text-muted transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-8 font-body text-xs text-muted">
              © {new Date().getFullYear()} SIGWEB
            </p>
          </div>

        </div>
      </div>
    </footer>
  )
}
