'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  type EnrichedPlaceData,
  getPlaceDetails,
  getPlaceFromUrl,
  GooglePlacesError,
  searchPlaces,
} from '@/lib/google-places'
import { setEnrichedCookie } from '@/lib/crm/enriched-cookie'
import { enrichedToGoogleDbFields } from '@/lib/crm/google-mapping'
import { buildScoreDbFields, toScoringInput } from '@/lib/scoring/apply'
import type { Prospect } from '@/types'

const ALLOWED_URL_HOSTS = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'g.co',
  'www.google.com',
  'maps.google.com',
  'google.com',
  'www.google.fr',
  'maps.google.fr',
  'google.fr',
])

export type GoogleImportResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

async function assertAuthenticated(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return !!user
}

function mapErrorToMessage(err: unknown): string {
  if (err instanceof GooglePlacesError) {
    // Log côté serveur (terminal Next) pour faciliter le debug
    console.error(`[google-import] ${err.code}: ${err.message}`)
    switch (err.code) {
      case 'CONFIG_ERROR':
        return 'Erreur de configuration. Contactez l\'administrateur.'
      case 'QUOTA_EXCEEDED':
        return 'Limite d\'appels Google atteinte. Réessayez plus tard.'
      case 'NOT_FOUND':
        return 'Aucun lieu trouvé. Vérifiez les informations ou utilisez l\'autre mode.'
      case 'INVALID_URL':
        return err.message
      case 'NETWORK_ERROR':
        return 'Impossible de contacter Google. Vérifiez votre connexion.'
      case 'INVALID_RESPONSE':
        return 'Réponse Google inattendue. Réessayez.'
    }
  }
  console.error('[google-import]', err)
  return 'Erreur inattendue.'
}

export async function searchProspectsAction(
  rawName: string,
  rawCity: string
): Promise<GoogleImportResult<EnrichedPlaceData[]>> {
  if (!(await assertAuthenticated())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const name = (rawName ?? '').trim().slice(0, 200)
  const city = (rawCity ?? '').trim().slice(0, 120)

  if (name.length < 2) {
    return { success: false, error: 'Le nom du commerce est requis (2 caractères min).' }
  }

  try {
    const results = await searchPlaces(name, city || null, 3)
    return { success: true, data: results }
  } catch (err) {
    return { success: false, error: mapErrorToMessage(err) }
  }
}

export async function searchProspectByUrlAction(
  rawUrl: string
): Promise<GoogleImportResult<EnrichedPlaceData>> {
  if (!(await assertAuthenticated())) {
    return { success: false, error: 'Non autorisé.' }
  }

  const url = (rawUrl ?? '').trim().slice(0, 2048)
  if (url.length < 10) {
    return { success: false, error: 'URL trop courte.' }
  }

  // Allowlist stricte des hôtes : empêche fetch vers un host arbitraire
  let host: string
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { success: false, error: 'URL invalide (protocole non supporté).' }
    }
    host = parsed.host.toLowerCase()
  } catch {
    return { success: false, error: 'URL invalide.' }
  }

  if (!ALLOWED_URL_HOSTS.has(host)) {
    return {
      success: false,
      error: 'URL non reconnue. Collez un lien Google Maps (maps.app.goo.gl ou google.com/maps).',
    }
  }

  try {
    const result = await getPlaceFromUrl(url)
    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: mapErrorToMessage(err) }
  }
}

// ── Détection doublons + intégration formulaire ────────────────────────

const PLACE_ID_REGEX = /^[A-Za-z0-9_-]{5,}$/

export interface ExistingProspect {
  id: string
  nom_commerce: string
  created_at: string
  last_enriched_at: string | null
}

export async function checkExistingProspectAction(
  placeId: string,
  excludeProspectId?: string
): Promise<GoogleImportResult<ExistingProspect | null>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé.' }

  if (!PLACE_ID_REGEX.test(placeId)) {
    return { success: false, error: 'Identifiant Google invalide.' }
  }

  let query = supabase
    .from('prospects')
    .select('id,nom_commerce,created_at,last_enriched_at')
    .eq('google_place_id', placeId)

  // Mode "Lier à Google" : on cherche les AUTRES prospects ayant déjà ce
  // place_id, pas le prospect courant qu'on est en train de lier.
  if (excludeProspectId && /^[0-9a-f-]{36}$/i.test(excludeProspectId)) {
    query = query.neq('id', excludeProspectId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('[checkExistingProspectAction]', error)
    return { success: false, error: 'Erreur BDD.' }
  }

  return { success: true, data: (data as ExistingProspect | null) ?? null }
}

