import Link from 'next/link'
import Logo from '@/components/ui/Logo'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-wide section-pad py-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <Logo size={70} uid="footer" />
            <div>
              <span className="font-heading text-lg font-bold text-primary">SIGWEB</span>
              <p className="font-body text-sm text-muted">
                Entre Toulouse et le Gers, en Occitanie
              </p>
            </div>
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

          <div className="text-right">
            <p className="font-body text-xs text-muted">© {new Date().getFullYear()} SIGWEB</p>
            <p className="mt-1 font-body text-xs text-muted">
              Création de sites internet pour artisans et commerces locaux
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
