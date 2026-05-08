import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase à utiliser UNIQUEMENT côté server-to-server
 * (webhooks, jobs CRON, scripts d'admin) — pas dans les Server Actions
 * ou Server Components qui doivent passer par `lib/supabase/server.ts`
 * (client SSR avec cookies utilisateur).
 *
 * Utilise la `SUPABASE_SERVICE_ROLE_KEY` qui bypass complètement RLS.
 * À ne JAMAIS exposer côté client (pas de préfixe `NEXT_PUBLIC_`).
 *
 * Cas d'usage :
 *   - Webhooks Resend (`/api/webhooks/resend`) : Resend appelle notre
 *     endpoint sans contexte utilisateur, on a besoin d'updater
 *     `email_sends` qui est protégée par RLS admin.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'createAdminClient: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
