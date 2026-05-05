'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prospectSchema, type ProspectFormData } from '@/lib/validations/prospect'
import { verifyEnrichedToken } from '@/lib/crm/enriched-cookie'
import { enrichedToGoogleDbFields } from '@/lib/crm/google-mapping'
import {
  buildScoreDbFields,
  relevantSnapshot,
  toScoringInput,
} from '@/lib/scoring/apply'
import type { Prospect } from '@/types'

async function assertAuthenticated() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé.')
  return supabase
}

export type ProspectActionState = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createProspect(
  _prev: ProspectActionState,
  formData: FormData
): Promise<ProspectActionState> {
  const supabase = await assertAuthenticated().catch(() => null)
  if (!supabase) return { success: false, error: 'Non autorisé.' }

  const raw = extractProspectFields(formData)
  const parsed = prospectSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Token enrichi posé en input hidden par /nouveau?from=enrich. Self-contained :
  // ce qui était affiché dans le form est ce qui sera soumis, indépendamment
  // de ce que d'autres onglets ont pu faire au cookie entretemps.
  const tokenRaw = formData.get('_enriched_token')
  const enrichedToken = typeof tokenRaw === 'string' ? tokenRaw : null
  const enriched = verifyEnrichedToken(enrichedToken)

  let payload: Record<string, unknown> = toDbPayload(parsed.data)
  if (enriched) {
    payload = {
      ...payload,
      ...enrichedToGoogleDbFields(enriched),
      source: 'enrichissement',
    }
  }

  // Calcul automatique du score à partir du payload final (form + données Google
  // enrichies). Pas d'override manuel à la création.
  const scoreFields = buildScoreDbFields(toScoringInput(payload as Partial<Prospect>), null)
  payload = { ...payload, ...scoreFields, score_override_manuel: null }

  const { error } = await supabase.from('prospects').insert(payload)

  if (error) {
    if (error.code === '23505' && enriched) {
      // Violation index unique sur google_place_id : un autre prospect a
      // déjà ce place_id. On retrouve son nom pour donner un message utile
      // à l'admin (et logger le placeId concerné pour debug).
      const { data: dup } = await supabase
        .from('prospects')
        .select('id,nom_commerce')
        .eq('google_place_id', enriched.placeId)
        .maybeSingle()
      console.error('[createProspect] doublon google_place_id', {
        placeId: enriched.placeId,
        existing: dup,
      })
      return {
        success: false,
        error: dup
          ? `Le lieu Google "${enriched.name}" est déjà lié à la fiche "${dup.nom_commerce}". Annulez et utilisez "Mettre à jour la fiche existante" depuis l'import.`
          : 'Un prospect avec ce lieu Google existe déjà.',
      }
    }
    console.error('[createProspect]', error)
    return { success: false, error: 'Erreur lors de la création.' }
  }

  // Plus rien à clear côté cookie : le token étant dans le form, il disparaît
  // naturellement à la prochaine navigation.

  revalidatePath('/admin/crm')

  return { success: true }
}

export async function updateProspect(
  id: string,
  _prev: ProspectActionState,
  formData: FormData
): Promise<ProspectActionState> {
  const supabase = await assertAuthenticated().catch(() => null)
  if (!supabase) return { success: false, error: 'Non autorisé.' }

  const raw = extractProspectFields(formData)
  const parsed = prospectSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Récupère l'état avant pour pouvoir comparer le périmètre du score :
  // si rien de pertinent n'a changé, on évite de re-calculer + UPDATE inutile.
  const { data: oldRow } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  const newPayload: Record<string, unknown> = toDbPayload(parsed.data)

  if (oldRow) {
    const oldSnap = relevantSnapshot(oldRow as Prospect)
    const newSnap = relevantSnapshot({ ...(oldRow as Prospect), ...newPayload })
    if (oldSnap !== newSnap) {
      // Un champ scoring-pertinent a changé → on recalcule, en respectant
      // un éventuel override manuel existant.
      const merged = { ...(oldRow as Prospect), ...newPayload }
      const scoreFields = buildScoreDbFields(
        toScoringInput(merged),
        (oldRow as Prospect).score_override_manuel ?? null
      )
      Object.assign(newPayload, scoreFields)
    }
  }

  const { error } = await supabase
    .from('prospects')
    .update(newPayload)
    .eq('id', id)

  if (error) {
    console.error('[updateProspect]', error)
    return { success: false, error: 'Erreur lors de la mise à jour.' }
  }

  revalidatePath('/admin/crm')
  revalidatePath(`/admin/crm/${id}`)

  return { success: true }
}

export async function deleteProspect(id: string): Promise<{ error?: string }> {
  const supabase = await assertAuthenticated().catch(() => null)
  if (!supabase) return { error: 'Non autorisé.' }

  const { error } = await supabase.from('prospects').delete().eq('id', id)

  if (error) {
    console.error('[deleteProspect]', error)
    return { error: 'Erreur lors de la suppression.' }
  }

  revalidatePath('/admin/crm')

  return {}
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function get(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  return trimmed === '' ? undefined : trimmed
}

function extractProspectFields(formData: FormData) {
  return {
    nom_commerce: formData.get('nom_commerce'),
    categorie: formData.get('categorie'),
    adresse: get(formData, 'adresse'),
    ville: get(formData, 'ville'),
    code_postal: get(formData, 'code_postal'),
    distance_km: get(formData, 'distance_km'),
    telephone: get(formData, 'telephone'),
    email: get(formData, 'email'),
    site_existant_url: get(formData, 'site_existant_url'),
    instagram_url: get(formData, 'instagram_url'),
    facebook_url: get(formData, 'facebook_url'),
    canal: formData.get('canal'),
    statut: formData.get('statut'),
    notes: get(formData, 'notes'),
    date_dernier_contact: get(formData, 'date_dernier_contact'),
    date_relance_prevue: get(formData, 'date_relance_prevue'),
  }
}

function toDbPayload(data: ProspectFormData) {
  return {
    nom_commerce: data.nom_commerce,
    categorie: data.categorie,
    adresse: data.adresse ?? null,
    ville: data.ville ?? null,
    code_postal: data.code_postal ?? null,
    distance_km: data.distance_km ?? null,
    telephone: data.telephone ?? null,
    email: data.email ?? null,
    site_existant_url: data.site_existant_url ?? null,
    instagram_url: data.instagram_url ?? null,
    facebook_url: data.facebook_url ?? null,
    canal: data.canal,
    statut: data.statut,
    notes: data.notes ?? null,
    date_dernier_contact: data.date_dernier_contact ?? null,
    date_relance_prevue: data.date_relance_prevue ?? null,
  }
}
