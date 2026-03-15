'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { contactSchema } from '@/lib/validations/contact'

export type ContactActionState = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

// ── Rate limiting simple (par IP, par instance serverless) ─────────────────
// Limite : 3 soumissions par IP sur 10 minutes
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const rateLimitMap = new Map<string, { count: number; firstAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.firstAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, firstAt: now })
    return false
  }
  if (entry.count >= RATE_LIMIT_MAX) return true
  entry.count++
  return false
}

// ── Notification email via Resend (optionnel — actif si RESEND_API_KEY défini) ─
async function sendContactNotification(data: {
  name: string
  email: string
  business_name?: string | null
  business_type?: string | null
  phone?: string | null
  message: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.RESEND_TO_EMAIL
  if (!apiKey || !toEmail) return // Silencieux si non configuré

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: 'SIGWEB <contact@updates.sigweb.fr>',
      to: toEmail,
      subject: `SIGWEB — Nouveau message de contact (${data.name})`,
      text: [
        `Nom : ${data.name}`,
        data.business_name ? `Commerce : ${data.business_name}` : '',
        `Email : ${data.email}`,
        data.phone ? `Téléphone : ${data.phone}` : '',
        data.business_type ? `Activité : ${data.business_type}` : '',
        '',
        `Message :`,
        data.message,
      ]
        .filter(Boolean)
        .join('\n'),
    })
  } catch (err) {
    // Ne pas bloquer la soumission si l'email échoue
    console.error('[sendContactNotification]', err)
  }
}

export async function submitContact(
  _prev: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  // Rate limiting par IP
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return {
      success: false,
      error: 'Trop de tentatives. Merci de réessayer dans quelques minutes.',
    }
  }

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

  // Notification email (non bloquante)
  await sendContactNotification({
    name: parsed.data.name,
    email: parsed.data.email,
    business_name: parsed.data.business_name,
    business_type: parsed.data.business_type,
    phone: parsed.data.phone,
    message: parsed.data.message,
  })

  return { success: true }
}

// ── markContactRead ────────────────────────────────────────────────────────
// (déplacé ici depuis lib/actions/project.ts)
import { revalidatePath } from 'next/cache'

async function assertAuthenticated() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé.')
  return supabase
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
