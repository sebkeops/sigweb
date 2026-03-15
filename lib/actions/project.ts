'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { projectSchema, type ProjectFormData } from '@/lib/validations/project'

async function assertAuthenticated() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé.')
  return supabase
}

export type ProjectActionState = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createProject(
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const supabase = await assertAuthenticated().catch(() => null)
  if (!supabase) return { success: false, error: 'Non autorisé.' }

  const raw = extractProjectFields(formData)
  const parsed = projectSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { error } = await supabase.from('projects').insert(toDbPayload(parsed.data))

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ce slug est déjà utilisé.' }
    }
    console.error('[createProject]', error)
    return { success: false, error: 'Erreur lors de la création.' }
  }

  revalidatePath('/')
  revalidatePath('/admin/projets')
  revalidatePath('/simulations')
  revalidatePath('/realisations')

  return { success: true }
}

export async function updateProject(
  id: string,
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const supabase = await assertAuthenticated().catch(() => null)
  if (!supabase) return { success: false, error: 'Non autorisé.' }

  const raw = extractProjectFields(formData)
  const parsed = projectSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { error } = await supabase
    .from('projects')
    .update(toDbPayload(parsed.data))
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ce slug est déjà utilisé.' }
    }
    console.error('[updateProject]', error)
    return { success: false, error: 'Erreur lors de la mise à jour.' }
  }

  revalidatePath('/')
  revalidatePath('/admin/projets')
  revalidatePath('/simulations')
  revalidatePath('/realisations')

  return { success: true }
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  const supabase = await assertAuthenticated().catch(() => null)
  if (!supabase) return { error: 'Non autorisé.' }

  const { error } = await supabase.from('projects').delete().eq('id', id)

  if (error) {
    console.error('[deleteProject]', error)
    return { error: 'Erreur lors de la suppression.' }
  }

  revalidatePath('/admin/projets')
  revalidatePath('/simulations')
  revalidatePath('/realisations')

  return {}
}

export async function toggleProjectPublished(
  id: string,
  published: boolean
): Promise<{ error?: string }> {
  const supabase = await assertAuthenticated().catch(() => null)
  if (!supabase) return { error: 'Non autorisé.' }

  const { error } = await supabase
    .from('projects')
    .update({ published })
    .eq('id', id)

  if (error) {
    console.error('[toggleProjectPublished]', error)
    return { error: 'Erreur lors de la mise à jour.' }
  }

  revalidatePath('/admin/projets')
  revalidatePath('/simulations')
  revalidatePath('/realisations')

  return {}
}

export async function markContactRead(id: string): Promise<{ error?: string }> {
  const supabase = await assertAuthenticated().catch(() => null)
  if (!supabase) return { error: 'Non autorisé.' }

  const { error } = await supabase
    .from('contacts')
    .update({ is_read: true })
    .eq('id', id)

  if (error) {
    console.error('[markContactRead]', error)
    return { error: 'Erreur lors de la mise à jour.' }
  }

  revalidatePath('/admin/contacts')

  return {}
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractProjectFields(formData: FormData) {
  return {
    title: formData.get('title'),
    slug: formData.get('slug'),
    business_type: formData.get('business_type') ?? undefined,
    short_description: formData.get('short_description') ?? undefined,
    content: formData.get('content') ?? undefined,
    cover_image_url: formData.get('cover_image_url') ?? undefined,
    external_url: formData.get('external_url') ?? undefined,
    project_kind: formData.get('project_kind'),
    published: formData.get('published') === 'true',
    featured_home: formData.get('featured_home') === 'true',
  }
}

function toDbPayload(data: ProjectFormData) {
  return {
    title: data.title,
    slug: data.slug,
    business_type: data.business_type ?? null,
    short_description: data.short_description ?? null,
    content: data.content ?? null,
    cover_image_url: data.cover_image_url ?? null,
    external_url: data.external_url ?? null,
    project_kind: data.project_kind,
    published: data.published,
    featured_home: data.featured_home,
  }
}