/**
 * Mode "Lier à Google" : prend une fiche existante (sans google_place_id)
 * et l'enrichit avec les données Google d'un place_id choisi par l'admin,
 * sans créer de doublon. Vérifie au préalable qu'aucun AUTRE prospect
 * n'utilise déjà ce place_id.
 */
export async function bindProspectToGoogleAction(
  prospectId: string,
  placeId: string
): Promise<GoogleImportResult<{ redirectTo: string } | { conflictWith: ExistingProspect }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé.' }

  if (!/^[0-9a-f-]{36}$/i.test(prospectId)) {
    return { success: false, error: 'Identifiant prospect invalide.' }
  }
  if (!PLACE_ID_REGEX.test(placeId)) {
    return { success: false, error: 'Identifiant Google invalide.' }
  }

  // Refuse de lier si un autre prospect a déjà ce place_id (sinon violation
  // de l'index unique partiel à l'UPDATE).
  const { data: conflict } = await supabase
    .from('prospects')
    .select('id,nom_commerce,created_at,last_enriched_at')
    .eq('google_place_id', placeId)
    .neq('id', prospectId)
    .maybeSingle()

  if (conflict) {
    return { success: true, data: { conflictWith: conflict as ExistingProspect } }
  }

  let fresh: EnrichedPlaceData
  try {
    fresh = await getPlaceDetails(placeId)
  } catch (err) {
    return { success: false, error: mapErrorToMessage(err) }
  }

  const updateFields: Record<string, unknown> = {
    ...enrichedToGoogleDbFields(fresh),
    adresse: fresh.formattedAddress,
    ville: fresh.city,
    code_postal: fresh.postalCode,
    distance_km: fresh.distanceKm,
    telephone: fresh.phoneNumber ?? undefined,
    site_existant_url: fresh.website ?? undefined,
  }

  // Recalcul du score sur le merge (old + nouveaux champs Google).
  const { data: oldRow } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .maybeSingle()
  if (oldRow) {
    const merged = { ...(oldRow as Prospect), ...updateFields }
    const scoreFields = buildScoreDbFields(
      toScoringInput(merged),
      (oldRow as Prospect).score_override_manuel ?? null
    )
    Object.assign(updateFields, scoreFields)
  }

  const { error } = await supabase
    .from('prospects')
    .update(updateFields)
    .eq('id', prospectId)

  if (error) {
    console.error('[bindProspectToGoogleAction]', error)
    return { success: false, error: 'Erreur lors du lien.' }
  }

  revalidatePath('/admin/crm')
  revalidatePath(`/admin/crm/${prospectId}`)

  return { success: true, data: { redirectTo: `/admin/crm/${prospectId}` } }
}

/**
 * Refait un Place Details côté serveur (source de vérité), puis :
 * - si un prospect avec ce place_id existe déjà → renvoie son id sans rien
 *   stocker (l'UI proposera "Mettre à jour" au lieu de créer).
 * - sinon → signe les données dans un cookie HTTP-only (10 min) et renvoie
 *   l'URL vers laquelle rediriger pour atterrir sur le formulaire pré-rempli.
 */
export async function prepareCreateFromEnrichedAction(
  placeId: string
): Promise<GoogleImportResult<{ existing: ExistingProspect }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé.' }

  if (!PLACE_ID_REGEX.test(placeId)) {
    return { success: false, error: 'Identifiant Google invalide.' }
  }

  // Re-fetch depuis Google → on ne fait jamais confiance aux données envoyées
  // par le client.
  let fresh: EnrichedPlaceData
  try {
    fresh = await getPlaceDetails(placeId)
  } catch (err) {
    return { success: false, error: mapErrorToMessage(err) }
  }

  const { data: existing, error } = await supabase
    .from('prospects')
    .select('id,nom_commerce,created_at,last_enriched_at')
    .eq('google_place_id', fresh.placeId)
    .maybeSingle()

  if (error) {
    console.error('[prepareCreateFromEnrichedAction]', error)
    return { success: false, error: 'Erreur BDD.' }
  }

  if (existing) {
    return { success: true, data: { existing: existing as ExistingProspect } }
  }

  await setEnrichedCookie(fresh)
  // redirect() côté serveur : la response HTTP contient Set-Cookie + Location
  // dans la même réponse, le navigateur stocke le cookie puis suit la redirection.
  // Évite la race condition router.refresh + push où le cookie pouvait n'être
  // pas encore propagé au moment du fetch de /nouveau.
  redirect('/admin/crm/nouveau?from=enrich')
}

/**
 * Bouton "Enrichir depuis Google" sur la fiche prospect existante.
 * - Si la fiche a déjà un google_place_id → refresh + UPDATE des champs google_* + vitrine.
 * - Sinon → redirige vers la page d'import en mode recherche, pré-remplie avec le nom.
 */
