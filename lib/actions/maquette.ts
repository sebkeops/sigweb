'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import {
  buildSuffixedSlug,
  generateInitialMaquette,
  generateSlugBase,
  UnsupportedCategoryError,
} from '@/lib/maquette'
import { updateMaquetteContentSchema } from '@/lib/maquette/content-schema'
import {
  assertAssignmentsPointToPool,
  availablePhotosSchema,
  photoAssignmentsSchema,
} from '@/lib/maquette/photos'
import { processPhotoBuffer } from '@/lib/maquette/photos/process'
import {
  extractDominantColors,
  LogoValidationError,
  processLogoBuffer,
} from '@/lib/maquette/logo'
import type { MaquettePhotoEntry, Prospect } from '@/types'

const STORAGE_BUCKET = 'maquettes-assets'
const STORAGE_LOGO_PREFIX = 'logos'
const STORAGE_PHOTO_PREFIX = 'photos'

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

/**
 * Met à jour les champs textuels éditables d'une maquette.
 *
 * Sécurité multi-onglet : la server action reçoit `expectedUpdatedAt` (le
 * `updated_at` connu du client). Si la valeur en BDD a changé entre-temps
 * (autre onglet, autre admin), on REJETTE le save avec `code: 'stale'` et
 * on retourne le `currentUpdatedAt`. Le client affichera un message
 * "rechargez la page". C'est un lock optimiste léger — pas de transaction.
 *
 * Validation : whitelist Zod stricte (cf. `updateMaquetteContentSchema`).
 * AUCUN champ hors whitelist ne peut être écrit via cette voie.
 */
export type UpdateContentResult =
  | { success: true; updatedAt: string }
  | { success: false; error: string; code: 'stale' | 'validation' | 'other'; currentUpdatedAt?: string }

export async function updateMaquetteContent(
  maquetteId: string,
  expectedUpdatedAt: string,
  partial: Record<string, unknown>
): Promise<UpdateContentResult> {
  let supabase: SupabaseClient
  try {
    supabase = await assertAuthenticated()
  } catch {
    return { success: false, error: 'Non autorisé.', code: 'other' }
  }

  // 1) Validation runtime via Zod (whitelist + format + bornes)
  const parsed = updateMaquetteContentSchema.safeParse(partial)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Champs invalides. ' + parsed.error.issues.map((i) => i.path.join('.')).join(', '),
      code: 'validation',
    }
  }
  const cleanPartial = parsed.data

  // Aucun champ valide après nettoyage : succès no-op
  if (Object.keys(cleanPartial).length === 0) {
    const { data: row } = await supabase
      .from('maquettes')
      .select('updated_at')
      .eq('id', maquetteId)
      .maybeSingle()
    return { success: true, updatedAt: row?.updated_at ?? expectedUpdatedAt }
  }

  // 2) Lock optimiste : check `updated_at` AVANT l'UPDATE
  const { data: current, error: selErr } = await supabase
    .from('maquettes')
    .select('updated_at')
    .eq('id', maquetteId)
    .maybeSingle()

  if (selErr || !current) {
    console.error('[updateMaquetteContent] select', selErr)
    return { success: false, error: 'Maquette introuvable.', code: 'other' }
  }

  if (current.updated_at !== expectedUpdatedAt) {
    return {
      success: false,
      code: 'stale',
      error: 'Cette maquette a été modifiée ailleurs (autre onglet ?). Rechargez pour voir les derniers changements.',
      currentUpdatedAt: current.updated_at,
    }
  }

  // 3) UPDATE — le trigger BDD `set_updated_at()` met à jour updated_at
  const { data: updated, error: updErr } = await supabase
    .from('maquettes')
    .update(cleanPartial)
    .eq('id', maquetteId)
    .eq('updated_at', expectedUpdatedAt) // double-check au niveau SQL contre une race entre SELECT et UPDATE
    .select('updated_at, prospect_id, slug')
    .maybeSingle()

  if (updErr) {
    console.error('[updateMaquetteContent] update', updErr)
    return { success: false, error: 'Erreur lors de la sauvegarde.', code: 'other' }
  }

  if (!updated) {
    // Le `.eq('updated_at', expectedUpdatedAt)` n'a matché aucune ligne :
    // une race a eu lieu entre SELECT et UPDATE. On re-fetch et signale stale.
    const { data: now } = await supabase
      .from('maquettes')
      .select('updated_at')
      .eq('id', maquetteId)
      .maybeSingle()
    return {
      success: false,
      code: 'stale',
      error: 'Cette maquette a été modifiée ailleurs (autre onglet ?). Rechargez pour voir les derniers changements.',
      currentUpdatedAt: now?.updated_at,
    }
  }

  revalidatePath(`/admin/crm/${updated.prospect_id}/maquette`)
  revalidatePath(`/admin/maquette-preview/${updated.prospect_id}`)
  if (updated.slug) revalidatePath(`/demos/${updated.slug}`)

  return { success: true, updatedAt: updated.updated_at }
}

