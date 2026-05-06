'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import {
  buildSuffixedSlug,
  generateInitialMaquette,
  generateSlugBase,
  UnsupportedCategoryError,
} from '@/lib/maquette'
import type { Prospect } from '@/types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sigweb.fr'

export type MaquetteActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

async function assertAuthenticated() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé.')
  return supabase
}

/**
 * Boucle de déduplication du slug. Utilise le slug de base puis suffixe -2, -3...
 * jusqu'à trouver un slot libre. Plafond à 100 essais (en pratique, jamais > -3).
 */
async function ensureUniqueSlug(
  supabase: SupabaseClient,
  base: string
): Promise<string> {
  for (let i = 1; i <= 100; i++) {
    const candidate = buildSuffixedSlug(base, i)
    const { data } = await supabase
      .from('maquettes')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
    if (!data) return candidate
  }
  throw new Error(`Impossible de générer un slug unique pour "${base}"`)
}

/**
 * Crée la maquette initiale d'un prospect.
 *
 * V1 : 1 prospect = 1 maquette (contrainte UNIQUE sur prospect_id).
 * Si une maquette existe déjà, l'action renvoie une erreur métier
 * — l'UI doit basculer sur "Voir / Modifier" plutôt que "Générer".
 *
 * Le slug est généré UNE SEULE FOIS ici, puis figé (pas de re-sync depuis
 * `prospects.nom_commerce`). Toute modification ultérieure passera par
 * l'éditeur (Session 4, section "Avancé") avec confirmation explicite.
 */
export async function createMaquetteFromProspect(
  prospectId: string
): Promise<MaquetteActionResult<{ id: string; slug: string }>> {
  let supabase: SupabaseClient
  try {
    supabase = await assertAuthenticated()
  } catch {
    return { success: false, error: 'Non autorisé.' }
  }

  // 1) Récupérer le prospect
  const { data: prospect, error: fetchErr } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .maybeSingle()

  if (fetchErr) {
    console.error('[createMaquetteFromProspect] fetch', fetchErr)
    return { success: false, error: 'Erreur lors de la récupération du prospect.' }
  }
  if (!prospect) {
    return { success: false, error: 'Prospect introuvable.' }
  }
  const p = prospect as Prospect

  // 2) Garde-fou : pas de doublon de maquette
  if (p.maquette_id) {
    return {
      success: false,
      error: 'Une maquette existe déjà pour ce prospect. Ouvre-la depuis la fiche.',
    }
  }

  // 3) Générer le contenu initial (peut throw UnsupportedCategoryError)
  let initial
  try {
    initial = generateInitialMaquette(p)
  } catch (e) {
    if (e instanceof UnsupportedCategoryError) {
      return {
        success: false,
        error: 'Génération non disponible pour cette catégorie pour le moment.',
      }
    }
    console.error('[createMaquetteFromProspect] generate', e)
    return { success: false, error: 'Erreur lors de la génération de la maquette.' }
  }

  // 4) Slug unique — généré une seule fois, figé pour la stabilité du QR code / URL
  const slugBase = generateSlugBase(p.nom_commerce)
  const slug = await ensureUniqueSlug(supabase, slugBase)

  // 5) INSERT maquette
  const { data: inserted, error: insertErr } = await supabase
    .from('maquettes')
    .insert({ ...initial, slug })
    .select('id, slug')
    .single()

  if (insertErr || !inserted) {
    console.error('[createMaquetteFromProspect] insert', insertErr)
    return { success: false, error: 'Erreur lors de la création de la maquette.' }
  }

  // 6) Lier côté prospect (le maquette_url reste null jusqu'à la publication)
  const { error: linkErr } = await supabase
    .from('prospects')
    .update({ maquette_id: inserted.id })
    .eq('id', prospectId)

  if (linkErr) {
    // La maquette est créée mais la liaison a échoué : on log mais on
    // ne casse pas — l'UI pourra retrouver la maquette via prospect_id.
    console.error('[createMaquetteFromProspect] link', linkErr)
  }

  revalidatePath('/admin/crm')
  revalidatePath(`/admin/crm/${prospectId}`)

  return { success: true, data: { id: inserted.id, slug: inserted.slug } }
}

