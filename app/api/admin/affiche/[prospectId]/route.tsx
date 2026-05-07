import { NextResponse, type NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { buildAfficheData } from '@/lib/affiche'
import { generateSlugBase } from '@/lib/maquette'
import AfficheDocument from '@/components/affiche/AfficheDocument'
import type { Prospect } from '@/types'

/**
 * Génère et renvoie l'affiche A4 PDF d'un prospect.
 *
 * Modes :
 *   - GET ?preview=1  → Content-Disposition: inline (PDF s'ouvre dans le navigateur)
 *   - GET (sans param) → Content-Disposition: attachment (téléchargement direct)
 *
 * Sécurité : admin only via auth.getUser. Validation de `prospectId` au
 * format UUID v4 standard pour éviter une injection bizarre.
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

  const { data: prospect, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .maybeSingle()

  if (error) {
    console.error('[affiche] fetch prospect', error)
    return new NextResponse('Database error', { status: 500 })
  }
  if (!prospect) return new NextResponse('Prospect not found', { status: 404 })

  let buffer: Buffer
  try {
    const data = await buildAfficheData(prospect as Prospect, supabase)
    // Le composant AfficheDocument enregistre les fonts au mount du module
    // — pas besoin de l'appeler manuellement ici. JSX requis ici (le fichier
    // est en .tsx) pour passer un élément React à `renderToBuffer`.
    const pdfBuffer = await renderToBuffer(<AfficheDocument data={data} />)
    buffer = Buffer.from(pdfBuffer)
  } catch (e) {
    console.error('[affiche] render failed', {
      prospectId,
      message: (e as Error)?.message,
      stack: (e as Error)?.stack,
    })
    return new NextResponse(
      `PDF render failed: ${(e as Error)?.message ?? 'unknown error'}`,
      { status: 500 }
    )
  }

  const isPreview = request.nextUrl.searchParams.get('preview') === '1'
  const filenameSlug = generateSlugBase((prospect as Prospect).nom_commerce)
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `affiche-${filenameSlug}-${dateStamp}.pdf`

  const headers = new Headers({
    'Content-Type': 'application/pdf',
    'Content-Length': String(buffer.length),
    'Cache-Control': 'private, no-store',
  })
  headers.set(
    'Content-Disposition',
    isPreview
      ? `inline; filename="${filename}"`
      : `attachment; filename="${filename}"`
  )

  return new NextResponse(buffer as unknown as BodyInit, { headers })
}
