/**
 * Rate-limiter in-memory à fenêtre fixe.
 *
 * Limites V1 :
 * - simple, sans persistance : à chaque redéploiement Vercel les compteurs
 *   repartent à zéro, et chaque instance serverless a sa propre Map.
 *   Suffisant pour limiter l'abus opportuniste, pas pour bloquer un attaquant
 *   déterminé. Si on observe vraiment de l'abus → migration Upstash Redis.
 * - pas de file d'attente : au-delà de la limite, on rejette immédiatement.
 * - pas de TTL : un Map qui grossit indéfiniment finirait par leak la mémoire,
 *   donc nettoyage opportuniste à chaque appel quand la taille dépasse un seuil.
 */

export interface RateLimitDecision {
  ok: boolean
  remaining: number
  resetAt: number
}

export interface RateLimiterConfig {
  /** Nombre max de requêtes autorisées par fenêtre. */
  max: number
  /** Durée de la fenêtre en millisecondes. */
  windowMs: number
  /** Au-delà de cette taille, on purge les entrées expirées (anti-leak). */
  cleanupThreshold?: number
  /** Source d'horodatage injectable (utile en tests). */
  now?: () => number
}

interface Bucket {
  count: number
  resetAt: number
}

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>()
  private readonly max: number
  private readonly windowMs: number
  private readonly cleanupThreshold: number
  private readonly now: () => number

  constructor(config: RateLimiterConfig) {
    this.max = config.max
    this.windowMs = config.windowMs
    this.cleanupThreshold = config.cleanupThreshold ?? 5000
    this.now = config.now ?? Date.now
  }

  /** Consomme 1 jeton pour `key`. Retourne la décision. */
  hit(key: string): RateLimitDecision {
    const now = this.now()
    this.cleanupIfNeeded(now)

    const bucket = this.buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      // Nouvelle fenêtre pour cette clé
      const resetAt = now + this.windowMs
      this.buckets.set(key, { count: 1, resetAt })
      return { ok: true, remaining: this.max - 1, resetAt }
    }

    if (bucket.count >= this.max) {
      return { ok: false, remaining: 0, resetAt: bucket.resetAt }
    }

    bucket.count += 1
    return {
      ok: true,
      remaining: this.max - bucket.count,
      resetAt: bucket.resetAt,
    }
  }

  /** Pour les tests uniquement. */
  size(): number {
    return this.buckets.size
  }

  private cleanupIfNeeded(now: number): void {
    if (this.buckets.size < this.cleanupThreshold) return
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key)
    }
  }
}
