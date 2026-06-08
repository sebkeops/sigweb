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

  // Activité : data.gouv.fr exige le format AVEC point ('10.13B', pas
  // '1013B'). Notre DB stocke compact ; on convertit au format API ici.
  // Vérifié 2026-06-08 : sans le point, l'API renvoie une 400 avec
  // « Au moins un paramètre activite_principale est non valide ».
  if (params.codeNaf) {
    url.searchParams.set('activite_principale', nafToApiFormat(params.codeNaf))
  }

  // Filtre « créés récemment » : on N'utilise PAS `date_creation_min`
  // côté API car il filtre sur la date de création de l'UNITE LEGALE
  // (l'entreprise), pas de l'ETABLISSEMENT. Cas observé : Chausson
  // Matériaux SA créée en 2010, mais son magasin dans le 32600 est de
  // 2025 — on veut le magasin, pas l'entreprise mère.
  // → on filtre côté JS sur `etab.date_creation` du matching choisi.

  // etat_administratif='A' n'est plus passé en query : c'est déjà le défaut
  // serveur ET on filtre en plus côté JS sur l'établissement choisi (le
  // siège peut être Actif alors qu'un établissement secondaire est Fermé).
  url.searchParams.set('per_page', String(Math.min(params.perPage ?? 25, 25)))
  url.searchParams.set('page', String(params.page ?? 1))

  const response = await safeFetchJson(url.toString())
  if (!response.ok) return response

  const data = response.data as { results?: unknown[] } | undefined
  if (!data || !Array.isArray(data.results)) {
    return { ok: false, reason: 'parse' }
  }

  // Calcule la borne basse de date_creation côté JS (si recentMonths
  // passé). On préfère cette approche au filtre serveur date_creation_min
  // qui s'applique à l'unité légale et non à l'établissement.
  let dateCreationMin: string | null = null
  if (params.recentMonths && params.recentMonths > 0) {
    const minDate = new Date()
    minDate.setMonth(minDate.getMonth() - params.recentMonths)
    dateCreationMin = minDate.toISOString().slice(0, 10)
  }

  const establishments: SireneEstablishment[] = []
  for (const result of data.results) {
    // On passe le CP recherché : si l'unité légale a un établissement
    // dans ce CP (matching_etablissements), on prend celui-là plutôt
    // que le siège. Évite « LA POSTE retourne son siège Paris » alors
    // qu'on cherche dans le 32600.
    const normalized = normalizeUniteLegale(result, params.codePostal)
    if (!normalized) continue
    // Filtre côté JS : si CP recherché, on rejette les normalizes qui
    // n'ont PAS d'établissement dans ce CP (le siège a été pris en
    // fallback mais ce n'est pas notre cible).
    if (params.codePostal && normalized.code_postal !== params.codePostal) {
      continue
    }
    // etat_administratif='A' uniquement (filtre côté JS sur l'établissement
    // choisi, plus précis que le filtre serveur sur l'unité légale).
    if (normalized.etat_administratif && normalized.etat_administratif !== 'A') {
      continue
    }
    // Exclusion des grandes entreprises (catégorie_entreprise = 'GE') :
    // La Poste, SNCF Réseau, Société Générale, etc. ne sont pas notre
    // cible commerces de proximité.
    const cat = (result as { categorie_entreprise?: unknown }).categorie_entreprise
    if (cat === 'GE') continue
    // Filtre « créés récemment » côté JS — sur la date de création de
    // l'établissement (Chausson Matériaux SA née en 2010 mais son
    // magasin du 32600 est un SIRET de 2025).
    if (
      dateCreationMin &&
      normalized.date_creation &&
      normalized.date_creation < dateCreationMin
    ) {
      continue
    }
    // Garde-fou : si on a un filtre date mais qu'on n'a PAS la
    // date_creation de l'établissement (champ absent), on rejette par
    // précaution — éviter d'afficher des résultats potentiellement vieux.
    if (dateCreationMin && !normalized.date_creation) {
      continue
    }
    establishments.push(normalized)
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
 * Normalise le code NAF en supprimant le point séparateur, pour le
 * stockage en DB et la sortie :
 *   '10.71C' → '1071C'
 *   '1071C'  → '1071C'  (idempotent)
 *
 * Note : pour APPELER data.gouv.fr, utiliser `nafToApiFormat` (qui ré-injecte
 * le point), car l'API exige strictement le format avec point séparateur.
 */
export function normalizeNaf(code: string): string {
  return code.trim().toUpperCase().replace(/\./g, '')
}

/**
 * Convertit un code NAF compact en format API data.gouv.fr (avec point) :
 *   '1071C'  → '10.71C'
 *   '10.71C' → '10.71C' (idempotent)
 *
 * Format INSEE NAF rev2 : 2 chiffres + point + 2 chiffres + 1 lettre.
 * Vérifié 2026-06-08 : sans le point, l'API rejette le param avec 400.
 */
export function nafToApiFormat(code: string): string {
  const compact = normalizeNaf(code)
  // Si déjà au bon format compact, ré-injecte le point après les 2 1ers chiffres
  if (/^\d{2}\d{2}[A-Z]?$/.test(compact)) {
    return `${compact.slice(0, 2)}.${compact.slice(2)}`
  }
  return code  // format inconnu, on laisse — l'API rejettera proprement
}

/**
 * Convertit un résultat brut data.gouv.fr en `SireneEstablishment`.
 *
 * data.gouv.fr renvoie des UNITES LEGALES avec un tableau `matching_etablissements`.
 * Si un `codePostalFilter` est fourni (recherche par CP), on prend EN
 * PRIORITÉ l'établissement matching qui est dans ce CP — évite le bug
 * « LA POSTE → siège Paris alors qu'on cherchait dans 32600 ».
 * Sinon, on prend le siège.
 *
 * Retourne null si l'objet est mal formé.
 */
function normalizeUniteLegale(
  raw: unknown,
  codePostalFilter?: string
): SireneEstablishment | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const siege = obj.siege as Record<string, unknown> | undefined
  const matchings = Array.isArray(obj.matching_etablissements)
    ? (obj.matching_etablissements as Record<string, unknown>[])
    : []

  // Priorité : matching_etablissement qui est dans le CP recherché.
  // Si pas de CP filtre, ou pas de matching dans ce CP, fallback siège.
  let etab: Record<string, unknown> | undefined
  if (codePostalFilter) {
    etab = matchings.find(
      (m) => typeof m.code_postal === 'string' && m.code_postal === codePostalFilter
    )
  }
  if (!etab) etab = siege ?? matchings[0]
  if (!etab) return null

  const siret = typeof etab.siret === 'string' ? etab.siret : null
  if (!siret) return null

  const nom =
    (typeof obj.nom_complet === 'string' && obj.nom_complet) ||
    (typeof obj.nom_raison_sociale === 'string' && obj.nom_raison_sociale) ||
    'Établissement sans nom'

  // NAF + date + effectif : on préfère les valeurs au niveau ÉTABLISSEMENT
  // (point de vente réel) plutôt que celles de l'unité légale (entreprise
  // mère). Fallback sur l'unité légale si l'établissement ne porte pas
  // l'info — peut arriver pour des fiches anciennes.
  const codeNaf =
    (typeof etab.activite_principale === 'string' ? etab.activite_principale : null) ??
    (typeof obj.activite_principale === 'string' ? obj.activite_principale : null)
  const libelleNaf =
    typeof obj.libelle_activite_principale === 'string'
      ? obj.libelle_activite_principale
      : null
  const dateCreation =
    (typeof etab.date_creation === 'string' ? etab.date_creation : null) ??
    (typeof obj.date_creation === 'string' ? obj.date_creation : null)
  const trancheEffectif =
    (typeof etab.tranche_effectif_salarie === 'string' && etab.tranche_effectif_salarie !== 'NN'
      ? etab.tranche_effectif_salarie
      : null) ??
    (typeof obj.tranche_effectif_salarie === 'string' && obj.tranche_effectif_salarie !== 'NN'
      ? obj.tranche_effectif_salarie
      : null)

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
