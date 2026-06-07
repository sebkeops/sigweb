import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { buildDailyRecap, renderRecapHtml, renderRecapText } from '@/lib/admin/daily-recap'

/**
 * Cron quotidien — envoie un récap des actions du jour à l'admin (CRM v3 Phase 7).
 *
 * Planifié via `vercel.json` à `0 8 * * *` (= 9h Paris en hiver / 10h en été).
 * Vercel Cron Hobby = 1 cron / jour max, donc on accepte ce compromis horaire.
 *
 * Sécurité :
 *   - Le header `Authorization: Bearer ${CRON_SECRET}` doit être présent
 *   - Sans CRON_SECRET defini, on refuse tout — pas de fallback laxiste
 *   - Vercel pose automatiquement ce header pour les crons via vercel.json
 *
 * Skip si `actionCount === 0` : pas de mail vide chaque jour qui devient
 * un mail ignoré.
 *
 * Retourne 200 toujours pour ne pas que Vercel retry — l'absence d'action
 * ou un échec downstream sont des cas attendus, pas des erreurs de la route.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron daily-recap] CRON_SECRET manquant — route bloquée')
    return NextResponse.json({ error: 'cron_not_configured' }, { status: 503 })
  }

  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    console.warn('[cron daily-recap] auth invalide')
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const recap = await buildDailyRecap()

  if (recap.actionCount === 0) {
    console.log('[cron daily-recap] skip — 0 action aujourd\'hui')
    return NextResponse.json({ status: 'skipped', actionCount: 0 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const recapTo = process.env.SIGWEB_RECAP_TO_EMAIL ?? 'siguenza.sebastien@gmail.com'
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'contact@sigweb.fr'

  if (!apiKey) {
    console.error('[cron daily-recap] RESEND_API_KEY manquant')
    return NextResponse.json(
      { status: 'error', reason: 'resend_not_configured' },
      { status: 500 }
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sigweb.fr'
  const dashboardUrl = `${baseUrl}/admin/dashboard`

  const resend = new Resend(apiKey)
  const subject = `Récap CRM — ${recap.actionCount} action${recap.actionCount > 1 ? 's' : ''} aujourd'hui`

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: recapTo,
      subject,
      html: renderRecapHtml(recap, dashboardUrl),
      text: renderRecapText(recap, dashboardUrl),
    })

    if (result.error) {
      console.error('[cron daily-recap] resend error', result.error)
      return NextResponse.json({ status: 'send_failed', error: result.error.message })
    }

    console.log(`[cron daily-recap] envoyé — ${recap.actionCount} actions`)
    return NextResponse.json({
      status: 'sent',
      actionCount: recap.actionCount,
      resendId: result.data?.id,
    })
  } catch (err) {
    console.error('[cron daily-recap] exception', err)
    return NextResponse.json({ status: 'exception', error: String(err) })
  }
}
