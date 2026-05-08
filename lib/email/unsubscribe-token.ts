import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Token de désabonnement signé HMAC-SHA256.
 *
 * Format : `<prospectId>.<signature>` où `signature = HMAC(secret, prospectId)`.
 *
 * Pourquoi pas un JWT ?
 *   - Pas besoin d'expiration : un lien de désabonnement reste valide à vie
 *     (RGPD : on doit toujours permettre le désabonnement).
 *   - Pas besoin de payload structuré : juste le prospect_id.
 *   - HMAC simple = ~70 chars, plus court qu'un JWT (~200 chars) — meilleure
 *     intégration dans des emails plain text et URLs.
 *
 * Sécurité :
 *   - HMAC empêche la forge d'un token pour un prospectId arbitraire.
 *   - Comparaison constant-time (`timingSafeEqual`) empêche le timing attack.
 *   - Si le secret tourne, tous les anciens tokens deviennent invalides.
 *     Acceptable : l'admin peut renvoyer un email pour régénérer un lien.
 */

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'UNSUBSCRIBE_SECRET manquant ou trop court (≥ 32 chars requis)'
    )
  }
  return secret
}

function signProspectId(prospectId: string, secret: string): string {
  return createHmac('sha256', secret).update(prospectId).digest('base64url')
}

export function generateUnsubscribeToken(prospectId: string): string {
  const signature = signProspectId(prospectId, getSecret())
  return `${prospectId}.${signature}`
}

/**
 * Vérifie le token et retourne le prospectId si valide, sinon null.
 * Ne throw jamais — un token invalide est juste rejeté silencieusement
 * (le caller affiche une erreur générique à l'utilisateur).
 */
export function verifyUnsubscribeToken(token: string): string | null {
  let secret: string
  try {
    secret = getSecret()
  } catch {
    return null
  }

  const dotIdx = token.indexOf('.')
  if (dotIdx <= 0) return null
  const prospectId = token.slice(0, dotIdx)
  const signature = token.slice(dotIdx + 1)
  if (!prospectId || !signature) return null

  const expected = signProspectId(prospectId, secret)
  // Pour timingSafeEqual il faut des Buffers de même longueur.
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length) return null
  if (!timingSafeEqual(sigBuf, expBuf)) return null

  return prospectId
}
