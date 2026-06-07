import 'server-only'

/**
 * Adaptateur Sirene — accès aux données légales d'entreprise via l'API
 * publique « Recherche d'entreprises » de data.gouv.fr.
 *
 * Endpoint : https://recherche-entreprises.api.gouv.fr/search
 * Documentation : https://recherche-entreprises.api.gouv.fr/docs/
 *
 * Pourquoi data.gouv.fr plutôt que l'API INSEE Sirene officielle :
 *   - Gratuit, sans clé API ni OAuth à gérer en variable d'env
 *   - Quotas larges (7 req/s par IP), suffit pour un usage CRM artisanal
 *   - Couvre 100 % des besoins sourcing+enrichissement Sigweb
 *
 * Dégradation gracieuse : toutes les fonctions retournent un résultat
 * structuré { ok: true | false } — jamais throw vers le caller. Les
 * erreurs HTTP/réseau/JSON sont loggées et converties en `{ ok: false,
 * reason }`. Le CRM tourne comme avant si l'API est HS.
 *
 * Deux usages :
 *   - `searchSireneSourcing(...)` : sourcing par zone + activité, alimente
 *     l'onglet « Sirene » de /admin/crm/sourcing
 *   - `enrichBySiret(siret)` : enrichissement d'un prospect existant par
 *     son SIRET (bouton « Enrichir Sirene » sur la fiche, Lot 2)
 *
 * Convention de nommage : on garde les libellés français de l'API
 * (matricule_naf, etat_administratif, etc.) pour faciliter le mapping
 * direct avec les colonnes DB (cf. migration crm_sirene_pagespeed.sql).
 */

const API_BASE = 'https://recherche-entreprises.api.gouv.fr/search'

/** Timeout de l'appel HTTP — l'API répond généralement en <1s. */
const REQUEST_TIMEOUT_MS = 5_000

// ─── Types publics ──────────────────────────────────────────────────

/**
 * Résultat normalisé d'un établissement Sirene (au niveau ETABLISSEMENT,
 * pas UNITE LEGALE — un commerce = un établissement, identifié par son
 * SIRET unique).
 *
 * On normalise SEULEMENT les champs filtrables qui ont une colonne DB
 * dédiée. Tout le reste reste accessible via `raw` (stocké en jsonb).
 */
export interface SireneEstablishment {
  siret: string
  nom_commerce: string  // 'denomination' de l'unité légale, ou nom commercial
  code_naf: string | null
  libelle_naf: string | null
  date_creation: string | null  // YYYY-MM-DD
  tranche_effectif: string | null
  etat_administratif: 'A' | 'F' | 'C' | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  /** Payload brut data.gouv.fr — à stocker tel quel dans sirene_raw. */
  raw: unknown
}

export type SireneResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'network' | 'http' | 'parse' | 'timeout' | 'not_found' | 'rate_limited' }

// ─── API publique ────────────────────────────────────────────────────

export interface SireneSourcingParams {
  /** Code postal OU département (2-3 chiffres) OU commune. Au moins un. */
  codePostal?: string
  departement?: string
  commune?: string
  /** Code NAF (rev2, format '1071C' ou '10.71C'). On normalise les 2 formats. */
  codeNaf?: string
  /**
   * Si fourni, ne retourne que les établissements créés depuis moins de
   * `recentMonths` mois (utile pour cibler les commerces neufs invisibles
   * sur Google).
   */
  recentMonths?: number
  /** Page size, plafonnée à 25 (limite API). */
  perPage?: number
  /** Page d'index, 1-based. */
  page?: number
}

/**
 * Sourcing : recherche d'établissements par zone + activité.
 *
 * Retourne uniquement les établissements actifs (`etat_administratif='A'`)
 * pour ne pas polluer la liste avec des entreprises fermées/cessées.
 */
export async function searchSireneSourcing(
  params: SireneSourcingParams
): Promise<SireneResult<SireneEstablishment[]>> {
  const url = new URL(API_BASE)

  // Géo : on privilégie code postal > commune > département. L'API accepte
  // ces 3 critères mais code_postal est le plus précis.
  if (params.codePostal) {
    url.searchParams.set('code_postal', params.codePostal)
  } else if (params.commune) {
    url.searchParams.set('q', params.commune)
  } else if (params.departement) {
    url.searchParams.set('departement', params.departement)
  } else {
    return { ok: false, reason: 'parse' }  // aucune zone fournie
  }

  // Activité : on normalise le code NAF en virant les éventuels points
  // (data.gouv.fr accepte '1071C' et '10.71C', on s'aligne sur '1071C').
  if (params.codeNaf) {
    url.searchParams.set('activite_principale', normalizeNaf(params.codeNaf))
  }

  // Filtre « créés récemment » : data.gouv.fr expose `date_creation_min`
  // (date minimale de création) au format YYYY-MM-DD.
  if (params.recentMonths && params.recentMonths > 0) {
    const minDate = new Date()
    minDate.setMonth(minDate.getMonth() - params.recentMonths)
    url.searchParams.set('date_creation_min', minDate.toISOString().slice(0, 10))
  }

  url.searchParams.set('etat_administratif', 'A')
  url.searchParams.set('per_page', String(Math.min(params.perPage ?? 25, 25)))
  url.searchParams.set('page', String(params.page ?? 1))

  const response = await safeFetchJson(url.toString())
  if (!response.ok) return response

  const data = response.data as { results?: unknown[] } | undefined
  if (!data || !Array.isArray(data.results)) {
    return { ok: false, reason: 'parse' }
  }

  const establishments: SireneEstablishment[] = []
  for (const result of data.results) {
    const normalized = normalizeUniteLegale(result)
    if (normalized) establishments.push(normalized)
  }

  return { ok: true, data: establishments }
}

