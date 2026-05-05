import 'server-only'

import { cookies } from 'next/headers'
import crypto from 'node:crypto'
import type { EnrichedPlaceData } from '@/lib/google-places'

const COOKIE_NAME = 'sigweb_enriched'
const MAX_AGE_SECONDS = 600 // 10 min

/**
 * Secret HMAC pour signer le cookie. Priorise CRM_COOKIE_SECRET (env dédiée).
 * Fallback : dérivé de NEXT_PUBLIC_SUPABASE_ANON_KEY (clé publique mais
 * suffisamment entropique pour ce cas d'usage : le cookie n'authentifie
 * personne, il transporte juste une donnée Google déjà publique entre
 * /admin/crm/import et /admin/crm/nouveau, dans le cadre d'une session
 * admin déjà authentifiée par ailleurs).
 */
function getSecret(): string {
  const explicit = process.env.CRM_COOKIE_SECRET
  if (explicit && explicit.length >= 16) return explicit
  const fallback = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!fallback) throw new Error('Cookie secret indisponible.')
  return crypto.createHash('sha256').update('sigweb-enriched|' + fallback).digest('hex')
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

function encodeToken(data: EnrichedPlaceData): string {
  const json = JSON.stringify(data)
  const payload = Buffer.from(json, 'utf8').toString('base64url')
  const signature = sign(payload)
  return `${payload}.${signature}`
}

function decodeToken(token: string): EnrichedPlaceData | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payload, signature] = parts
  if (!payload || !signature) return null
  const expected = sign(payload)
  if (!timingSafeEqualStrings(signature, expected)) return null
  try {
    const json = Buffer.from(payload, 'base64url').toString('utf8')
    const parsed = JSON.parse(json)
    if (typeof parsed !== 'object' || !parsed || typeof parsed.placeId !== 'string') return null
    return parsed as EnrichedPlaceData
  } catch {
    return null
  }
}

export async function setEnrichedCookie(data: EnrichedPlaceData): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, encodeToken(data), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_SECONDS,
    path: '/admin',
  })
}

/**
 * Lit le cookie d'enrichissement et renvoie le token brut signé +
 * les données décodées. Utilisé au render de /nouveau?from=enrich pour
 * transférer le token vers un input hidden dans le formulaire — ainsi
 * le payload signé accompagne la submission du form, et n'est plus
 * à la merci d'un autre onglet qui réécrirait le cookie.
 *
 * Le cookie n'est volontairement PAS supprimé ici : Next.js interdit
 * `cookies().set()` depuis un Server Component (uniquement Server Action
 * ou Route Handler). Le cookie s'auto-expire après 10 min ou est écrasé
 * au prochain import — sans incidence puisque createProspect ne lit plus
 * le cookie au submit, mais le token du form.
 */
export async function consumeEnrichedCookieAsToken(): Promise<{
  token: string | null
  data: EnrichedPlaceData | null
}> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value ?? null
  const data = token ? decodeToken(token) : null
  return { token: data ? token : null, data }
}

/**
 * Décode + vérifie la signature d'un token enrichi (provenant d'un input
 * hidden de form). Renvoie les données ou null si signature invalide /
 * payload corrompu.
 */
export function verifyEnrichedToken(token: string | null | undefined): EnrichedPlaceData | null {
  if (!token || typeof token !== 'string') return null
  return decodeToken(token)
}
