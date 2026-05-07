import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildPhotoUrl } from '@/lib/google-places/photos'
import { InMemoryRateLimiter } from '@/lib/rate-limit/in-memory'
import type { MaquettePhotoEntry } from '@/types'

/**
 * Proxy public Google Places media pour les pages /demos/[slug].
 *
 * Sécurité (couches successives) :
 *   1. La clé API Google n'est jamais envoyée au navigateur — la requête vers
 *      Google se fait côté serveur, on stream le body de la réponse au client.
 *   2. La `ref` doit avoir le format `places/X/photos/Y` (regex stricte).
 *   3. Visiteur public : la `ref` doit être référencée par le pool d'au moins
 *      une maquette **publiée** (`available_photos`). Empêche l'abus du quota
 *      Google avec des refs aléatoires bien formées.
 *   4. Admin authentifié : bypass des restrictions ci-dessus — toute ref
 *      présente dans `available_photos` de N'IMPORTE QUELLE maquette est OK.
 *      Utilisé par le PhotoManager (galerie d'éditeur) et la preview admin
 *      d'une maquette non publiée.
 *   5. Rate-limit in-memory par IP : 100 req/h. Bypass admin authentifié
 *      (le PhotoManager peut afficher 10+ vignettes par maquette).
 *
 * Limites du rate-limit in-memory :
 *   - reset à chaque redéploiement
 *   - chaque instance serverless a son propre compteur
 *   Suffisant pour stopper l'abus opportuniste. Migration Upstash plus tard
 *   si on observe vraiment de l'abus.
 */

const REF_REGEX = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/

const RATE_LIMIT_MAX = 100
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

const limiter = new InMemoryRateLimiter({
  max: RATE_LIMIT_MAX,
  windowMs: RATE_LIMIT_WINDOW_MS,
})

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

/**
 * Vérifie si `ref` est autorisée.
 *
 * Pour un admin (`isAdmin = true`) : on cherche dans `available_photos` de
 * TOUTES les maquettes (peu importe `published`).
 * Pour un visiteur public : seulement dans les maquettes `published = true`.
 */
async function isRefAuthorized(ref: string, isAdmin: boolean): Promise<boolean> {
  const supabase = await createClient()
  let query = supabase
    .from('maquettes')
    .select('available_photos')
  if (!isAdmin) query = query.eq('published', true)

  const { data, error } = await query
  if (error) {
    console.error('[demos/photo] refs lookup', error)
    return false
  }

  for (const m of data ?? []) {
    const pool = m.available_photos as MaquettePhotoEntry[] | null
    if (!Array.isArray(pool)) continue
    for (const photo of pool) {
      if (photo?.reference === ref) return true
    }
  }
  return false
}

export async function GET(request: NextRequest) {
  // Détection admin : on vérifie l'auth Supabase. Une session admin valide
  // bypass le rate-limit ET autorise les refs des maquettes non publiées.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = !!user

  if (!isAdmin) {
    const ip = getClientIp(request)
    const decision = limiter.hit(ip)
    if (!decision.ok) {
      return new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(decision.resetAt / 1000)),
          'Retry-After': String(Math.max(1, Math.ceil((decision.resetAt - Date.now()) / 1000))),
        },
      })
    }
  }

  const ref = request.nextUrl.searchParams.get('ref')
  if (!ref || !REF_REGEX.test(ref)) {
    return new NextResponse('Bad ref', { status: 400 })
  }

  const widthRaw = parseInt(request.nextUrl.searchParams.get('w') ?? '800', 10)
  const width = Number.isFinite(widthRaw) ? widthRaw : 800

  if (!(await isRefAuthorized(ref, isAdmin))) {
    return new NextResponse('Photo not found', { status: 404 })
  }

  const upstream = buildPhotoUrl(ref, width)
  if (!upstream) return new NextResponse('Config error', { status: 500 })

  let res: Response
  try {
    res = await fetch(upstream, { cache: 'no-store' })
  } catch {
    return new NextResponse('Upstream fetch failed', { status: 502 })
  }
  if (!res.ok) return new NextResponse('Photo unavailable', { status: 502 })

  // Cache-Control : pour les admins on évite le cache public CDN car la photo
  // peut être dans une maquette non publiée (ne pas cacher en bordure).
  const cacheControl = isAdmin
    ? 'private, max-age=3600'
    : 'public, max-age=86400'

  return new NextResponse(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
      'Cache-Control': cacheControl,
    },
  })
}
