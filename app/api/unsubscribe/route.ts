import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token'

/**
 * Endpoint One-Click Unsubscribe (RFC 8058).
 *
 * Appelé par Gmail/Outlook/Apple Mail quand l'utilisateur clique sur le
 * bouton "Désabonner" natif du client mail (header `List-Unsubscribe` +
 * `List-Unsubscribe-Post: List-Unsubscribe=One-Click`). La requête est
 * un POST avec body `List-Unsubscribe=One-Click`.
 *
 * Le GET est exposé en fallback : certains clients ou prefetchers de
 * sécurité peuvent suivre le lien en GET → on redirige alors vers la
 * page UI `/unsubscribe?token=...` qui confirme visuellement.
 *
 * Sécurité :
 *   - Token HMAC-SHA256 vérifié — empêche la forge.
 *   - Désabonnement idempotent — un POST répété n'a pas d'effet.
 *   - Token invalide → on retourne quand même 200 (RFC 8058 attend
 *     200 pour que Gmail affiche "Désabonné" plutôt qu'une erreur,
 *     et ça évite l'énumération de prospects).
 */

export const dynamic = 'force-dynamic'

async function unsubscribeProspect(token: string): Promise<boolean> {
  const prospectId = verifyUnsubscribeToken(token)
  if (!prospectId) return false

  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from('prospects')
    .select('email_unsubscribed')
    .eq('id', prospectId)
    .maybeSingle()

  if (!existing) return false
  if (existing.email_unsubscribed) return true

  const { error } = await supabase
    .from('prospects')
    .update({
      email_unsubscribed: true,
      email_unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', prospectId)

  if (error) {
    console.error('[api/unsubscribe] update failed:', error.message)
    return false
  }
  return true
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token') ?? ''
  if (token) await unsubscribeProspect(token)
  // RFC 8058 : 200 systématique, le client mail n'a pas besoin de plus.
  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  // Fallback : un GET sur cet endpoint redirige vers la page UI publique
  // qui affiche la confirmation visuelle.
  const url = new URL(request.url)
  const token = url.searchParams.get('token') ?? ''
  const target = new URL('/unsubscribe', url.origin)
  if (token) target.searchParams.set('token', token)
  return NextResponse.redirect(target, 302)
}
