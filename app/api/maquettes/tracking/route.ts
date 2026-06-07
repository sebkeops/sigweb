import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createSsrClient } from '@/lib/supabase/server'
import { insertOrUpsertMaquetteVisitEvent } from '@/lib/crm/maquette-visit-event'
import {
  extractClientIp,
  hashIp,
  normalizeReferrer,
  parseSource,
  parseUserAgent,
} from '@/lib/crm/maquette-tracking'
import type { MaquetteVisit, MaquetteVisitSource } from '@/types'

/**
 * Route handler du tracking RGPD-friendly des visites `/demos/{slug}`.
 *
 * `POST /api/maquettes/tracking` — appele a l'arrivee sur la page :
 *   1. Hash l'IP du visiteur
 *   2. Parse source (`?src=...`), user agent, referrer
 *   3. Detecte si l'admin Sigweb est connecte (cookie Supabase Auth) →
 *      `is_test = true` (ne pollue pas les KPIs)
 *   4. Lookup `prospect_id` via `maquettes.slug → prospect_id`
 *   5. INSERT une ligne `maquette_visits`
 *   6. UPSERT l'event timeline `maquette_visited` (fenetre 30 min,
 *      cf. `lib/crm/maquette-visit-event.ts`)
 *   7. Renvoie `{ visitId }` au client pour qu'il puisse PATCH la duree
 *
 * `PATCH /api/maquettes/tracking` — appele au `pagehide` cote client :
 *   - Body : `{ visitId, durationSeconds }`
 *   - Met a jour `duration_seconds` sur la ligne `maquette_visits`
 *   - Best-effort : pas de redirection, retourne 204 en cas de succes
 *
 * Auth :
 *   - Lecture/ecriture via service_role (bypass RLS) : la route est
 *     publique mais on n'accepte que des `slug` qui existent en BDD,
 *     et on hash l'IP donc aucun PII n'est expose
 *   - Lecture du cookie admin pour detecter is_test
 */

const PostSchema = z.object({
  slug: z.string().min(1).max(255),
  source: z.string().nullable().optional(),
  referrer: z.string().nullable().optional(),
})

const PatchSchema = z.object({
  visitId: z.string().uuid(),
  durationSeconds: z.number().int().min(0).max(3600 * 24), // cap 24h (anti-abus)
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { slug, source: rawSource, referrer: bodyReferrer } = parsed.data

  // 1. IP hashee
  const ip = extractClientIp(request.headers)
  const ip_hash = hashIp(ip)

  // 2. UA + source + referrer (referrer du body OU du header)
  const user_agent_summary = parseUserAgent(request.headers.get('user-agent'))
  const source = parseSource(rawSource)
  const referrer = normalizeReferrer(bodyReferrer ?? request.headers.get('referer'))

  // 3. Detection is_test selon 2 signaux cumulatifs (OR logique) :
  //    a. Cookie Supabase Auth present → admin connecte qui consulte
  //    b. Source = 'email-test' → URL provient d'un envoi test (bouton
  //       'Envoyer un test' avec toOverride → sender genere `?src=email-test`)
  //    Dans les 2 cas, la visite est exclue des stats agregees + de la
  //    timeline cote admin (filtrage WHERE is_test = false partout).
  let is_test = source === 'email-test'
  if (!is_test) {
    try {
      const ssr = await createSsrClient()
      const {
        data: { user },
      } = await ssr.auth.getUser()
      if (user) is_test = true
    } catch {
      // best-effort — si le cookie n'est pas la, pas grave
    }
  }

  // 4. Lookup prospect_id via le slug de la maquette
  const admin = createAdminClient()
  const { data: maquetteRow } = await admin
    .from('maquettes')
    .select('prospect_id')
    .eq('slug', slug)
    .maybeSingle<{ prospect_id: string | null }>()

  const prospect_id = maquetteRow?.prospect_id ?? null

  // 5. INSERT maquette_visits
  const { data: visitRow, error: insertErr } = await admin
    .from('maquette_visits')
    .insert({
      slug,
      prospect_id,
      source,
      ip_hash,
      user_agent_summary,
      referrer,
      is_test,
    })
    .select('id')
    .single<{ id: string }>()

  if (insertErr || !visitRow) {
    console.error('[maquettes/tracking] insert visit', insertErr)
    // On ne renvoie pas l'erreur au client (cote public), juste un OK
    // generique avec id null — le client ne pourra pas PATCH mais la
    // page reste fonctionnelle.
    return NextResponse.json({ visitId: null })
  }

  // 6. UPSERT event timeline `maquette_visited` (fenetre 30 min)
  //    Best-effort : un echec ne casse pas la reponse au client.
  if (prospect_id) {
    await insertOrUpsertMaquetteVisitEvent(admin, {
      prospectId: prospect_id,
      slug,
      source,
      visitAt: new Date(),
      isTest: is_test,
    }).catch((e) => {
      console.error('[maquettes/tracking] upsert event timeline', e)
    })
  }

  return NextResponse.json({ visitId: visitRow.id })
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { visitId, durationSeconds } = parsed.data

  const admin = createAdminClient()
  const { error } = await admin
    .from('maquette_visits')
    .update({ duration_seconds: durationSeconds })
    .eq('id', visitId)

  if (error) {
    console.error('[maquettes/tracking] patch duration', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  // 204 No Content — le client n'a rien a faire de la reponse
  return new NextResponse(null, { status: 204 })
}

/**
 * Export pour usage interne par les tests d'integration / pages preview.
 * Pas exporte par defaut.
 */
export type { MaquetteVisit, MaquetteVisitSource }
