import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { searchSireneByNameAndCp } from './sirene'

const ORIGINAL_FETCH = global.fetch

beforeEach(() => {
  global.fetch = vi.fn() as unknown as typeof fetch
})
afterEach(() => {
  global.fetch = ORIGINAL_FETCH
  vi.restoreAllMocks()
})

function mockFetchOk(payload: unknown) {
  ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response)
}

function mockFetchHttp(status: number) {
  ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: false,
    status,
    json: async () => ({}),
  } as Response)
}

describe('searchSireneByNameAndCp', () => {
  it('retourne parse si nom vide', async () => {
    const r = await searchSireneByNameAndCp('   ', '69001')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('parse')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('retourne parse si CP vide', async () => {
    const r = await searchSireneByNameAndCp('Boulangerie X', '   ')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('parse')
  })

  it('appelle l\'API avec q + code_postal + etat_administratif=A', async () => {
    mockFetchOk({ results: [] })
    await searchSireneByNameAndCp('Boulangerie X', '69001')
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(calledUrl).toContain('q=Boulangerie+X')
    expect(calledUrl).toContain('code_postal=69001')
    expect(calledUrl).toContain('etat_administratif=A')
  })

  it('résultats vides → ok:true avec data:[] (caller décide not_found)', async () => {
    mockFetchOk({ results: [] })
    const r = await searchSireneByNameAndCp('Truc inexistant', '00000')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data).toEqual([])
  })

  it('rate limit → reason rate_limited', async () => {
    mockFetchHttp(429)
    const r = await searchSireneByNameAndCp('X', '69001')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('rate_limited')
  })

  it('erreur HTTP générique → reason http', async () => {
    mockFetchHttp(500)
    const r = await searchSireneByNameAndCp('X', '69001')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('http')
  })

  it('normalise plusieurs établissements en parallèle', async () => {
    // data.gouv.fr renvoie le SIRET et le code_postal sur l'objet `siege`,
    // pas à la racine. normalizeUniteLegale extrait depuis siege par défaut.
    mockFetchOk({
      results: [
        {
          nom_complet: 'Boulangerie Dupont',
          activite_principale: '1071C',
          libelle_activite_principale: 'Cuisson',
          siege: {
            siret: '12345678901234',
            etat_administratif: 'A',
            code_postal: '69001',
            libelle_commune: 'Lyon',
            activite_principale: '1071C',
          },
        },
        {
          nom_complet: 'Boulangerie Dupont',
          activite_principale: '1071C',
          libelle_activite_principale: 'Cuisson',
          siege: {
            siret: '98765432109876',
            etat_administratif: 'A',
            code_postal: '69001',
            libelle_commune: 'Lyon',
            activite_principale: '1071C',
          },
        },
      ],
    })
    const r = await searchSireneByNameAndCp('Boulangerie Dupont', '69001')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data).toHaveLength(2)
  })
})
