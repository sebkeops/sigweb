import 'server-only'
import {
  ScreenshotProvider,
  ScreenshotOptions,
  ScreenshotProviderError,
} from './types'

/**
 * Implémentation ScreenshotOne (https://screenshotone.com).
 *
 * Provider choisi pour son free tier large (100 captures/mois), son API
 * REST simple par GET, son cache intégré (cache_key + cache_ttl) et sa
 * doc claire. Cf. brief Phase 1.
 *
 * Endpoint unique : `GET /take?access_key=...&url=...&...params`
 * Réponse : binaire JPEG/PNG avec Content-Type `image/jpeg` ou `image/png`.
 */
const ENDPOINT = 'https://api.screenshotone.com/take'

/** Timeout du fetch — au-delà, on abandonne et on tombera sur le fallback
 *  gracieux côté caller. ScreenshotOne renvoie en général en 3-8s pour
 *  une page Next.js avec fonts + images. */
const TIMEOUT_MS = 30_000

export class ScreenshotOneProvider implements ScreenshotProvider {
  constructor(private readonly accessKey: string) {
    if (!accessKey) {
      throw new Error('ScreenshotOneProvider: accessKey requis')
    }
  }

  async capture(targetUrl: string, opts: ScreenshotOptions): Promise<Buffer> {
    const params = new URLSearchParams({
      access_key: this.accessKey,
      url: targetUrl,
      viewport_width: String(opts.viewportWidth),
      viewport_height: String(opts.viewportHeight),
      format: opts.format,
      // Pas de full-page : on capture exactement le viewport (open graph 1.91:1).
      full_page: 'false',
      // Bloque les bandeaux qui peuvent polluer la capture.
      block_ads: 'true',
      block_cookie_banners: 'true',
      block_chats: 'true',
      // Pour une SPA Next.js, attendre que les requêtes réseau se calment :
      // garantit que les fonts Google + images Supabase sont bien chargées.
      wait_until: 'networkidle0',
    })

    if (opts.imageQuality !== undefined && opts.format === 'jpg') {
      params.set('image_quality', String(opts.imageQuality))
    }

    if (opts.cacheKey) {
      params.set('cache', 'true')
      params.set('cache_key', opts.cacheKey)
      params.set('cache_ttl', String(opts.cacheTtlSeconds ?? 60 * 60 * 24 * 30))
    }

    const url = `${ENDPOINT}?${params.toString()}`

    let res: Response
    try {
      res = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: 'no-store',
      })
    } catch (e) {
      const isTimeout = e instanceof DOMException && e.name === 'TimeoutError'
      throw new ScreenshotProviderError(
        isTimeout
          ? `ScreenshotOne timeout après ${TIMEOUT_MS}ms`
          : 'ScreenshotOne — échec réseau',
        e
      )
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new ScreenshotProviderError(
        `ScreenshotOne HTTP ${res.status} : ${body.slice(0, 300)}`
      )
    }

    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
}
