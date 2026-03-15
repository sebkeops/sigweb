export type ProjectKind = 'simulation' | 'realisation'

export interface SimulationFeaturedCard {
  title: string
  text: string
  image: string
}

export interface SimulationData {
  businessType: string
  theme: string
  name: string
  tagline: string
  description: string
  heroImage: string
  gallery: string[]
  contact: {
    address: string
    city: string
    phone: string
  }
  hours: string[]
  highlights: string[]
  featuredCards: SimulationFeaturedCard[]
  reviews: string[]
  seoTitle?: string
  seoDescription?: string
  intro?: string
}

export interface Project {
  id: string
  title: string
  slug: string
  business_type: string | null
  short_description: string | null
  content: string | null
  cover_image_url: string | null
  external_url: string | null
  project_kind: ProjectKind
  published: boolean
  featured_home: boolean
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  name: string
  business_name: string | null
  email: string
  phone: string | null
  business_type: string | null
  message: string
  is_read: boolean
  created_at: string
}
