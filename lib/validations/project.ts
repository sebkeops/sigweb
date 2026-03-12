import { z } from 'zod'

export const projectSchema = z.object({
  title: z.string().min(2, 'Le titre est requis.').max(200).trim(),
  slug: z
    .string()
    .min(2, 'Le slug est requis.')
    .max(200)
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets.'),
  business_type: z.string().max(100).trim().optional(),
  short_description: z.string().max(500).trim().optional(),
  content: z.string().max(10000).trim().optional(),
  cover_image_url: z
    .string()
    .trim()
    .refine((v) => v === '' || z.string().url().safeParse(v).success, {
      message: 'URL invalide.',
    })
    .optional(),
  external_url: z
    .string()
    .trim()
    .refine((v) => v === '' || z.string().url().safeParse(v).success, {
      message: 'URL invalide.',
    })
    .optional(),
  project_kind: z.enum(['simulation', 'realisation']),
  published: z.boolean(),
})

export type ProjectFormData = z.infer<typeof projectSchema>
