import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  EmailEligibilityError,
  sendProspectEmail,
  type RenderEmailParams,
} from '@/lib/email'
import type { WebVariant } from '@/types'

/**
 * Route admin de TEST D'ENVOI réel via Resend.
 *
 *   POST /api/admin/email-send-test/<prospectId>
 *     → envoie l'email à `prospect.email`. Pour tester sans spammer un
 *       vrai prospect : créer un prospect "Test" avec ton email perso, puis
 *       appeler cette route. La trace est créée dans `email_sends`.
 *
 *   POST /api/admin/email-send-test/<prospectId>?to=siguenza.sebastien@gmail.com
 *     → override l'adresse de destination. ATTENTION : la trace dans
 *       `email_sends` reste liée au prospect_id réel. À utiliser uniquement
 *       pour des tests admin, jamais en production avec un override sauvage.
 *
 * On exige POST pour éviter qu'un crawl GET déclenche un envoi par
 * inadvertance.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

interface RouteParams {
  params: Promise<{ prospectId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { prospectId } = await params
  if (!UUID_REGEX.test(prospectId)) {
    return new NextResponse('Bad prospect id', { status: 400 })
  }

  const variantParam = request.nextUrl.searchParams.get('variant')
  const variantOverride: WebVariant | undefined =
    variantParam === 'sans-site' || variantParam === 'avec-site'
      ? variantParam
      : undefined

  const toOverrideRaw = request.nextUrl.searchParams.get('to')
  const toOverride =
    toOverrideRaw && EMAIL_REGEX.test(toOverrideRaw) ? toOverrideRaw : undefined

  const renderParams: RenderEmailParams = { prospectId, variantOverride }

  try {
    const sendRow = await sendProspectEmail(renderParams, supabase, {
      toOverride,
    })
    return NextResponse.json({
      success: true,
      send_id: sendRow.id,
      resend_id: sendRow.resend_id,
      to: sendRow.to_email,
      subject: sendRow.subject,
      variant: sendRow.variant,
      preview_image_url: sendRow.preview_image_url,
    })
  } catch (e) {
    if (e instanceof EmailEligibilityError) {
      return NextResponse.json(
        { success: false, error: e.reason },
        { status: 409 }
      )
    }
    console.error('[email-send-test] error:', e)
    return NextResponse.json(
      { success: false, error: (e as Error)?.message ?? 'unknown error' },
      { status: 500 }
    )
  }
}
