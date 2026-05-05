import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildPhotoUrl } from '@/lib/google-places/photos'

const REF_REGEX = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/

export async function GET(request: NextRequest) {
  // Auth admin obligatoire — la clé Google ne doit fuiter à personne d'autre
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const ref = request.nextUrl.searchParams.get('ref')
  if (!ref || !REF_REGEX.test(ref)) {
    return new NextResponse('Bad ref', { status: 400 })
  }

  const widthRaw = parseInt(request.nextUrl.searchParams.get('w') ?? '400', 10)
  const width = Number.isFinite(widthRaw) ? widthRaw : 400

  const upstream = buildPhotoUrl(ref, width)
  if (!upstream) return new NextResponse('Config error', { status: 500 })

  let res: Response
  try {
    res = await fetch(upstream, { cache: 'no-store' })
  } catch {
    return new NextResponse('Upstream fetch failed', { status: 502 })
  }
  if (!res.ok) return new NextResponse('Photo unavailable', { status: 502 })

  return new NextResponse(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
