import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildPhotoUrl } from '@/lib/google-places/photos'
import { InMemoryRateLimiter } from '@/lib/rate-limit/in-memory'

/**
 * Proxy public Google Places media pour les pages /demos/[slug].
 *
 * Sécurité (couches successives) :
 *   1. La clé API Google n'est jamais envoyée au navigateur — la requête vers
 *      Google se fait côté serveur, on stream le body de la réponse au client.
 *   2. La `ref` doit avoir le format `places/X/photos/Y` (regex stricte).
 *   3. La `ref` doit être référencée par au moins une maquette **publiée**
 *      — sinon le proxy refuse, ce qui empêche un attaquant de faire défiler
 *      notre quota Google avec des refs valides syntaxiquement.
 *   4. Rate-limit in-memory par IP : 100 req/h.
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

// Module-level singleton : partage le compteur sur toutes les requêtes servies
// par cette instance Node.js. Un nouveau cold-start réinitialise.
const limiter = new InMemoryRateLimiter({
  max: RATE_LIMIT_MAX,
  windowMs: RATE_LIMIT_WINDOW_MS,
})

function getClientIp(request: NextRequest): string {
  // Vercel pose toujours `x-forwarded-for` ; le premier élément est l'IP cliente.
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

async function isRefAuthorized(ref: string): Promise<boolean> {
  const supabase = await createClient()
  // RLS publique sur les maquettes published=true → pas besoin d'élever les
  // privilèges. La requête retourne uniquement les maquettes visibles publiquement.
  const { data, error } = await supabase
    .from('maquettes')
    .select('hero_photo_url, histoire_photo_url, univers_photos_urls')
    .eq('published', true)

  if (error) {
    console.error('[demos/photo] refs lookup', error)
    return false
  }

  for (const m of data ?? []) {
    if (m.hero_photo_url === ref) return true
    if (m.histoire_photo_url === ref) return true
    const arr = m.univers_photos_urls
    if (Array.isArray(arr) && arr.includes(ref)) return true
  }
  return false
}

export async function GET(request: NextRequest) {
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

  const ref = request.nextUrl.searchParams.get('ref')
  if (!ref || !REF_REGEX.test(ref)) {
    return new NextResponse('Bad ref', { status: 400 })
  }

  const widthRaw = parseInt(request.nextUrl.searchParams.get('w') ?? '800', 10)
  const width = Number.isFinite(widthRaw) ? widthRaw : 800

  // Garde-fou anti-abus : on ne sert qu'une ref référencée par une maquette
  // publiée. Sinon n'importe qui pourrait faire défiler notre quota Google
  // avec des refs aléatoires bien formées.
  if (!(await isRefAuthorized(ref))) {
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

  return new NextResponse(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
      // Public + 24h : la ref Google est immuable, mais en cas de retrait
      // de la photo côté commerce on accepte 24h de delta avant invalidation.
      'Cache-Control': 'public, max-age=86400',
      'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
      'X-RateLimit-Remaining': String(decision.remaining),
      'X-RateLimit-Reset': String(Math.ceil(decision.resetAt / 1000)),
    },
  })
}