export async function refreshProspectFromGoogleAction(
  prospectId: string
): Promise<GoogleImportResult<{ redirectTo: string } | { lastEnrichedAt: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé.' }

  if (!/^[0-9a-f-]{36}$/i.test(prospectId)) {
    return { success: false, error: 'Identifiant prospect invalide.' }
  }

  const { data: row, error: selErr } = await supabase
    .from('prospects')
    .select('id,nom_commerce,google_place_id')
    .eq('id', prospectId)
    .maybeSingle()

  if (selErr || !row) {
    return { success: false, error: 'Prospect introuvable.' }
  }

  if (!row.google_place_id) {
    // Pas encore enrichi → redirige vers la recherche pré-remplie avec le nom
    // + un marqueur `bind` pour que la page d'import sache qu'il faut lier
    // à cette fiche existante au lieu d'en créer une nouvelle.
    const params = new URLSearchParams({
      mode: 'search',
      name: row.nom_commerce,
      bind: prospectId,
    })
    return { success: true, data: { redirectTo: `/admin/crm/import?${params.toString()}` } }
  }

  let fresh: EnrichedPlaceData
  try {
    fresh = await getPlaceDetails(row.google_place_id)
  } catch (err) {
    return { success: false, error: mapErrorToMessage(err) }
  }

  const dbFields = enrichedToGoogleDbFields(fresh)
  const updateFields: Record<string, unknown> = {
    ...dbFields,
    adresse: fresh.formattedAddress,
    ville: fresh.city,
    code_postal: fresh.postalCode,
    distance_km: fresh.distanceKm,
    telephone: fresh.phoneNumber ?? undefined,
    site_existant_url: fresh.website ?? undefined,
  }

  // Recalcul du score sur le merge (old + nouveaux champs Google).
  const { data: fullRow } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .maybeSingle()
  if (fullRow) {
    const merged = { ...(fullRow as Prospect), ...updateFields }
    const scoreFields = buildScoreDbFields(
      toScoringInput(merged),
      (fullRow as Prospect).score_override_manuel ?? null
    )
    Object.assign(updateFields, scoreFields)
  }

  const { error: updErr } = await supabase
    .from('prospects')
    .update(updateFields)
    .eq('id', prospectId)

  if (updErr) {
    console.error('[refreshProspectFromGoogleAction]', updErr)
    return { success: false, error: 'Erreur lors de la mise à jour.' }
  }

  revalidatePath('/admin/crm')
  revalidatePath(`/admin/crm/${prospectId}`)

  return { success: true, data: { lastEnrichedAt: dbFields.last_enriched_at } }
}

export async function updateProspectFromEnrichedAction(
  prospectId: string,
  placeId: string
): Promise<GoogleImportResult<{ redirectTo: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé.' }

  if (!PLACE_ID_REGEX.test(placeId)) {
    return { success: false, error: 'Identifiant Google invalide.' }
  }
  if (!/^[0-9a-f-]{36}$/i.test(prospectId)) {
    return { success: false, error: 'Identifiant prospect invalide.' }
  }

  let fresh: EnrichedPlaceData
  try {
    fresh = await getPlaceDetails(placeId)
  } catch (err) {
    return { success: false, error: mapErrorToMessage(err) }
  }

  const updateFields: Record<string, unknown> = {
    ...enrichedToGoogleDbFields(fresh),
    // On rafraîchit aussi les champs "vitrine" qui peuvent évoluer côté Google
    adresse: fresh.formattedAddress,
    ville: fresh.city,
    code_postal: fresh.postalCode,
    distance_km: fresh.distanceKm,
    telephone: fresh.phoneNumber ?? undefined,
    site_existant_url: fresh.website ?? undefined,
  }

  // Recalcul du score sur le merge (old + nouveaux champs Google).
  const { data: oldRow } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .maybeSingle()
  if (oldRow) {
    const merged = { ...(oldRow as Prospect), ...updateFields }
    const scoreFields = buildScoreDbFields(
      toScoringInput(merged),
      (oldRow as Prospect).score_override_manuel ?? null
    )
    Object.assign(updateFields, scoreFields)
  }

  const { error } = await supabase
    .from('prospects')
    .update(updateFields)
    .eq('id', prospectId)

  if (error) {
    console.error('[updateProspectFromEnrichedAction]', error)
    return { success: false, error: 'Erreur lors de la mise à jour.' }
  }

  revalidatePath('/admin/crm')
  revalidatePath(`/admin/crm/${prospectId}`)

  return { success: true, data: { redirectTo: `/admin/crm/${prospectId}` } }
}