/**
 * Met à jour le pool + assignations photos d'une maquette.
 *
 * Sécurité : whitelist Zod sur les seuls champs photos. Lock optimiste
 * `updated_at` + double-check SQL au niveau UPDATE (idem `updateMaquetteContent`).
 *
 * Validation croisée : toutes les `photo_id` non-null doivent référencer
 * un id présent dans `available_photos` (`assertAssignmentsPointToPool`).
 */
export async function updateMaquettePhotos(
  maquetteId: string,
  expectedUpdatedAt: string,
  payload: { available_photos: unknown; photo_assignments: unknown }
): Promise<UpdateContentResult> {
  let supabase: SupabaseClient
  try {
    supabase = await assertAuthenticated()
  } catch {
    return { success: false, error: 'Non autorisé.', code: 'other' }
  }

  const parsedPool = availablePhotosSchema.safeParse(payload.available_photos)
  const parsedAssign = photoAssignmentsSchema.safeParse(payload.photo_assignments)
  if (!parsedPool.success || !parsedAssign.success) {
    return { success: false, error: 'Photos invalides.', code: 'validation' }
  }

  try {
    assertAssignmentsPointToPool(parsedPool.data, parsedAssign.data)
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Pool/assignations incohérents.',
      code: 'validation',
    }
  }

  const { data: current, error: selErr } = await supabase
    .from('maquettes')
    .select('updated_at')
    .eq('id', maquetteId)
    .maybeSingle()

  if (selErr || !current) {
    console.error('[updateMaquettePhotos] select', selErr)
    return { success: false, error: 'Maquette introuvable.', code: 'other' }
  }

  if (current.updated_at !== expectedUpdatedAt) {
    return {
      success: false,
      code: 'stale',
      error: 'Cette maquette a été modifiée ailleurs (autre onglet ?). Rechargez pour voir les derniers changements.',
      currentUpdatedAt: current.updated_at,
    }
  }

  const { data: updated, error: updErr } = await supabase
    .from('maquettes')
    .update({
      available_photos: parsedPool.data,
      photo_assignments: parsedAssign.data,
    })
    .eq('id', maquetteId)
    .eq('updated_at', expectedUpdatedAt)
    .select('updated_at, prospect_id, slug')
    .maybeSingle()

  if (updErr) {
    console.error('[updateMaquettePhotos] update', updErr)
    return { success: false, error: 'Erreur lors de la sauvegarde.', code: 'other' }
  }

  if (!updated) {
    const { data: now } = await supabase
      .from('maquettes')
      .select('updated_at')
      .eq('id', maquetteId)
      .maybeSingle()
    return {
      success: false,
      code: 'stale',
      error: 'Cette maquette a été modifiée ailleurs (autre onglet ?). Rechargez pour voir les derniers changements.',
      currentUpdatedAt: now?.updated_at,
    }
  }

  revalidatePath(`/admin/crm/${updated.prospect_id}/maquette`)
  revalidatePath(`/admin/maquette-preview/${updated.prospect_id}`)
  if (updated.slug) revalidatePath(`/demos/${updated.slug}`)

  return { success: true, updatedAt: updated.updated_at }
}

// ─── Palette + Logo ─────────────────────────────────────────────────────────

const HEX6_REGEX = /^#[0-9A-Fa-f]{6}$/

const updateMaquettePaletteSchema = z.object({
  palette_mode: z.enum(['category', 'extracted', 'custom']).optional(),
  palette_primary: z.string().regex(HEX6_REGEX).nullable().optional(),
  palette_accent: z.string().regex(HEX6_REGEX).nullable().optional(),
}).strict()