/**
 * Enrichissement : récupère les données légales d'un prospect existant
 * par son SIRET. Utilisé par le bouton « Enrichir Sirene » sur la fiche
 * (Lot 2) et lors d'un import quand on dispose déjà du SIRET.
 */
export async function enrichBySiret(
  siret: string
): Promise<SireneResult<SireneEstablishment>> {
  const cleaned = siret.replace(/\s+/g, '')
  if (!/^\d{14}$/.test(cleaned)) {
    return { ok: false, reason: 'parse' }
  }

  const url = new URL(API_BASE)
  url.searchParams.set('q', cleaned)
  url.searchParams.set('per_page', '1')

  const response = await safeFetchJson(url.toString())
  if (!response.ok) return response

  const data = response.data as { results?: unknown[] } | undefined
  const first = data?.results?.[0]
  if (!first) return { ok: false, reason: 'not_found' }

  const normalized = normalizeUniteLegale(first)
  if (!normalized) return { ok: false, reason: 'parse' }

  return { ok: true, data: normalized }
}

// ─── Helpers internes ───────────────────────────────────────────────

/**
 * Fetch JSON avec timeout + gestion d'erreurs explicite. Convertit
 * tous les cas d'échec en `SireneResult` sans throw.
 */
async function safeFetchJson(
  url: string
): Promise<SireneResult<unknown>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    if (res.status === 429) {
      console.warn('[sirene] rate limited')
      return { ok: false, reason: 'rate_limited' }
    }
    if (!res.ok) {
      console.warn(`[sirene] http ${res.status} ${url}`)
      return { ok: false, reason: 'http' }
    }

    const json = await res.json()
    return { ok: true, data: json }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[sirene] timeout', url)
      return { ok: false, reason: 'timeout' }
    }
    console.warn('[sirene] network error', err)
    return { ok: false, reason: 'network' }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Normalise le code NAF en supprimant le point séparateur :
 *   '10.71C' → '1071C'
 *   '1071C'  → '1071C'  (idempotent)
 *
 * data.gouv.fr accepte les deux formats mais on s'aligne sur la forme
 * compacte pour le stockage en DB.
 */
export function normalizeNaf(code: string): string {
  return code.trim().toUpperCase().replace(/\./g, '')
}

/**
 * Convertit un résultat brut data.gouv.fr en `SireneEstablishment`.
 *
 * data.gouv.fr renvoie des UNITES LEGALES avec un tableau `matching_etablissements`.
 * Pour le sourcing, on prend le siège (`siege.siret`) ou le premier matching.
 *
 * Retourne null si l'objet est mal formé.
 */
function normalizeUniteLegale(raw: unknown): SireneEstablishment | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const siege = obj.siege as Record<string, unknown> | undefined
  const matchings = Array.isArray(obj.matching_etablissements)
    ? (obj.matching_etablissements as Record<string, unknown>[])
    : []
  const etab = siege ?? matchings[0]
  if (!etab) return null

  const siret = typeof etab.siret === 'string' ? etab.siret : null
  if (!siret) return null

  const nom =
    (typeof obj.nom_complet === 'string' && obj.nom_complet) ||
    (typeof obj.nom_raison_sociale === 'string' && obj.nom_raison_sociale) ||
    'Établissement sans nom'

  const codeNaf =
    typeof obj.activite_principale === 'string' ? obj.activite_principale : null
  const libelleNaf =
    typeof obj.libelle_activite_principale === 'string'
      ? obj.libelle_activite_principale
      : null

  const dateCreation =
    typeof obj.date_creation === 'string' ? obj.date_creation : null
  const trancheEffectif =
    typeof obj.tranche_effectif_salarie === 'string'
      ? obj.tranche_effectif_salarie
      : null

  const etatRaw =
    typeof etab.etat_administratif === 'string' ? etab.etat_administratif : null
  const etat: 'A' | 'F' | 'C' | null =
    etatRaw === 'A' || etatRaw === 'F' || etatRaw === 'C' ? etatRaw : null

  const numero =
    typeof etab.numero_voie === 'string' ? etab.numero_voie : ''
  const typeVoie =
    typeof etab.type_voie === 'string' ? etab.type_voie : ''
  const libelleVoie =
    typeof etab.libelle_voie === 'string' ? etab.libelle_voie : ''
  const adresse =
    [numero, typeVoie, libelleVoie].filter(Boolean).join(' ').trim() || null

  const codePostal =
    typeof etab.code_postal === 'string' ? etab.code_postal : null
  const ville =
    typeof etab.libelle_commune === 'string' ? etab.libelle_commune : null

  return {
    siret,
    nom_commerce: nom,
    code_naf: codeNaf,
    libelle_naf: libelleNaf,
    date_creation: dateCreation,
    tranche_effectif: trancheEffectif,
    etat_administratif: etat,
    adresse,
    code_postal: codePostal,
    ville,
    raw,
  }
}
