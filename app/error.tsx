'use client'

import { Button, LinkButton } from '@/components/ui/Button'

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <p className="font-heading text-6xl font-extrabold text-primary">⚠️</p>
      <h1 className="mt-4 font-heading text-2xl font-bold text-ink">
        Une erreur est survenue
      </h1>
      <p className="mt-3 font-body text-muted">
        Quelque chose s&apos;est mal passé. Vous pouvez recharger la page ou revenir à l&apos;accueil.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Button variant="primary" size="lg" onClick={reset}>
          Recharger la page
        </Button>
        <LinkButton href="/" variant="ghost" size="lg">
          Retour à l&apos;accueil
        </LinkButton>
      </div>
    </main>
  )
}