/**
 * Met à jour la palette d'une maquette (mode + couleurs custom).
 *
 * Whitelist Zod stricte sur 3 champs uniquement. Lock optimiste `updated_at`.
 * Mode `'category'` est l'option "utiliser la palette de la catégorie",
 * mode `'extracted'` correspond aux couleurs dérivées du logo (set
 * automatiquement par `uploadMaquetteLogo`), mode `'custom'` = color picker.
 */
export async function updateMaquettePalette(
  maquetteId: string,
  expectedUpdatedAt: string,
  partial: Record<string, unknown>
): Promise<UpdateContentResult> {
  let supabase: SupabaseClient
  try {
    supabase = await assertAuthenticated()
  } catch {
    return { success: false, error: 'Non autorisé.', code: 'other' }
  }

  const parsed = updateMaquettePaletteSchema.safeParse(partial)
  if (!parsed.success) {
    return { success: false, error: 'Palette invalide.', code: 'validation' }
  }

  if (Object.keys(parsed.data).length === 0) {
    const { data: row } = await supabase
      .from('maquettes')
      .select('updated_at')
      .eq('id', maquetteId)
      .maybeSingle()
    return { success: true, updatedAt: row?.updated_at ?? expectedUpdatedAt }
  }

  const { data: current, error: selErr } = await supabase
    .from('maquettes')
    .select('updated_at')
    .eq('id', maquetteId)
    .maybeSingle()
  if (selErr || !current) {
    return { success: false, error: 'Maquette introuvable.', code: 'other' }
  }
  if (current.updated_at !== expectedUpdatedAt) {
    return {
      success: false,
      code: 'stale',
      error: 'Cette maquette a été modifiée ailleurs (autre onglet ?). Rechargez pour voir les derniers changements.',
      currentUpdatedAt: current.updated_at,
    }
  }

  const { data: updated, error: updErr } = await supabase
    .from('maquettes')
    .update(parsed.data)
    .eq('id', maquetteId)
    .eq('updated_at', expectedUpdatedAt)
    .select('updated_at, prospect_id, slug')
    .maybeSingle()

  if (updErr) {
    console.error('[updateMaquettePalette] update', updErr)
    return { success: false, error: 'Erreur lors de la sauvegarde.', code: 'other' }
  }
  if (!updated) {
    const { data: now } = await supabase
      .from('maquettes')
      .select('updated_at')
      .eq('id', maquetteId)
      .maybeSingle()
    return {
      success: false,
      code: 'stale',
      error: 'Cette maquette a été modifiée ailleurs (autre onglet ?). Rechargez pour voir les derniers changements.',
      currentUpdatedAt: now?.updated_at,
    }
  }

  revalidatePath(`/admin/crm/${updated.prospect_id}/maquette`)
  revalidatePath(`/admin/maquette-preview/${updated.prospect_id}`)
  if (updated.slug) revalidatePath(`/demos/${updated.slug}`)

  return { success: true, updatedAt: updated.updated_at }
}

/**
 * Extrait le path interne d'une URL publique Supabase Storage du bucket.
 * Format URL : `https://<project>.supabase.co/storage/v1/object/public/maquettes-assets/<path>`
 * Retourne `<path>` ou null si l'URL ne correspond pas au pattern.
 */
