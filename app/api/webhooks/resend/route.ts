import { NextResponse, type NextRequest } from 'next/server'
import { Webhook } from 'svix'
import { createAdminClient } from '@/lib/supabase/admin'
import type { EmailSendStatus } from '@/types'

/**
 * Webhook Resend — tracking des événements de livraison/ouverture/clic/bounce.
 *
 * Resend signe chaque payload via Svix (HMAC SHA256 + timestamp anti-rejeu).
 * Le secret `RESEND_WEBHOOK_SECRET` est configuré côté Resend Dashboard
 * → Webhooks → "Add endpoint" → "Reveal signing secret".
 *
 * Documentation Resend webhooks :
 *   https://resend.com/docs/dashboard/webhooks/introduction
 *
 * Événements traités :
 *   email.delivered → status='delivered', delivered_at
 *   email.opened    → status='opened', open_count++, first/last_opened_at
 *   email.clicked   → status='clicked', click_count++, first_clicked_at
 *   email.bounced   → status='bounced', bounced_at, bounce_reason
 *   email.complained → status='complained' + auto-unsubscribe du prospect
 *
 * Pas pris en compte (ignoré silencieusement) :
 *   email.sent, email.delivery_delayed, email.scheduled
 *
 * Robustesse :
 *   - Signature invalide → 401 (Resend retentera selon sa policy)
 *   - JSON malformé → 400 (Resend ne retentera pas)
 *   - email_id inconnu en BDD → 200 (event silencieusement ignoré, ex :
 *     email envoyé hors de notre système)
 *   - Toute autre erreur → 500 (Resend retentera)
 *
 * Côté Resend Dashboard : configurer l'URL `https://sigweb.fr/api/webhooks/resend`
 * et activer les 5 events ci-dessus.
 */

interface ResendEvent {
  type: string
  created_at?: string
  data: {
    email_id: string
    bounce?: {
      type?: string
      subType?: string
      message?: string
    }
    [key: string]: unknown
  }
}

// Évite que Next.js ne mette en cache la route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhooks/resend] RESEND_WEBHOOK_SECRET manquant')
    return new NextResponse('Webhook not configured', { status: 500 })
  }

  // 1. Récupère le body brut (Svix verify nécessite le payload exact, pas parsé)
  const bodyRaw = await request.text()

  // 2. Vérifie la signature Svix
  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse('Missing Svix headers', { status: 400 })
  }

  let event: ResendEvent
  try {
    const wh = new Webhook(secret)
    event = wh.verify(bodyRaw, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ResendEvent
  } catch (e) {
    console.warn('[webhooks/resend] signature invalide:', (e as Error).message)
    return new NextResponse('Invalid signature', { status: 401 })
  }

  // 3. Dispatch selon le type
  const supabase = createAdminClient()
  const emailId = event.data?.email_id
  if (!emailId) {
    return NextResponse.json({ ok: true, ignored: 'no email_id' })
  }

  // Lookup de la ligne email_sends par resend_id
  const { data: existing, error: selectErr } = await supabase
    .from('email_sends')
    .select('id, status, prospect_id, open_count, click_count, first_opened_at, first_clicked_at, delivered_at')
    .eq('resend_id', emailId)
    .maybeSingle()

  if (selectErr) {
    console.error('[webhooks/resend] DB select failed:', selectErr.message)
    return new NextResponse('Database error', { status: 500 })
  }

  if (!existing) {
    // Email envoyé hors de notre système (ex : test depuis le dashboard
    // Resend) — on accuse réception sans rien faire.
    return NextResponse.json({ ok: true, ignored: 'unknown email_id' })
  }

  const now = new Date().toISOString()

  switch (event.type) {
    case 'email.delivered': {
      await supabase
        .from('email_sends')
        .update({
          status: 'delivered' as EmailSendStatus,
          delivered_at: existing.delivered_at ?? now,
        })
        .eq('id', existing.id)
      break
    }

    case 'email.opened': {
      // Ne pas régresser le statut si l'email a déjà été cliqué.
      const newStatus: EmailSendStatus =
        existing.status === 'clicked' ? 'clicked' : 'opened'
      await supabase
        .from('email_sends')
        .update({
          status: newStatus,
          first_opened_at: existing.first_opened_at ?? now,
          last_opened_at: now,
          open_count: existing.open_count + 1,
        })
        .eq('id', existing.id)
      break
    }

    case 'email.clicked': {
      await supabase
        .from('email_sends')
        .update({
          status: 'clicked' as EmailSendStatus,
          first_clicked_at: existing.first_clicked_at ?? now,
          click_count: existing.click_count + 1,
        })
        .eq('id', existing.id)
      break
    }

    case 'email.bounced': {
      const reason =
        event.data?.bounce?.message ??
        event.data?.bounce?.type ??
        'Bounce sans détail'
      await supabase
        .from('email_sends')
        .update({
          status: 'bounced' as EmailSendStatus,
          bounced_at: now,
          bounce_reason: reason,
        })
        .eq('id', existing.id)
      break
    }

    case 'email.complained': {
      // Plainte spam → on désabonne immédiatement le prospect (RGPD +
      // protection délivrabilité : continuer à envoyer ferait dégrader
      // notre score Resend).
      await supabase
        .from('email_sends')
        .update({
          status: 'complained' as EmailSendStatus,
        })
        .eq('id', existing.id)

      await supabase
        .from('prospects')
        .update({
          email_unsubscribed: true,
          email_unsubscribed_at: now,
        })
        .eq('id', existing.prospect_id)
      break
    }

    default:
      // Type non géré — on accuse simplement réception.
      return NextResponse.json({ ok: true, ignored: `unhandled type ${event.type}` })
  }

  return NextResponse.json({ ok: true, type: event.type, send_id: existing.id })
}
