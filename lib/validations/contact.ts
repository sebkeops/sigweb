import { z } from 'zod'

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Votre nom doit contenir au moins 2 caractères.')
    .max(100)
    .trim(),
  business_name: z.string().max(150).trim().optional(),
  email: z
    .string()
    .email('Adresse email invalide.')
    .max(255)
    .trim()
    .toLowerCase(),
  phone: z
    .string()
    .max(20)
    .trim()
    .optional(),
  business_type: z.string().max(100).trim().optional(),
  message: z
    .string()
    .min(10, 'Votre message doit contenir au moins 10 caractères.')
    .max(2000)
    .trim(),
  // Honeypot anti-spam — doit rester vide
  website: z.string().max(0, 'Erreur de validation.'),
})

export type ContactFormData = z.infer<typeof contactSchema>