function extractStoragePath(url: string | null): string | null {
  if (!url) return null
  const marker = `/object/public/${STORAGE_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx < 0) return null
  return url.slice(idx + marker.length)
}

export type UploadLogoResult =
  | { success: true; data: { logoUrl: string; primary: string; accent: string; updatedAt: string } }
  | { success: false; error: string; code: 'stale' | 'validation' | 'other'; currentUpdatedAt?: string }

/**
 * Upload d'un logo de maquette + extraction des couleurs dominantes.
 *
 * Pipeline (cf. brief 3.5 sous-livrable 1) :
 *   1. Validation : MIME réel via sharp (pas l'extension), JPEG/PNG/WebP only,
 *      taille max 5 Mo, dimensions 64×64 à 4000×4000
 *   2. Resize à 512 px max + WebP qualité 90 (transparence préservée)
 *   3. Extraction des couleurs dominantes (filtres luminance 15-90, sat ≥ 15)
 *   4. Suppression de l'ancien logo Storage si présent
 *   5. Upload du nouveau WebP dans `maquettes-assets/logos/<maquetteId>/<uuid>.webp`
 *   6. UPDATE BDD : `logo_url` + `palette_mode='extracted'` + couleurs
 *
 * Lock optimiste `updated_at` (idem autres updates maquette).
 *
 * Si l'extraction échoue (logo monochrome, aucune couleur usable), on
 * upload quand même le logo mais on garde `palette_mode='category'`.
 */
export async function uploadMaquetteLogo(
  maquetteId: string,
  expectedUpdatedAt: string,
  formData: FormData
): Promise<UploadLogoResult> {
  let supabase: SupabaseClient
  try {
    supabase = await assertAuthenticated()
  } catch {
    return { success: false, error: 'Non autorisé.', code: 'other' }
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { success: false, error: 'Fichier manquant.', code: 'validation' }
  }

  // Récupère l'état courant pour le lock optimiste + l'ancien logo à supprimer
  const { data: current, error: selErr } = await supabase
    .from('maquettes')
    .select('updated_at, logo_url, prospect_id, slug')
    .eq('id', maquetteId)
    .maybeSingle()
  if (selErr || !current) {
    return { success: false, error: 'Maquette introuvable.', code: 'other' }
  }
  if (current.updated_at !== expectedUpdatedAt) {
    return {
      success: false,
      code: 'stale',
      error: 'Cette maquette a été modifiée ailleurs (autre onglet ?). Rechargez pour voir les derniers changements.',
      currentUpdatedAt: current.updated_at,
    }
  }

  // Validation + traitement (resize WebP)
  let webpBuffer: Buffer
  let originalBuffer: Buffer
  try {
    const arrayBuffer = await file.arrayBuffer()
    originalBuffer = Buffer.from(arrayBuffer)
    const result = await processLogoBuffer(originalBuffer)
    webpBuffer = result.webpBuffer
  } catch (e) {
    if (e instanceof LogoValidationError) {
      return { success: false, error: e.message, code: 'validation' }
    }
    console.error('[uploadMaquetteLogo] process', e)
    return { success: false, error: 'Impossible de traiter l\'image.', code: 'other' }
  }

  // Extraction des couleurs sur l'image originale (plus de pixels = meilleur signal)
  let primary: string | null = null
  let accent: string | null = null
  try {
    const palette = await extractDominantColors(originalBuffer)
    if (palette) {
      primary = palette.primary
      accent = palette.accent
    }
  } catch (e) {
    console.error('[uploadMaquetteLogo] extract colors', e)
    // Ne bloque pas l'upload — on tombe sur palette catégorie.
  }

  // Suppression de l'ancien logo Storage si présent
  const oldPath = extractStoragePath(current.logo_url)
  if (oldPath) {
    await supabase.storage.from(STORAGE_BUCKET).remove([oldPath]).catch((e) => {
      console.error('[uploadMaquetteLogo] remove old logo', e)
    })
  }

  // Upload du nouveau
  const newPath = `${STORAGE_LOGO_PREFIX}/${maquetteId}/${randomUUID()}.webp`
  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(newPath, webpBuffer, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false,
    })
  if (uploadErr) {
    console.error('[uploadMaquetteLogo] upload', uploadErr)
    return { success: false, error: 'Erreur lors de l\'upload du logo.', code: 'other' }
  }

  const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(newPath)
  const logoUrl = pub.publicUrl

  // UPDATE BDD : logo_url + palette si extraction OK
  const updates: Record<string, unknown> = { logo_url: logoUrl }
  if (primary && accent) {
    updates.palette_mode = 'extracted'
    updates.palette_primary = primary
    updates.palette_accent = accent
  }

  const { data: updated, error: updErr } = await supabase
    .from('maquettes')
    .update(updates)
    .eq('id', maquetteId)
    .eq('updated_at', expectedUpdatedAt)
    .select('updated_at')
    .maybeSingle()

  if (updErr || !updated) {
    // Rollback storage : on retire le fichier qu'on vient d'uploader pour
    // ne pas laisser un orphelin si le UPDATE échoue.
    await supabase.storage.from(STORAGE_BUCKET).remove([newPath]).catch(() => {})
    if (updErr) console.error('[uploadMaquetteLogo] update', updErr)
    return {
      success: false,
      error: updErr ? 'Erreur lors de la sauvegarde.' : 'Maquette modifiée pendant l\'upload, recharge la page.',
      code: updErr ? 'other' : 'stale',
    }
  }

  revalidatePath(`/admin/crm/${current.prospect_id}/maquette`)
  revalidatePath(`/admin/maquette-preview/${current.prospect_id}`)
  if (current.slug) revalidatePath(`/demos/${current.slug}`)

  return {
    success: true,
    data: {
      logoUrl,
      primary: primary ?? '',
      accent: accent ?? '',
      updatedAt: updated.updated_at,
    },
  }
}

/**
 * Supprime le logo d'une maquette : fichier Storage + reset palette en BDD
 * (logo_url=null, palette_mode='category' si on était en 'extracted',
 * palette_primary/accent=null).
 */
export async function deleteMaquetteLogo(
  maquetteId: string,
  expectedUpdatedAt: string
): Promise<UpdateContentResult> {
  let supabase: SupabaseClient
  try {
    supabase = await assertAuthenticated()
  } catch {
    return { success: false, error: 'Non autorisé.', code: 'other' }
  }

  const { data: current, error: selErr } = await supabase
    .from('maquettes')
    .select('updated_at, logo_url, palette_mode, prospect_id, slug')
    .eq('id', maquetteId)
    .maybeSingle()
  if (selErr || !current) {
    return { success: false, error: 'Maquette introuvable.', code: 'other' }
  }
  if (current.updated_at !== expectedUpdatedAt) {
    return {
      success: false,
      code: 'stale',
      error: 'Cette maquette a été modifiée ailleurs (autre onglet ?). Rechargez pour voir les derniers changements.',
      currentUpdatedAt: current.updated_at,
    }
  }

  // Supprime le fichier Storage si présent (pas bloquant si erreur)
  const path = extractStoragePath(current.logo_url)
  if (path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]).catch((e) => {
      console.error('[deleteMaquetteLogo] remove', e)
    })
  }

  // Reset BDD : on bascule en 'category' si on était en 'extracted'
  // (cohérent : sans logo, les couleurs extraites n'ont plus de sens).
  // En 'custom' on garde le mode (l'admin a explicitement choisi ses hex).
  const updates: Record<string, unknown> = { logo_url: null }
  if (current.palette_mode === 'extracted') {
    updates.palette_mode = 'category'
    updates.palette_primary = null
    updates.palette_accent = null
  }

  const { data: updated, error: updErr } = await supabase
    .from('maquettes')
    .update(updates)
    .eq('id', maquetteId)
    .eq('updated_at', expectedUpdatedAt)
    .select('updated_at')
    .maybeSingle()

  if (updErr || !updated) {
    return {
      success: false,
      error: updErr ? 'Erreur lors de la sauvegarde.' : 'Maquette modifiée pendant la suppression, recharge la page.',
      code: updErr ? 'other' : 'stale',
    }
  }

  revalidatePath(`/admin/crm/${current.prospect_id}/maquette`)
  revalidatePath(`/admin/maquette-preview/${current.prospect_id}`)
  if (current.slug) revalidatePath(`/demos/${current.slug}`)

  return { success: true, updatedAt: updated.updated_at }
}

// ─── Slug édition ──────────────────────────────────────────────────────────

const SLUG_REGEX = /^[a-z0-9-]+$/

const updateMaquetteSlugSchema = z.object({
  newSlug: z.string()
    .min(1)
    .max(80)
    .regex(SLUG_REGEX, 'Format invalide : seules les minuscules, chiffres et tirets sont autorisés.'),
}).strict()

export type UpdateSlugResult =
  | { success: true; data: { slug: string; updatedAt: string; url: string | null } }
  | { success: false; error: string; code: 'stale' | 'validation' | 'duplicate' | 'other'; currentUpdatedAt?: string }

/**
 * Modifie le slug d'une maquette.
 *
 * ⚠️ ACTE DESTRUCTIF — le slug pilote l'URL publique /demos/[slug] et les
 * QR codes imprimés des affiches A4. Toute modification CASSE les liens
 * distribués / QR codes pré-imprimés. La confirmation utilisateur est de la
 * responsabilité de l'UI (modale type "tape l'ancien slug pour confirmer").
 *
 * Validations :
 *   - format strict ^[a-z0-9-]+$ (cohérent avec le CHECK BDD)
 *   - longueur 1–80
 *   - unicité globale (autre maquette → rejet `duplicate`)
 *   - lock optimiste updated_at
 *
 * Effets :
 *   - UPDATE `maquettes.slug`
 *   - Si publiée, UPDATE `prospects.maquette_url` avec la nouvelle URL
 *   - revalidatePath sur l'ancien ET le nouveau slug
 */
export async function updateMaquetteSlug(
  maquetteId: string,
  expectedUpdatedAt: string,
  rawNewSlug: string
): Promise<UpdateSlugResult> {
  let supabase: SupabaseClient
  try {
    supabase = await assertAuthenticated()
  } catch {
    return { success: false, error: 'Non autorisé.', code: 'other' }
  }

  const parsed = updateMaquetteSlugSchema.safeParse({ newSlug: rawNewSlug })
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Slug invalide.',
      code: 'validation',
    }
  }
  const newSlug = parsed.data.newSlug

  const { data: current, error: selErr } = await supabase
    .from('maquettes')
    .select('updated_at, slug, published, prospect_id')
    .eq('id', maquetteId)
    .maybeSingle()
  if (selErr || !current) {
    return { success: false, error: 'Maquette introuvable.', code: 'other' }
  }
  if (current.updated_at !== expectedUpdatedAt) {
    return {
      success: false,
      code: 'stale',
      error: 'Cette maquette a été modifiée ailleurs (autre onglet ?). Rechargez pour voir les derniers changements.',
      currentUpdatedAt: current.updated_at,
    }
  }

  // No-op si identique
  if (current.slug === newSlug) {
    const url = current.published ? `${SITE_URL}/demos/${newSlug}` : null
    return { success: true, data: { slug: newSlug, updatedAt: current.updated_at, url } }
  }

  // Check unicité (autre maquette avec ce slug)
  const { data: dup } = await supabase
    .from('maquettes')
    .select('id')
    .eq('slug', newSlug)
    .neq('id', maquetteId)
    .maybeSingle()
  if (dup) {
    return {
      success: false,
      code: 'duplicate',
      error: `Le slug « ${newSlug} » est déjà utilisé par une autre maquette.`,
    }
  }

  const { data: updated, error: updErr } = await supabase
    .from('maquettes')
    .update({ slug: newSlug })
    .eq('id', maquetteId)
    .eq('updated_at', expectedUpdatedAt)
    .select('updated_at')
    .maybeSingle()

  if (updErr) {
    if (updErr.code === '23505') {
      return {
        success: false,
        code: 'duplicate',
        error: `Le slug « ${newSlug} » vient d'être pris par une autre maquette.`,
      }
    }
    console.error('[updateMaquetteSlug] update', updErr)
    return { success: false, error: 'Erreur lors de la sauvegarde.', code: 'other' }
  }
  if (!updated) {
    return {
      success: false,
      code: 'stale',
      error: 'Cette maquette a été modifiée pendant l\'opération. Rechargez la page.',
    }
  }

  // Si la maquette est publiée, on resync prospects.maquette_url
  let url: string | null = null
  if (current.published) {
    url = `${SITE_URL}/demos/${newSlug}`
    await supabase
      .from('prospects')
      .update({ maquette_url: url })
      .eq('id', current.prospect_id)
  }

  revalidatePath(`/admin/crm/${current.prospect_id}/maquette`)
  revalidatePath(`/admin/maquette-preview/${current.prospect_id}`)
  revalidatePath(`/demos/${current.slug}`)
  revalidatePath(`/demos/${newSlug}`)

  return { success: true, data: { slug: newSlug, updatedAt: updated.updated_at, url } }
}

