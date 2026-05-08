import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateMaquettePreview, ScreenshotProviderError } from '@/lib/email'

/**
 * Route admin de test pour la génération de preview d'email.
 *
 * Usage :
 *   GET /api/admin/email-preview/<prospectId>
 *     → retourne JSON { url, regenerated, target_url } et la preview est
 *       uploadée dans Supabase Storage si pas en cache.
 *
 *   GET /api/admin/email-preview/<prospectId>?redirect=1
 *     → redirige directement vers l'URL Storage de la preview (pour la
 *       voir dans le navigateur).
 *
 * Cette route servira aussi en Phase 5 (modale d'envoi) pour générer la
 * preview au moment de l'ouverture de la modale.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface RouteParams {
  params: Promise<{ prospectId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { prospectId } = await params
  if (!UUID_REGEX.test(prospectId)) {
    return new NextResponse('Bad prospect id', { status: 400 })
  }

  // Récupère la maquette publiée de ce prospect (slug + updated_at).
  // On exige published=true : screenshoter une page non publiée n'a pas
  // de sens (la route /demos/[slug] renverra 404).
  const { data: maquette, error } = await supabase
    .from('maquettes')
    .select('slug, updated_at, published')
    .eq('prospect_id', prospectId)
    .maybeSingle()

  if (error) {
    console.error('[email-preview] fetch maquette', error)
    return new NextResponse('Database error', { status: 500 })
  }
  if (!maquette) {
    return new NextResponse('Aucune maquette pour ce prospect', { status: 404 })
  }
  if (!maquette.published) {
    return new NextResponse(
      'La maquette doit être publiée avant de générer une preview.',
      { status: 409 }
    )
  }

  let result
  try {
    result = await generateMaquettePreview(
      {
        prospectId,
        slug: maquette.slug,
        updatedAt: maquette.updated_at,
      },
      supabase
    )
  } catch (e) {
    if (e instanceof ScreenshotProviderError) {
      console.error('[email-preview] provider failed:', e.message, e.cause)
      return new NextResponse(`Preview generation failed: ${e.message}`, {
        status: 502,
      })
    }
    console.error('[email-preview] unexpected error:', e)
    return new NextResponse('Unexpected error', { status: 500 })
  }

  if (request.nextUrl.searchParams.get('redirect') === '1') {
    return NextResponse.redirect(result.url, { status: 307 })
  }

  return NextResponse.json({
    ...result,
    target_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.sigweb.fr'}/demos/${maquette.slug}?source=preview`,
  })
}
