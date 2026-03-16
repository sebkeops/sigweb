'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ── Schéma de validation ───────────────────────────────────────
const simulateurSchema = z.object({
  name: z.string().min(2, 'Merci de saisir votre nom (au moins 2 caractères).').max(100).trim(),
  email: z.string().email('Adresse email invalide.').max(255).trim().toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^(\+33\s?|0)[1-9](\s?[0-9]{2}){4}$/, 'Numéro de téléphone invalide.')
    .optional()
    .or(z.literal('')),
  business_name: z.string().max(150).trim().optional(),
  summary: z.string().min(1).max(5000).trim(),
  website: z.string().max(0, 'Erreur de validation.'), // honeypot
})

// ── Rate limiting (3 soumissions / 10 min par IP) ─────────────
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

// ── Notification email ─────────────────────────────────────────
async function sendSimulateurNotification(data: {
  name: string
  email: string
  phone?: string
  business_name?: string
  summary: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.RESEND_TO_EMAIL
  if (!apiKey || !toEmail) return

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: 'SIGWEB <contact@updates.sigweb.fr>',
      to: toEmail,
      subject: `SIGWEB — Estimation simulateur (${data.name})`,
      text: [
        `Nom : ${data.name}`,
        data.business_name ? `Commerce : ${data.business_name}` : '',
        `Email : ${data.email}`,
        data.phone ? `Téléphone : ${data.phone}` : '',
        '',
        data.summary,
      ]
        .filter(Boolean)
        .join('\n'),
    })
  } catch (err) {
    console.error('[sendSimulateurNotification]', err)
  }
}

// ── Action principale ──────────────────────────────────────────
export type SimulateurActionResult = {
  success: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function submitSimulateur(input: {
  name: string
  email: string
  phone?: string
  business_name?: string
  summary: string
  website?: string
}): Promise<SimulateurActionResult> {
  // Honeypot : si rempli, succès silencieux
  if (input.website && input.website.trim() !== '') return { success: true }

  // Rate limiting par IP
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return { success: false, error: 'Trop de tentatives. Merci de réessayer dans quelques minutes.' }
  }

  // Validation serveur
  const parsed = simulateurSchema.safeParse({
    ...input,
    website: input.website ?? '',
  })

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Insertion en base
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    business_name: parsed.data.business_name ?? null,
    message: parsed.data.summary,
    business_type: 'Simulateur',
  })

  if (error) {
    console.error('[submitSimulateur]', error)
    return { success: false, error: 'Une erreur est survenue. Merci de réessayer.' }
  }

  // Notification email (non bloquante)
  await sendSimulateurNotification({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    business_name: parsed.data.business_name,
    summary: parsed.data.summary,
  })

  return { success: true }
}
