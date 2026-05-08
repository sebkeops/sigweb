import 'server-only'

/**
 * Interface neutre d'un provider de screenshot. Permet de basculer
 * d'un service à l'autre (ScreenshotOne / urlbox / APIFlash) sans
 * toucher au code applicatif (`preview-generator.ts`).
 *
 * Si on doit changer de provider plus tard : on écrit une nouvelle
 * implémentation, on l'expose dans `lib/email/screenshot/index.ts`,
 * et on swap dans `getProvider()`. Tout le reste du code consomme
 * `ScreenshotProvider` sans savoir qui est derrière.
 */
export interface ScreenshotOptions {
  viewportWidth: number
  viewportHeight: number
  format: 'jpg' | 'png'
  /** 0-100, ignoré pour PNG. */
  imageQuality?: number
  /** Clé de cache côté provider — invalidation si changée. */
  cacheKey?: string
  /** TTL du cache provider en secondes (défaut : 30 jours). */
  cacheTtlSeconds?: number
}

export interface ScreenshotProvider {
  capture(targetUrl: string, opts: ScreenshotOptions): Promise<Buffer>
}

export class ScreenshotProviderError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'ScreenshotProviderError'
  }
}
