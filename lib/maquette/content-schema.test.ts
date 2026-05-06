import { describe, expect, it } from 'vitest'
import { updateMaquetteContentSchema } from './content-schema'

describe('updateMaquetteContentSchema — whitelist (sécurité)', () => {
  it('accepte un partial vide', () => {
    expect(updateMaquetteContentSchema.safeParse({}).success).toBe(true)
  })

  it('accepte les 11 champs whitelistés', () => {
    const r = updateMaquetteContentSchema.safeParse({
      hero_eyebrow: 'a',
      hero_title: 'b',
      hero_lead: 'c',
      hero_quote: 'd',
      hero_quote_author: 'e',
      histoire_title: 'f',
      histoire_lead: 'g',
      texte_presentation: 'h',
      annee_creation: 2014,
      cta_banner_title: 'i',
      cta_banner_text: 'j',
    })
    expect(r.success).toBe(true)
  })

  it('REJETTE un champ hors whitelist (slug)', () => {
    const r = updateMaquetteContentSchema.safeParse({ slug: 'pwned' })
    expect(r.success).toBe(false)
  })

  it('REJETTE published / palette / photo_assignments / available_photos', () => {
    for (const field of ['published', 'palette_primary', 'palette_accent', 'palette_mode', 'photo_assignments', 'available_photos', 'logo_url', 'prospect_id']) {
      const r = updateMaquetteContentSchema.safeParse({ [field]: 'whatever' })
      expect(r.success, `field ${field} should be rejected`).toBe(false)
    }
  })

  it('REJETTE un champ inconnu (typo, attaque)', () => {
    const r = updateMaquetteContentSchema.safeParse({ hero_titel: 'typo' })
    expect(r.success).toBe(false)
  })
})

describe('updateMaquetteContentSchema — transformations', () => {
  it('trim et null si vide après trim', () => {
    const r = updateMaquetteContentSchema.safeParse({
      hero_title: '   ',
      hero_eyebrow: '  Boulanger  ',
    })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.hero_title).toBeNull()
    expect(r.data.hero_eyebrow).toBe('Boulanger')
  })

  it('annee_creation accepte int dans la plage', () => {
    const r = updateMaquetteContentSchema.safeParse({ annee_creation: 2014 })
    expect(r.success).toBe(true)
  })

  it('annee_creation rejette hors plage', () => {
    expect(updateMaquetteContentSchema.safeParse({ annee_creation: 1799 }).success).toBe(false)
    expect(updateMaquetteContentSchema.safeParse({ annee_creation: 2101 }).success).toBe(false)
  })

  it('annee_creation rejette les non-int (float)', () => {
    expect(updateMaquetteContentSchema.safeParse({ annee_creation: 2014.5 }).success).toBe(false)
  })

  it('annee_creation accepte null (input vide UI)', () => {
    const r = updateMaquetteContentSchema.safeParse({ annee_creation: null })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.annee_creation).toBeNull()
  })
})

describe('updateMaquetteContentSchema — bornes longueur', () => {
  it('REJETTE un title > 200 caractères', () => {
    const long = 'a'.repeat(201)
    const r = updateMaquetteContentSchema.safeParse({ hero_title: long })
    expect(r.success).toBe(false)
  })

  it('ACCEPTE un title à exactement 200 caractères', () => {
    const exact = 'a'.repeat(200)
    const r = updateMaquetteContentSchema.safeParse({ hero_title: exact })
    expect(r.success).toBe(true)
  })

  it('REJETTE un texte_presentation > 2000 caractères', () => {
    const long = 'a'.repeat(2001)
    const r = updateMaquetteContentSchema.safeParse({ texte_presentation: long })
    expect(r.success).toBe(false)
  })
})
