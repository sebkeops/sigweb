import { z } from 'zod'

const SimulationFeaturedCardSchema = z.object({
  title: z.string(),
  text: z.string(),
  image: z.string(),
})

export const SimulationDataSchema = z.object({
  businessType: z.string(),
  theme: z.string(),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  heroImage: z.string(),
  gallery: z.array(z.string()).default([]),
  contact: z.object({
    address: z.string(),
    city: z.string(),
    phone: z.string(),
  }),
  hours: z.array(z.string()).default([]),
  highlights: z.array(z.string()).default([]),
  featuredCards: z.array(SimulationFeaturedCardSchema).default([]),
  reviews: z.array(z.string()).default([]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  intro: z.string().optional(),
})
