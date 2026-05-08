import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  EmailEligibilityError,
  renderEmailContent,
  type RenderEmailParams,
} from '@/lib/email'
import type { WebVariant } from '@/types'

/**
 * Route admin de TEST RENDU.
 *
 * Renvoie le HTML rendu (subject + body_html + body_text) sans envoyer
 * d'email — pour visualiser exactement ce que recevra le destinataire.
 *
 *   GET /api/admin/email-render/<prospectId>
 *     → JSON { variant, subject, body_html, body_text, preview_image_url }
 *
 *   GET /api/admin/email-render/<prospectId>?format=html
 *     → renvoie directement le body_html dans le navigateur
 *       (Content-Type: text/html) — visualisation directe.
 *
 *   GET /api/admin/email-render/<prospectId>?variant=sans-site
 *     → force la variante (override scoring auto). Utile pour comparer.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface RouteParams {
  params: Promise<{ prospectId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

  const renderParams: RenderEmailParams = { prospectId, variantOverride }

  let rendered
  try {
    rendered = await renderEmailContent(renderParams, supabase)
  } catch (e) {
    if (e instanceof EmailEligibilityError) {
      return new NextResponse(e.reason, { status: 409 })
    }
    console.error('[email-render] error:', e)
    return new NextResponse(
      `Render failed: ${(e as Error)?.message ?? 'unknown'}`,
      { status: 500 }
    )
  }

  if (request.nextUrl.searchParams.get('format') === 'html') {
    return new NextResponse(rendered.bodyHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }

  return NextResponse.json({
    variant: rendered.variant,
    subject: rendered.subject,
    to_email: rendered.toEmail,
    from: `${rendered.fromName} <${rendered.fromEmail}>`,
    preview_image_url: rendered.previewImageUrl,
    maquette_url: rendered.maquetteUrl,
    body_html: rendered.bodyHtml,
    body_text: rendered.bodyText,
  })
}
