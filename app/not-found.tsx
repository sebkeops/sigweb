import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { LinkButton } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
        <p className="font-heading text-8xl font-extrabold text-primary">404</p>
        <h1 className="mt-4 font-heading text-2xl font-bold text-ink">Page introuvable</h1>
        <p className="mt-3 font-body text-muted">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <LinkButton href="/" variant="primary" size="lg">
            Retour à l&apos;accueil
          </LinkButton>
          <LinkButton href="/contact" variant="ghost" size="lg">
            Nous contacter
          </LinkButton>
        </div>
      </main>
      <Footer />
    </>
  )
}
