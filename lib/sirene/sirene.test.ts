import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  enrichBySiret,
  nafToApiFormat,
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

describe('nafToApiFormat', () => {
  it('ajoute le point après les 2 premiers chiffres ("1071C" → "10.71C")', () => {
    expect(nafToApiFormat('1071C')).toBe('10.71C')
    expect(nafToApiFormat('1013B')).toBe('10.13B')
    expect(nafToApiFormat('4724Z')).toBe('47.24Z')
  })

  it('idempotent sur un code déjà au format API', () => {
    expect(nafToApiFormat('10.71C')).toBe('10.71C')
  })

  it('accepte le format compact en minuscules', () => {
    expect(nafToApiFormat('1071c')).toBe('10.71C')
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
    // Important : l'API exige le format AVEC point. La normalisation
    // côté DB reste compacte mais l'appel API utilise nafToApiFormat.
    expect(url).toContain('activite_principale=10.71C')
    // etat_administratif n'est plus passé en query (déjà default + filtre
    // côté JS plus précis sur l'établissement choisi).
    expect(url).not.toContain('etat_administratif')
    expect(url).toContain('per_page=10')
    // date_creation_min n'est PLUS passé en query car ce param filtre
    // sur l'unité légale, alors qu'on veut filtrer sur l'établissement
    // (cf. cas Chausson Matériaux : SA née en 2010, magasin de 2025).
    expect(url).not.toContain('date_creation_min')
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

  it('rejette les résultats hors zone (siège ailleurs, pas de matching dans le CP)', async () => {
    // Simule LA POSTE : siège à Paris (75015), pas de matching dans le 32600
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'LA POSTE',
              siege: {
                siret: '35600000000048',
                etat_administratif: 'A',
                code_postal: '75015',
                libelle_commune: 'PARIS',
              },
              // matching_etablissements absent ou hors zone
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ codePostal: '32600' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(0)
  })

  it('prend le matching_etablissement du bon CP plutôt que le siège', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'BUREAU DE POSTE LOCAL',
              siege: {
                siret: '35600000000048',
                etat_administratif: 'A',
                code_postal: '75015',
                libelle_commune: 'PARIS',
              },
              matching_etablissements: [
                {
                  siret: '35600000099999',
                  etat_administratif: 'A',
                  code_postal: '32600',
                  libelle_commune: 'LISLE JOURDAIN',
                  numero_voie: '5',
                  type_voie: 'RUE',
                  libelle_voie: 'DE LA POSTE',
                },
              ],
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ codePostal: '32600' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].siret).toBe('35600000099999')
    expect(result.data[0].code_postal).toBe('32600')
    expect(result.data[0].ville).toBe('LISLE JOURDAIN')
  })

  it('exclut les grandes entreprises (categorie_entreprise === "GE")', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'MULTINATIONALE',
              categorie_entreprise: 'GE',
              siege: {
                siret: '12345678900012',
                etat_administratif: 'A',
                code_postal: '32600',
                libelle_commune: 'X',
              },
            },
            {
              nom_complet: 'PETIT COMMERCE',
              categorie_entreprise: 'PME',
              siege: {
                siret: '99999999900099',
                etat_administratif: 'A',
                code_postal: '32600',
                libelle_commune: 'X',
              },
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ codePostal: '32600' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].nom_commerce).toBe('PETIT COMMERCE')
  })

  it('priorise la date_creation de l\'établissement (point de vente) sur celle de l\'unité légale', async () => {
    // Cas Chausson Matériaux : entreprise née en 2010, magasin récent 2025
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'CHAUSSON MATERIAUX',
              date_creation: '2010-01-01',  // unité légale
              siege: {
                siret: '12345678900012',
                etat_administratif: 'A',
                code_postal: '32600',
                libelle_commune: 'L\'ISLE-JOURDAIN',
                date_creation: '2025-04-01',  // établissement (le magasin)
              },
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ codePostal: '32600' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].date_creation).toBe('2025-04-01')
  })

  it('filtre recentMonths sur la date de l\'établissement (pas de l\'unité légale)', async () => {
    // Magasin créé il y a longtemps, même si entreprise mère récente → exclu
    // Et inversement, magasin récent d'une vieille entreprise → inclus
    const longAgo = '1990-01-01'
    const recent = new Date()
    recent.setMonth(recent.getMonth() - 1)
    const recentIso = recent.toISOString().slice(0, 10)

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'VIEUX MAGASIN',
              date_creation: '2025-01-01',
              siege: {
                siret: '11111111111111',
                etat_administratif: 'A',
                code_postal: '32600',
                date_creation: longAgo,  // 1990 — devrait être exclu
              },
            },
            {
              nom_complet: 'NOUVEAU MAGASIN VIEILLE ENTREPRISE',
              date_creation: '1990-01-01',
              siege: {
                siret: '22222222222222',
                etat_administratif: 'A',
                code_postal: '32600',
                date_creation: recentIso,  // récent — devrait être inclus
              },
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ codePostal: '32600', recentMonths: 3 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].siret).toBe('22222222222222')
  })

  it('drop les résultats sans date_creation d\'établissement quand recentMonths est demandé', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'SANS DATE',
              siege: {
                siret: '33333333333333',
                etat_administratif: 'A',
                code_postal: '32600',
                // pas de date_creation
              },
              // pas non plus au niveau unité légale
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ codePostal: '32600', recentMonths: 3 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(0)
  })

  it('recherche par département : choisit le matching dont le CP commence par le département', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'CHAINE NATIONALE',
              siege: {
                siret: '11111111111111',
                etat_administratif: 'A',
                code_postal: '75015',
                libelle_commune: 'PARIS',
              },
              matching_etablissements: [
                {
                  siret: '11111111122222',
                  etat_administratif: 'A',
                  code_postal: '31000',
                  libelle_commune: 'TOULOUSE',
                  date_creation: '2025-03-15',
                },
              ],
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ departement: '31' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].code_postal).toBe('31000')
    expect(result.data[0].siret).toBe('11111111122222')
  })

  it('recherche par département + recentMonths : prend le matching le plus récent', async () => {
    // Date dynamique pour rester dans la fenêtre recentMonths (sinon le
    // test casse au fil des mois). « Récent » = 1 mois en arrière.
    const recent = new Date()
    recent.setMonth(recent.getMonth() - 1)
    const recentIso = recent.toISOString().slice(0, 10)

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'ENTREPRISE AVEC PLUSIEURS MAGASINS',
              siege: {
                siret: '99999999900099',
                etat_administratif: 'A',
                code_postal: '75015',
              },
              matching_etablissements: [
                {
                  siret: '99999999900111',
                  etat_administratif: 'A',
                  code_postal: '31000',
                  date_creation: '2010-01-01',
                },
                {
                  siret: '99999999900222',
                  etat_administratif: 'A',
                  code_postal: '31300',
                  date_creation: recentIso,  // plus récent ET dans la fenêtre
                },
              ],
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ departement: '31', recentMonths: 12 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].siret).toBe('99999999900222')
  })

  it('rejette si aucun matching dans le département recherché', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'AILLEURS',
              siege: {
                siret: '12345678900012',
                etat_administratif: 'A',
                code_postal: '75015',
              },
              matching_etablissements: [
                {
                  siret: '12345678900013',
                  etat_administratif: 'A',
                  code_postal: '69000',  // Rhône, pas Haute-Garonne
                },
              ],
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ departement: '31' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(0)
  })

  it('extrait l\'adresse depuis le champ adresse formaté (cas matching_etablissement sans numero_voie/type_voie séparés)', async () => {
    // Cas observé en prod : pour GRATIBUS (SIRET 10279707300016), le
    // matching_etablissement renvoyé par l'API ne contient PAS
    // numero_voie/type_voie/libelle_voie séparés, uniquement le champ
    // `adresse` formaté complet. La reconstruction depuis les 3 champs
    // donnait une chaîne vide. On doit utiliser `etab.adresse` en
    // priorité et stripper le suffixe " CP COMMUNE".
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'BEROMAF (GRATIBUS)',
              siege: { siret: '10279707300016' },
              matching_etablissements: [
                {
                  siret: '10279707300016',
                  etat_administratif: 'A',
                  code_postal: '32600',
                  libelle_commune: "L'ISLE-JOURDAIN",
                  adresse: "12 RUE DE LA REPUBLIQUE 32600 L'ISLE-JOURDAIN",
                  date_creation: '2026-03-23',
                  // PAS de numero_voie / type_voie / libelle_voie
                },
              ],
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ codePostal: '32600' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(1)
    expect(result.data[0].adresse).toBe('12 RUE DE LA REPUBLIQUE')
    expect(result.data[0].code_postal).toBe('32600')
    expect(result.data[0].ville).toBe("L'ISLE-JOURDAIN")
  })

  it('fallback : reconstruction depuis numero_voie/type_voie/libelle_voie si pas de champ adresse formaté', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'AVEC CHAMPS SEPARES',
              siege: {
                siret: '99999999900099',
                etat_administratif: 'A',
                code_postal: '32600',
                libelle_commune: 'X',
                numero_voie: '5',
                type_voie: 'PLACE',
                libelle_voie: 'DU MARCHE',
                // pas de champ adresse formaté
              },
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ codePostal: '32600' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data[0].adresse).toBe('5 PLACE DU MARCHE')
  })

  it('inclut complement_adresse si disponible', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'AVEC COMPLEMENT',
              siege: {
                siret: '88888888800088',
                etat_administratif: 'A',
                code_postal: '32600',
                libelle_commune: 'X',
                numero_voie: '10',
                type_voie: 'RUE',
                libelle_voie: 'DE LA POSTE',
                complement_adresse: 'BATIMENT B',
                // pas de champ adresse formaté
              },
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ codePostal: '32600' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data[0].adresse).toBe('BATIMENT B 10 RUE DE LA POSTE')
  })

  it('exclut les établissements fermés (etat_administratif != "A")', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              nom_complet: 'FERME',
              siege: {
                siret: '12345678900012',
                etat_administratif: 'F',
                code_postal: '32600',
                libelle_commune: 'X',
              },
            },
          ],
        }),
        { status: 200 }
      )
    )
    const result = await searchSireneSourcing({ codePostal: '32600' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(0)
  })

  it('drop les résultats sans SIRET (raw mal formé) plutôt que de throw', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            { siege: { /* pas de siret */ } },
            {
              nom_complet: 'OK',
              siege: {
                siret: '12345678900013',
                etat_administratif: 'A',
                code_postal: '31000',
              },
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
