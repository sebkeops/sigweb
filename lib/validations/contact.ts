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
    .trim()
    .regex(/^(\+33\s?|0)[1-9](\s?[0-9]{2}){4}$/, 'Numéro de téléphone invalide.')
    .optional()
    .or(z.literal('')),
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