export async function deleteMaquette(
  maquetteId: string
): Promise<MaquetteActionResult> {
  let supabase: SupabaseClient
  try {
    supabase = await assertAuthenticated()
  } catch {
    return { success: false, error: 'Non autorisé.' }
  }

  // Récupérer le prospect_id avant la suppression pour reset proprement
  // l'éventuel maquette_url côté prospect (la FK ON DELETE SET NULL ne
  // gère que maquette_id, pas l'URL dénormalisée).
  const { data: m } = await supabase
    .from('maquettes')
    .select('prospect_id')
    .eq('id', maquetteId)
    .maybeSingle()

  const { error } = await supabase.from('maquettes').delete().eq('id', maquetteId)
  if (error) {
    console.error('[deleteMaquette]', error)
    return { success: false, error: 'Erreur lors de la suppression.' }
  }

  if (m?.prospect_id) {
    await supabase
      .from('prospects')
      .update({ maquette_url: null })
      .eq('id', m.prospect_id)
    revalidatePath(`/admin/crm/${m.prospect_id}`)
  }

  revalidatePath('/admin/crm')
  return { success: true, data: undefined }
}

export async function publishMaquette(
  maquetteId: string
): Promise<MaquetteActionResult<{ url: string }>> {
  let supabase: SupabaseClient
  try {
    supabase = await assertAuthenticated()
  } catch {
    return { success: false, error: 'Non autorisé.' }
  }

  const { data: m, error: fetchErr } = await supabase
    .from('maquettes')
    .select('id, slug, prospect_id')
    .eq('id', maquetteId)
    .maybeSingle()

  if (fetchErr || !m) {
    console.error('[publishMaquette] fetch', fetchErr)
    return { success: false, error: 'Maquette introuvable.' }
  }

  const { error: updateErr } = await supabase
    .from('maquettes')
    .update({ published: true, published_at: new Date().toISOString() })
    .eq('id', maquetteId)

  if (updateErr) {
    console.error('[publishMaquette] update', updateErr)
    return { success: false, error: 'Erreur lors de la publication.' }
  }

  const url = `${SITE_URL}/demos/${m.slug}`
  await supabase
    .from('prospects')
    .update({ maquette_url: url })
    .eq('id', m.prospect_id)

  revalidatePath('/admin/crm')
  revalidatePath(`/admin/crm/${m.prospect_id}`)
  revalidatePath(`/demos/${m.slug}`)

  return { success: true, data: { url } }
}

export async function unpublishMaquette(
  maquetteId: string
): Promise<MaquetteActionResult> {
  let supabase: SupabaseClient
  try {
    supabase = await assertAuthenticated()
  } catch {
    return { success: false, error: 'Non autorisé.' }
  }

  const { data: m, error: fetchErr } = await supabase
    .from('maquettes')
    .select('id, slug, prospect_id')
    .eq('id', maquetteId)
    .maybeSingle()

  if (fetchErr || !m) {
    console.error('[unpublishMaquette] fetch', fetchErr)
    return { success: false, error: 'Maquette introuvable.' }
  }

  const { error: updateErr } = await supabase
    .from('maquettes')
    .update({ published: false })
    .eq('id', maquetteId)

  if (updateErr) {
    console.error('[unpublishMaquette] update', updateErr)
    return { success: false, error: 'Erreur lors de la dépublication.' }
  }

  await supabase
    .from('prospects')
    .update({ maquette_url: null })
    .eq('id', m.prospect_id)

  revalidatePath('/admin/crm')
  revalidatePath(`/admin/crm/${m.prospect_id}`)
  revalidatePath(`/demos/${m.slug}`)

  return { success: true, data: undefined }
}
