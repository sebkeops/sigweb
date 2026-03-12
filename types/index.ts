export type ProjectKind = 'simulation' | 'realisation'

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
