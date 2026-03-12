import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-wide section-pad py-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <span className="font-heading text-lg font-bold text-primary">Sigweb</span>
            <p className="mt-1 font-body text-sm text-muted">
              Sites web pour commerces et artisans · Toulouse
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-6">
            <Link href="/simulations" className="font-body text-sm text-muted hover:text-primary">
              Simulations
            </Link>
            <Link href="/realisations" className="font-body text-sm text-muted hover:text-primary">
              Réalisations
            </Link>
            <Link href="/methode" className="font-body text-sm text-muted hover:text-primary">
              Notre méthode
            </Link>
            <Link href="/contact" className="font-body text-sm text-muted hover:text-primary">
              Contact
            </Link>
          </nav>

          <p className="font-body text-xs text-muted">
            © {new Date().getFullYear()} Sigweb
          </p>
        </div>
      </div>
    </footer>
  )
}
