import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token'

export const metadata: Metadata = {
  title: 'Désabonnement',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ token?: string }>
}

type Status = 'success' | 'already' | 'invalid'

/**
 * Désabonnement déclenché au GET (sur lien cliqué depuis l'email) — pratique
 * standard sur les emails marketing (Mailchimp, Sendgrid…). Le HMAC sur le
 * token empêche un attaquant de désabonner un prospect arbitraire ; le seul
 * risque résiduel est qu'un prefetcher de sécurité visite le lien à la place
 * de l'utilisateur, ce qui reste acceptable (l'utilisateur peut recontacter).
 */
async function processUnsubscribe(token: string | undefined): Promise<Status> {
  if (!token) return 'invalid'
  const prospectId = verifyUnsubscribeToken(token)
  if (!prospectId) return 'invalid'

  const supabase = createAdminClient()
  const { data: prospect } = await supabase
    .from('prospects')
    .select('email_unsubscribed')
    .eq('id', prospectId)
    .maybeSingle()

  if (!prospect) return 'invalid'
  if (prospect.email_unsubscribed) return 'already'

  const { error } = await supabase
    .from('prospects')
    .update({
      email_unsubscribed: true,
      email_unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', prospectId)

  if (error) {
    console.error('[unsubscribe] update failed:', error.message)
    return 'invalid'
  }
  return 'success'
}

export const dynamic = 'force-dynamic'

export default async function UnsubscribePage({ searchParams }: Props) {
  const sp = await searchParams
  const status = await processUnsubscribe(sp.token)

  return (
    <>
      <Header />
      <main className="section-pad">
        <div className="container-narrow">
          {status === 'success' && (
            <div className="rounded-lg border border-border bg-surface p-8 shadow-sm">
              <h1 className="mb-4 font-heading text-3xl font-extrabold text-ink">
                C&apos;est noté
              </h1>
              <p className="mb-4 font-body text-base leading-relaxed text-text">
                Vous êtes désabonné. Je ne vous enverrai plus d&apos;email de
                prospection.
              </p>
              <p className="mb-8 font-body text-sm leading-relaxed text-muted">
                Si c&apos;était une erreur ou si vous changez d&apos;avis,
                écrivez-moi simplement à{' '}
                <a
                  href="mailto:contact@sigweb.fr"
                  className="text-primary hover:underline"
                >
                  contact@sigweb.fr
                </a>
                .
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-sm bg-primary px-5 py-2.5 font-heading text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Retour au site
              </Link>
            </div>
          )}

          {status === 'already' && (
            <div className="rounded-lg border border-border bg-surface p-8 shadow-sm">
              <h1 className="mb-4 font-heading text-3xl font-extrabold text-ink">
                Vous êtes déjà désabonné
              </h1>
              <p className="mb-8 font-body text-base leading-relaxed text-text">
                Aucun email ne vous sera envoyé. Pour reprendre contact,
                écrivez-moi à{' '}
                <a
                  href="mailto:contact@sigweb.fr"
                  className="text-primary hover:underline"
                >
                  contact@sigweb.fr
                </a>
                .
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-sm bg-primary px-5 py-2.5 font-heading text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                Retour au site
              </Link>
            </div>
          )}

          {status === 'invalid' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-8 shadow-sm">
              <h1 className="mb-4 font-heading text-3xl font-extrabold text-ink">
                Lien invalide
              </h1>
              <p className="mb-4 font-body text-base leading-relaxed text-text">
                Ce lien de désabonnement n&apos;est pas valide ou a été
                tronqué.
              </p>
              <p className="mb-8 font-body text-sm leading-relaxed text-muted">
                Pour vous désabonner manuellement, écrivez-moi à{' '}
                <a
                  href="mailto:contact@sigweb.fr"
                  className="text-primary hover:underline"
                >
                  contact@sigweb.fr
                </a>{' '}
                — je m&apos;en occupe immédiatement.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-sm border border-border bg-transparent px-5 py-2.5 font-heading text-sm font-bold text-text transition-opacity hover:bg-surface-strong"
              >
                Retour au site
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
