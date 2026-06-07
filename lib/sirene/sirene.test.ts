import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  enrichBySiret,
  normalizeNaf,
  searchSireneSourcing,
} from './sirene'

/**
 * Helper : stub `globalThis.fetch` avec une mockFn qui retourne une
 * Response Json. `vi.spyOn(global, 'fetch')` ne fonctionne pas dans
 * Node 22 (fetch est non-configurable), il faut utiliser `vi.stubGlobal`.
 */
function stubFetch(): ReturnType<typeof vi.fn> {
  const fn = vi.fn()
  vi.stubGlobal('fetch', fn)
  return fn
}

// ─── normalizeNaf ─────────────────────────────────────────────────

describe('normalizeNaf', () => {
  it('supprime le point séparateur ("10.71C" → "1071C")', () => {
    expect(normalizeNaf('10.71C')).toBe('1071C')
  })

  it('idempotent sur un code déjà compact', () => {
    expect(normalizeNaf('1071C')).toBe('1071C')
  })

  it('met en majuscules', () => {
    expect(normalizeNaf('1071c')).toBe('1071C')
  })

  it('trim les espaces', () => {
    expect(normalizeNaf('  1071C  ')).toBe('1071C')
  })
})

// ─── searchSireneSourcing — branche réseau ────────────────────────

describe('searchSireneSourcing', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = stubFetch()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('échoue proprement si aucune zone fournie', async () => {
    const result = await searchSireneSourcing({})
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('parse')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('construit la query attendue pour un CP + NAF + recentMonths', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ results: [] }), { status: 200 })
    )

    await searchSireneSourcing({
      codePostal: '31000',
      codeNaf: '10.71C',  // doit être normalisé en '1071C'
      recentMonths: 6,
      perPage: 10,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('code_postal=31000')
    expect(url).toContain('activite_principale=1071C')
    expect(url).toContain('etat_administratif=A')
    expect(url).toContain('per_page=10')
    expect(url).toMatch(/date_creation_min=\d{4}-\d{2}-\d{2}/)
  })

  it('plafonne perPage à 25 (limite API)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ results: [] }), { status: 200 })
    )

    await searchSireneSourcing({ codePostal: '31000', perPage: 100 })

    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('per_page=25')
  })

  it('normalise un résultat data.gouv.fr en SireneEstablishment', async () => {
    const raw = {
      nom_complet: 'BOULANGERIE DUPONT',
      nom_raison_sociale: 'SARL DUPONT',
      activite_principale: '1071C',
      libelle_activite_principale: 'Cuisson de produits de boulangerie',
      date_creation: '2025-03-15',
      tranche_effectif_salarie: '02',
      siege: {
        siret: '12345678900012',
        etat_administratif: 'A',
        numero_voie: '12',
        type_voie: 'RUE',
        libelle_voie: 'DE LA PAIX',
        code_postal: '31000',
        libelle_commune: 'TOULOUSE',
      },
    }
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ results: [raw] }), { status: 200 })
    )

    const result = await searchSireneSourcing({ codePostal: '31000' })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(1)
    const e = result.data[0]
    expect(e.siret).toBe('12345678900012')
    expect(e.nom_commerce).toBe('BOULANGERIE DUPONT')
    expect(e.code_naf).toBe('1071C')
    expect(e.libelle_naf).toBe('Cuisson de produits de boulangerie')
    expect(e.date_creation).toBe('2025-03-15')
    expect(e.tranche_effectif).toBe('02')
    expect(e.etat_administratif).toBe('A')
    expect(e.adresse).toBe('12 RUE DE LA PAIX')
    expect(e.code_postal).toBe('31000')
    expect(e.ville).toBe('TOULOUSE')
  })

  it('retourne {ok:false, reason:"http"} sur code 500', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 500 }))
    const result = await searchSireneSourcing({ codePostal: '31000' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('http')
  })

  it('retourne {ok:false, reason:"rate_limited"} sur code 429', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 429 }))
    const result = await searchSireneSourcing({ codePostal: '31000' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('rate_limited')
  })

  it('retourne {ok:false, reason:"network"} si fetch throw', async () => {
    fetchMock.mockRejectedValueOnce(new Error('boom'))
    const result = await searchSireneSourcing({ codePostal: '31000' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('network')
  })

  it('retourne {ok:false, reason:"parse"} si results manque', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ unexpected: 'shape' }), { status: 200 })
    )
    const result = await searchSireneSourcing({ codePostal: '31000' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('parse')
  })

  it('drop les résultats sans SIRET (raw mal formé) plutôt que de throw', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            { siege: { /* pas de siret */ } },
            {
              nom_complet: 'OK',
              siege: { siret: '12345678900013', etat_administratif: 'A' },
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ codePostal: '31000' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].siret).toBe('12345678900013')
  })
})

// ─── enrichBySiret ─────────────────────────────────────────────────

describe('enrichBySiret', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = stubFetch()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejette un SIRET mal formé sans appel HTTP', async () => {
    const result = await enrichBySiret('pas-un-siret')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('parse')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejette un SIRET trop court', async () => {
    const result = await enrichBySiret('12345')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('parse')
  })

  it('accepte un SIRET valide (14 chiffres)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'X',
              siege: { siret: '12345678900012', etat_administratif: 'A' },
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await enrichBySiret('12345678900012')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.siret).toBe('12345678900012')
  })

  it('tolère les espaces dans un SIRET', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'X',
              siege: { siret: '12345678900012', etat_administratif: 'A' },
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await enrichBySiret('123 4567 8900 012')
    expect(result.ok).toBe(true)
  })

  it('retourne not_found si la liste est vide', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ results: [] }), { status: 200 })
    )
    const result = await enrichBySiret('12345678900012')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('not_found')
  })
})