// ─── Upload photo manuelle (univers / hero / histoire) ─────────────────────

export type UploadPhotoResult =
  | { success: true; data: { photoId: string; reference: string; updatedAt: string } }
  | { success: false; error: string; code: 'stale' | 'validation' | 'other'; currentUpdatedAt?: string }

/**
 * Upload d'une photo manuelle dans le pool d'une maquette.
 *
 * Pipeline :
 *   1. Validation (sharp détecte MIME réel, JPEG/PNG/WebP only, ≤ 5 Mo,
 *      400×400 à 4000×4000)
 *   2. Resize 1920 px max + WebP qualité 80
 *   3. Upload dans `maquettes-assets/photos/<maquetteId>/<uuid>.webp`
 *   4. Append nouvelle entrée `{source:'upload', reference: url, uploaded_at: now}`
 *      dans `available_photos` — la photo arrive NON ASSIGNÉE (l'admin la
 *      drag-droppe vers un slot dans le PhotoManager)
 *   5. UPDATE atomique avec lock optimiste — si la maquette a changé
 *      entre-temps, on rollback le fichier Storage uploadé.
 *
 * Pas de modification des `photo_assignments` (pas d'auto-assignation).
 */
export async function uploadMaquettePhoto(
  maquetteId: string,
  expectedUpdatedAt: string,
  formData: FormData
): Promise<UploadPhotoResult> {
  let supabase: SupabaseClient
  try {
    supabase = await assertAuthenticated()
  } catch {
    return { success: false, error: 'Non autorisé.', code: 'other' }
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { success: false, error: 'Fichier manquant.', code: 'validation' }
  }

  // Lock optimiste + récup du pool actuel
  const { data: current, error: selErr } = await supabase
    .from('maquettes')
    .select('updated_at, available_photos, prospect_id, slug')
    .eq('id', maquetteId)
    .maybeSingle()
  if (selErr || !current) {
    return { success: false, error: 'Maquette introuvable.', code: 'other' }
  }
  if (current.updated_at !== expectedUpdatedAt) {
    return {
      success: false,
      code: 'stale',
      error: 'Cette maquette a été modifiée ailleurs (autre onglet ?). Rechargez pour voir les derniers changements.',
      currentUpdatedAt: current.updated_at,
    }
  }

  // Validation + traitement WebP
  let webpBuffer: Buffer
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await processPhotoBuffer(Buffer.from(arrayBuffer))
    webpBuffer = result.webpBuffer
  } catch (e) {
    if (e instanceof LogoValidationError) {
      return { success: false, error: e.message, code: 'validation' }
    }
    console.error('[uploadMaquettePhoto] process', e)
    return { success: false, error: 'Impossible de traiter l\'image.', code: 'other' }
  }

  // Upload Storage
  const photoId = randomUUID()
  const newPath = `${STORAGE_PHOTO_PREFIX}/${maquetteId}/${photoId}.webp`
  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(newPath, webpBuffer, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false,
    })
  if (uploadErr) {
    console.error('[uploadMaquettePhoto] upload', uploadErr)
    return { success: false, error: 'Erreur lors de l\'upload de la photo.', code: 'other' }
  }

  const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(newPath)
  const reference = pub.publicUrl

  // Append au pool
  const currentPool = (current.available_photos ?? []) as MaquettePhotoEntry[]
  const newEntry: MaquettePhotoEntry = {
    id: photoId,
    source: 'upload',
    reference,
    uploaded_at: new Date().toISOString(),
  }
  const newPool: MaquettePhotoEntry[] = [...currentPool, newEntry]

  // Validation Zod du nouveau pool avant écriture (filet de sécurité)
  const parsedPool = availablePhotosSchema.safeParse(newPool)
  if (!parsedPool.success) {
    await supabase.storage.from(STORAGE_BUCKET).remove([newPath]).catch(() => {})
    console.error('[uploadMaquettePhoto] pool validation', parsedPool.error)
    return { success: false, error: 'Pool de photos invalide.', code: 'validation' }
  }

  const { data: updated, error: updErr } = await supabase
    .from('maquettes')
    .update({ available_photos: parsedPool.data })
    .eq('id', maquetteId)
    .eq('updated_at', expectedUpdatedAt)
    .select('updated_at')
    .maybeSingle()

  if (updErr || !updated) {
    // Rollback Storage : on retire le fichier uploadé pour ne pas laisser un orphelin
    await supabase.storage.from(STORAGE_BUCKET).remove([newPath]).catch(() => {})
    if (updErr) console.error('[uploadMaquettePhoto] update', updErr)
    return {
      success: false,
      error: updErr ? 'Erreur lors de la sauvegarde.' : 'Maquette modifiée pendant l\'upload, recharge la page.',
      code: updErr ? 'other' : 'stale',
    }
  }

  revalidatePath(`/admin/crm/${current.prospect_id}/maquette`)
  revalidatePath(`/admin/maquette-preview/${current.prospect_id}`)
  if (current.slug) revalidatePath(`/demos/${current.slug}`)

  return {
    success: true,
    data: { photoId, reference, updatedAt: updated.updated_at },
  }
}

