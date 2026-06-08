import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  analyzeUrl,
  extractPerfScore,
  isValidHttpUrl,
  PAGESPEED_CACHE_DAYS,
} from './pagespeed'

function stubFetch(): ReturnType<typeof vi.fn> {
  const fn = vi.fn()
  vi.stubGlobal('fetch', fn)
  return fn
}

/** Réponse Lighthouse minimaliste pour les tests. */
function lhResponse(score: number) {
  return new Response(
    JSON.stringify({
      lighthouseResult: {
        categories: { performance: { score } },
      },
    }),
    { status: 200 }
  )
}

// ─── isValidHttpUrl ─────────────────────────────────────────────────

describe('isValidHttpUrl', () => {
  it('accepte http et https', () => {
    expect(isValidHttpUrl('http://example.com')).toBe(true)
    expect(isValidHttpUrl('https://example.com/page')).toBe(true)
  })

  it('rejette les autres protocoles', () => {
    expect(isValidHttpUrl('file:///etc/passwd')).toBe(false)
    expect(isValidHttpUrl('mailto:contact@example.com')).toBe(false)
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejette les chaînes mal formées', () => {
    expect(isValidHttpUrl('pas-une-url')).toBe(false)
    expect(isValidHttpUrl('')).toBe(false)
    expect(isValidHttpUrl('http://')).toBe(false)
  })
})

// ─── extractPerfScore ───────────────────────────────────────────────

describe('extractPerfScore', () => {
  it('convertit 0..1 en 0..100 entier arrondi', () => {
    const raw = { lighthouseResult: { categories: { performance: { score: 0.85 } } } }
    expect(extractPerfScore(raw)).toBe(85)
  })

  it('borne le score dans [0, 100]', () => {
    const high = { lighthouseResult: { categories: { performance: { score: 1.2 } } } }
    expect(extractPerfScore(high)).toBe(100)
    const low = { lighthouseResult: { categories: { performance: { score: -0.5 } } } }
    expect(extractPerfScore(low)).toBe(0)
  })

  it('retourne null sur structure absente ou cassée', () => {
    expect(extractPerfScore(null)).toBeNull()
    expect(extractPerfScore({})).toBeNull()
    expect(extractPerfScore({ lighthouseResult: {} })).toBeNull()
    expect(extractPerfScore({ lighthouseResult: { categories: {} } })).toBeNull()
    expect(extractPerfScore({ lighthouseResult: { categories: { performance: {} } } })).toBeNull()
  })

  it('retourne null si score n\'est pas un number', () => {
    const raw = { lighthouseResult: { categories: { performance: { score: 'fast' } } } }
    expect(extractPerfScore(raw)).toBeNull()
  })

  it('retourne null sur NaN', () => {
    const raw = { lighthouseResult: { categories: { performance: { score: NaN } } } }
    expect(extractPerfScore(raw)).toBeNull()
  })
})

// ─── analyzeUrl ─────────────────────────────────────────────────────

describe('analyzeUrl', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  const ORIGINAL_KEY = process.env.GOOGLE_PAGESPEED_API_KEY

  beforeEach(() => {
    fetchMock = stubFetch()
    process.env.GOOGLE_PAGESPEED_API_KEY = 'test-key'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (ORIGINAL_KEY === undefined) delete process.env.GOOGLE_PAGESPEED_API_KEY
    else process.env.GOOGLE_PAGESPEED_API_KEY = ORIGINAL_KEY
  })

  it('retourne not_configured si pas de clé', async () => {
    delete process.env.GOOGLE_PAGESPEED_API_KEY
    const result = await analyzeUrl('https://example.com')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('not_configured')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('retourne invalid_url sur URL mal formée', async () => {
    const result = await analyzeUrl('pas-une-url')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('invalid_url')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fait 2 appels (mobile + desktop) avec la clé en query', async () => {
    fetchMock
      .mockResolvedValueOnce(lhResponse(0.75))  // mobile
      .mockResolvedValueOnce(lhResponse(0.92))  // desktop

    const result = await analyzeUrl('https://example.com')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    // perf = min(75, 92) = 75 (le plus pessimiste)
    expect(result.data.perf).toBe(75)
    expect(result.data.mobile).toBe(75)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const url1 = fetchMock.mock.calls[0][0] as string
    expect(url1).toContain('strategy=mobile')
    expect(url1).toContain('key=test-key')
    const url2 = fetchMock.mock.calls[1][0] as string
    expect(url2).toContain('strategy=desktop')
  })

  it('si desktop échoue mais mobile ok, retourne quand même mobile', async () => {
    fetchMock
      .mockResolvedValueOnce(lhResponse(0.65))
      .mockResolvedValueOnce(new Response('', { status: 500 }))

    const result = await analyzeUrl('https://example.com')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.perf).toBe(65)
    expect(result.data.mobile).toBe(65)
  })

  it('si mobile échoue, propage l\'erreur (pas de fallback aveugle)', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }))
    const result = await analyzeUrl('https://example.com')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('http')
    // Pas de 2nd appel desktop si mobile a échoué — économie de quota
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retourne rate_limited sur 429', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 429 }))
    const result = await analyzeUrl('https://example.com')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('rate_limited')
  })

  it('retourne network si fetch throw', async () => {
    fetchMock.mockRejectedValueOnce(new Error('boom'))
    const result = await analyzeUrl('https://example.com')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('network')
  })

  it('retourne parse si payload sans score', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ lighthouseResult: {} }), { status: 200 })
    )
    const result = await analyzeUrl('https://example.com')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('parse')
  })
})

// ─── Constantes exportées ────────────────────────────────────────────

describe('PAGESPEED_CACHE_DAYS', () => {
  it('vaut 30 jours par défaut', () => {
    expect(PAGESPEED_CACHE_DAYS).toBe(30)
  })
})
