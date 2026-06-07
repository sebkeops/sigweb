import { createHash } from 'node:crypto'
import type {
  MaquetteVisitSource,
  MaquetteVisitUserAgent,
} from '@/types'

/**
 * Helpers purs (sans BDD) pour le tracking RGPD-friendly des visites
 * `/demos/{slug}` — utilises par la route handler
 * `/api/maquettes/tracking` et par les tests.
 *
 * Aucune dependance Next/Supabase ici : permet de tester unitairement
 * sans mocker l'infra.
 */

// ─── Hash IP ───────────────────────────────────────────────────────────

/**
 * SHA256 de l'IP du visiteur, salt avec un secret stable, tronque a 16
 * chars hexa (= 64 bits d'entropie). Permet de :
 *   - distinguer 2 visiteurs uniques (probabilite de collision tres faible
 *     pour le volume cible : 5-10 prospects/semaine, ~100 visites max)
 *   - detecter qu'un meme visiteur revient (pour la fenetre 30min UPSERT)
 *   - SANS pouvoir remonter a l'IP originale meme si la BDD fuit
 *
 * Le salt est lu dans `SIGWEB_VISIT_HASH_SALT` (env var). Si absent,
 * fallback sur une constante hardcodee — moins ideal mais ne casse rien.
 * En prod, definir cette variable dans Vercel.
 */
const FALLBACK_SALT = 'sigweb-visit-salt-v1'

export function hashIp(ip: string): string {
  const salt = process.env.SIGWEB_VISIT_HASH_SALT ?? FALLBACK_SALT
  return createHash('sha256').update(ip + salt).digest('hex').slice(0, 16)
}

// ─── User Agent → mobile / desktop / tablet ────────────────────────────

/**
 * Reduit un user agent brut a une des 3 categories. On NE conserve PAS
 * le UA complet (quasi-identifiant pour le fingerprinting).
 *
 * Detection volontairement simple — pas de lib externe :
 *   - 'iPad', 'Tablet', 'Tab' → tablet
 *   - 'Mobile', 'Android' (sans 'Tablet'), 'iPhone' → mobile
 *   - sinon → desktop
 *
 * Retourne `null` si le UA est vide / impossible a categoriser.
 */
export function parseUserAgent(userAgent: string | null | undefined): MaquetteVisitUserAgent | null {
  if (!userAgent || userAgent.trim().length === 0) return null

  const ua = userAgent

  // Ordre important : Tablet AVANT Mobile (Android tablette = "Android"
  // sans le mot "Mobile", donc on check Tablet en premier)
  if (/iPad|Tablet|tablet/.test(ua)) return 'tablet'
  if (/Android(?!.*Mobile)/.test(ua)) return 'tablet'

  if (/iPhone|iPod|Mobile|Android.*Mobile/.test(ua)) return 'mobile'

  return 'desktop'
}

// ─── Source du trafic ──────────────────────────────────────────────────

const VALID_SOURCES: ReadonlySet<MaquetteVisitSource> = new Set([
  'affiche',
  'email',
  'email-test',
  'carte',
  'direct',
  'other',
])

/**
 * Normalise le parametre `?src=...` de l'URL en une `MaquetteVisitSource`
 * autorisee par la CHECK constraint BDD.
 *
 * Regles :
 *   - `?src` absent → 'direct'
 *   - `?src=affiche|email|carte` → identique
 *   - `?src=<autre>` → 'other' (on conserve la trace de la presence
 *     d'un parametre, mais on n'expose pas la valeur libre)
 */
export function parseSource(rawSrc: string | null | undefined): MaquetteVisitSource {
  if (!rawSrc) return 'direct'
  const lc = rawSrc.toLowerCase().trim()
  if (VALID_SOURCES.has(lc as MaquetteVisitSource) && lc !== 'other') {
    return lc as MaquetteVisitSource
  }
  return 'other'
}

// ─── Extraction de l'IP cote serveur ──────────────────────────────────

/**
 * Extrait l'IP du visiteur depuis les headers de la requete Next.js.
 *
 * Vercel pose `x-forwarded-for` et `x-real-ip`. En cas de chaine de proxies
 * dans `x-forwarded-for`, on prend la PREMIERE IP (la plus proche du
 * client). Si tout est absent (cas dev local ou tres rare en prod), on
 * retourne 'unknown' — l'IP hashee restera stable pour ce cas degenere.
 */
export function extractClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const xri = headers.get('x-real-ip')
  if (xri && xri.trim()) return xri.trim()
  return 'unknown'
}

// ─── Tronquage referrer ────────────────────────────────────────────────

const REFERRER_MAX_LENGTH = 500

/**
 * Tronque le referrer a 500 chars pour eviter les abus (URL artificielles
 * extra-longues). Retourne `null` si vide ou absent.
 */
export function normalizeReferrer(referrer: string | null | undefined): string | null {
  if (!referrer) return null
  const trimmed = referrer.trim()
  if (trimmed.length === 0) return null
  return trimmed.slice(0, REFERRER_MAX_LENGTH)
}

// ─── Fenetre UPSERT 30 min pour l'event timeline ───────────────────────

/**
 * Duree en millisecondes de la fenetre pendant laquelle plusieurs visites
 * d'un meme prospect sont aggregees en UN SEUL event timeline
 * `maquette_visited` (le compteur est incremente, last_visit_at mis a jour).
 *
 * Au-dela de 30 min, une nouvelle visite cree un nouvel event distinct —
 * c'est une "nouvelle session" et merite d'apparaitre en haut de la
 * timeline.
 *
 * Choix volontairement court (vs 24h par ex) pour qu'une visite du matin
 * + une visite de l'apres-midi soient bien 2 events distincts dans la
 * timeline (= 2 vrais signaux d'interet).
 */
export const VISIT_UPSERT_WINDOW_MS = 30 * 60 * 1000