/**
 * Supprime une photo uploadée du pool d'une maquette + le fichier Storage.
 *
 * Garde-fous :
 *   - Refuse de supprimer une photo `source: 'google'` (anti bug client)
 *   - Si la photo était assignée à un ou plusieurs slots, désassigne aussi
 *   - Storage delete pas bloquant si erreur (loggé) — la BDD prime
 */
export async function deleteMaquettePhotoUpload(
  maquetteId: string,
  expectedUpdatedAt: string,
  photoId: string
): Promise<UpdateContentResult> {
  let supabase: SupabaseClient
  try {
    supabase = await assertAuthenticated()
  } catch {
    return { success: false, error: 'Non autorisé.', code: 'other' }
  }

  const { data: current, error: selErr } = await supabase
    .from('maquettes')
    .select('updated_at, available_photos, photo_assignments, prospect_id, slug')
    .eq('id', maquetteId)
    .maybeSingle()
  if (selErr || !current) {
    return { success: false, error: 'Maquette introuvable.', code: 'other' }
  }
  if (current.updated_at !== expectedUpdatedAt) {
    return {
      success: false,
      code: 'stale',
      error: 'Cette maquette a été modifiée ailleurs (autre onglet ?). Rechargez pour voir les derniers changements.',
      currentUpdatedAt: current.updated_at,
    }
  }

  const pool = (current.available_photos ?? []) as MaquettePhotoEntry[]
  const target = pool.find((p) => p.id === photoId)
  if (!target) {
    return { success: false, error: 'Photo introuvable dans le pool.', code: 'validation' }
  }
  if (target.source !== 'upload') {
    return { success: false, error: 'Seules les photos uploadées peuvent être supprimées via cette voie.', code: 'validation' }
  }

  // Suppression Storage (path interne)
  const path = extractStoragePath(target.reference)
  if (path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]).catch((e) => {
      console.error('[deleteMaquettePhotoUpload] remove storage', e)
    })
  }

  // Update pool + désassigne tout slot pointant vers cette photo
  const newPool = pool.filter((p) => p.id !== photoId)
  const currentAssignments = (current.photo_assignments ?? []) as { slot: string; photo_id: string | null }[]
  const newAssignments = currentAssignments.map((a) =>
    a.photo_id === photoId ? { ...a, photo_id: null } : a
  )

  // Validation Zod
  const parsedPool = availablePhotosSchema.safeParse(newPool)
  const parsedAssign = photoAssignmentsSchema.safeParse(newAssignments)
  if (!parsedPool.success || !parsedAssign.success) {
    return { success: false, error: 'Pool/assignations invalides.', code: 'validation' }
  }

  const { data: updated, error: updErr } = await supabase
    .from('maquettes')
    .update({
      available_photos: parsedPool.data,
      photo_assignments: parsedAssign.data,
    })
    .eq('id', maquetteId)
    .eq('updated_at', expectedUpdatedAt)
    .select('updated_at')
    .maybeSingle()

  if (updErr || !updated) {
    return {
      success: false,
      error: updErr ? 'Erreur lors de la sauvegarde.' : 'Maquette modifiée pendant la suppression, recharge la page.',
      code: updErr ? 'other' : 'stale',
    }
  }

  revalidatePath(`/admin/crm/${current.prospect_id}/maquette`)
  revalidatePath(`/admin/maquette-preview/${current.prospect_id}`)
  if (current.slug) revalidatePath(`/demos/${current.slug}`)

  return { success: true, updatedAt: updated.updated_at }
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
