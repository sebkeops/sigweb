'use server'

import { createClient } from '@/lib/supabase/server'
import { contactSchema } from '@/lib/validations/contact'

export type ContactActionState = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function submitContact(
  _prev: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const raw = {
    name: formData.get('name'),
    business_name: formData.get('business_name') ?? undefined,
    email: formData.get('email'),
    phone: formData.get('phone') ?? undefined,
    business_type: formData.get('business_type') ?? undefined,
    message: formData.get('message'),
    website: formData.get('website') ?? '',
  }

  const parsed = contactSchema.safeParse(raw)

  if (!parsed.success) {
    // Si le honeypot est rempli, on simule un succès sans enregistrer
    if (raw.website !== '') {
      return { success: true }
    }
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Honeypot rempli → succès silencieux
  if (parsed.data.website !== '') {
    return { success: true }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('contacts').insert({
    name: parsed.data.name,
    business_name: parsed.data.business_name ?? null,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    business_type: parsed.data.business_type ?? null,
    message: parsed.data.message,
  })

  if (error) {
    console.error('[submitContact]', error)
    return {
      success: false,
      error: 'Une erreur est survenue. Merci de réessayer ou de nous contacter directement.',
    }
  }

  return { success: true }
}
