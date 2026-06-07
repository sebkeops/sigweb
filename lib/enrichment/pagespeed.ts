import 'server-only'

/**
 * Adaptateur Google PageSpeed Insights v5 (intégration sourcing/scoring).
 *
 * Endpoint : https://www.googleapis.com/pagespeedonline/v5/runPagespeed
 * Documentation : https://developers.google.com/speed/docs/insights/v5/get-started
 *
 * Coût : 1 appel = 10-30 s (Google analyse vraiment la page). Quota
 * quotidien dépendant de la clé. Pour rester sous le quota, le cron
 * batch traite les `pagespeed_status='pending'` une fois par jour avec
 * un délai entre les appels.
 *
 * IMPORTANT : ne PAS appeler synchronement depuis une route web — le
 * délai bloquerait la requête utilisateur. Le pattern est :
 *   1. Import / bouton fiche → INSERT/UPDATE prospects.pagespeed_status='pending'
 *   2. Cron quotidien → fetch les pending, appelle analyzeUrl, persiste
 *
 * Dégradation gracieuse : pas de clé API → toutes les fonctions
 * retournent {ok:false, reason:'not_configured'} sans throw. Le CRM
 * tourne comme avant si la clé manque (les colonnes pagespeed_*
 * restent null, signalées dans l'UI comme « non analysé »).
 *
 * Cache : on n'analyse pas une URL si elle a déjà été analysée il y a
 * moins de PAGESPEED_CACHE_DAYS (30 par défaut). Le caller vérifie
 * `pagespeed_analyzed_at` avant d'appeler.
 */

const API_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

const REQUEST_TIMEOUT_MS = 60_000  // l'API peut mettre 30s, marge 2x

/** Cache : nb de jours sous lequel on ne réanalyse pas la même URL. */
export const PAGESPEED_CACHE_DAYS = 30

// ─── Types publics ──────────────────────────────────────────────────

export interface PageSpeedScores {
  /** Score performance global (0..100) — `lighthouseResult.categories.performance.score * 100`. */
  perf: number
  /**
   * Score performance mobile distinct. PageSpeed v5 accepte `strategy`
   * (mobile|desktop) ; on lance les 2 et prend le pire pour signaler le
   * besoin d'un site mobile-friendly. Null si seul desktop a été lancé.
   */
  mobile: number | null
  /** Payload brut Lighthouse pour audit ultérieur (sirene_raw analogue). */
  raw: unknown
}

export type PageSpeedResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      reason:
        | 'not_configured'   // pas de GOOGLE_PAGESPEED_API_KEY
        | 'invalid_url'      // URL mal formée
        | 'http'             // 4xx/5xx
        | 'rate_limited'     // 429
        | 'network'          // exception réseau
        | 'timeout'          // > REQUEST_TIMEOUT_MS
        | 'parse'            // payload sans le score attendu
    }

// ─── API publique ──────────────────────────────────────────────────

/**
 * Analyse une URL (lance mobile + desktop séquentiellement et fusionne).
 *
 * Retourne le score perf le plus pessimiste entre les 2 stratégies, et
 * le mobile distinct. Cas usage : décider du potentiel « refonte »
 * d'un site existant pour le scoring.
 */
export async function analyzeUrl(
  url: string
): Promise<PageSpeedResult<PageSpeedScores>> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY
  if (!apiKey) {
    return { ok: false, reason: 'not_configured' }
  }

  if (!isValidHttpUrl(url)) {
    return { ok: false, reason: 'invalid_url' }
  }

  // 1ère passe : mobile (la + révélatrice pour commerces locaux)
  const mobileRes = await fetchPagespeedRun(url, apiKey, 'mobile')
  if (!mobileRes.ok) return mobileRes

  // 2nde passe : desktop pour avoir une vue globale
  const desktopRes = await fetchPagespeedRun(url, apiKey, 'desktop')
  if (!desktopRes.ok) {
    // Desktop a échoué mais mobile a réussi — on retourne au moins mobile.
    return {
      ok: true,
      data: {
        perf: mobileRes.data.perfScore,
        mobile: mobileRes.data.perfScore,
        raw: { mobile: mobileRes.data.raw },
      },
    }
  }

  // Pire des 2 scores = signal le plus actionnable pour le scoring
  const perf = Math.min(mobileRes.data.perfScore, desktopRes.data.perfScore)

  return {
    ok: true,
    data: {
      perf,
      mobile: mobileRes.data.perfScore,
      raw: { mobile: mobileRes.data.raw, desktop: desktopRes.data.raw },
    },
  }
}

// ─── Internes ──────────────────────────────────────────────────────

interface RunResult {
  perfScore: number
  raw: unknown
}

async function fetchPagespeedRun(
  url: string,
  apiKey: string,
  strategy: 'mobile' | 'desktop'
): Promise<PageSpeedResult<RunResult>> {
  const apiUrl = new URL(API_BASE)
  apiUrl.searchParams.set('url', url)
  apiUrl.searchParams.set('key', apiKey)
  apiUrl.searchParams.set('strategy', strategy)
  apiUrl.searchParams.set('category', 'performance')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(apiUrl.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    if (res.status === 429) {
      console.warn('[pagespeed] rate limited')
      return { ok: false, reason: 'rate_limited' }
    }
    if (!res.ok) {
      console.warn(`[pagespeed] http ${res.status} ${strategy} ${url}`)
      return { ok: false, reason: 'http' }
    }

    const json = (await res.json()) as unknown
    const score = extractPerfScore(json)
    if (score === null) {
      console.warn(`[pagespeed] parse error ${strategy} ${url}`)
      return { ok: false, reason: 'parse' }
    }

    return { ok: true, data: { perfScore: score, raw: json } }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn(`[pagespeed] timeout ${strategy} ${url}`)
      return { ok: false, reason: 'timeout' }
    }
    console.warn(`[pagespeed] network ${strategy}`, err)
    return { ok: false, reason: 'network' }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Extrait le score perf 0..100 du payload Lighthouse v5.
 * Structure : `lighthouseResult.categories.performance.score` ∈ [0, 1].
 */
export function extractPerfScore(raw: unknown): number | null {
  if (!raw || typeof raw !== 'object') return null
  const lh = (raw as { lighthouseResult?: unknown }).lighthouseResult
  if (!lh || typeof lh !== 'object') return null
  const cats = (lh as { categories?: unknown }).categories
  if (!cats || typeof cats !== 'object') return null
  const perf = (cats as { performance?: unknown }).performance
  if (!perf || typeof perf !== 'object') return null
  const score = (perf as { score?: unknown }).score
  if (typeof score !== 'number' || Number.isNaN(score)) return null
  return Math.round(Math.max(0, Math.min(1, score)) * 100)
}

/**
 * Validation URL — accepte http/https uniquement. Pas de file://, mailto:, etc.
 */
export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
