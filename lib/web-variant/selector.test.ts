import { describe, expect, it } from 'vitest'
import type { Prospect } from '@/types'
import { getProspectWebVariant } from './selector'

function makeProspect(overrides: Partial<Prospect> = {}): Prospect {
  return {
    id: 'x', created_at: '', updated_at: '',
    nom_commerce: 'Test', categorie: 'boulangerie',
    adresse: null, ville: null, code_postal: null, distance_km: null,
    telephone: null, email: null, site_existant_url: null,
    instagram_url: null, facebook_url: null,
    score: null, canal: 'a_definir', statut: 'a_qualifier',
    notes: null, date_dernier_contact: null, date_relance_prevue: null,
    source: 'manuel',
    google_place_id: null, google_rating: null, google_reviews_count: null,
    google_business_status: null, google_categories: null,
    google_opening_hours: null, google_photo_refs: null,
    google_maps_url: null, google_primary_type_display: null,
    latitude: null, longitude: null, last_enriched_at: null,
    score_calcule: null, score_proximite: null, score_besoin_web: null,
    score_activite: null, score_malus: null, score_override_manuel: null,
    score_explanations: null, score_calcule_at: null, score_override_at: null,
    google_reviews: null, maquette_id: null, maquette_url: null,
    email_unsubscribed: false, email_unsubscribed_at: null,
    ...overrides,
  } as Prospect
}

describe('getProspectWebVariant', () => {
  it('score_besoin_web === 4 → sans-site (pas de site OU réseau social)', () => {
    expect(getProspectWebVariant(makeProspect({ score_besoin_web: 4 }))).toBe('sans-site')
  })

  it('score_besoin_web === 3 → avec-site (plateforme générique low-cost)', () => {
    expect(getProspectWebVariant(makeProspect({ score_besoin_web: 3 }))).toBe('avec-site')
  })

  it('score_besoin_web === 2 → avec-site (vrai site)', () => {
    expect(getProspectWebVariant(makeProspect({ score_besoin_web: 2 }))).toBe('avec-site')
  })

  it('score_besoin_web === null + site_existant_url vide → sans-site (fallback prudent)', () => {
    expect(getProspectWebVariant(makeProspect({ score_besoin_web: null, site_existant_url: null }))).toBe('sans-site')
    expect(getProspectWebVariant(makeProspect({ score_besoin_web: null, site_existant_url: '' }))).toBe('sans-site')
    expect(getProspectWebVariant(makeProspect({ score_besoin_web: null, site_existant_url: '   ' }))).toBe('sans-site')
  })

  it('score_besoin_web === null + site_existant_url présent → avec-site', () => {
    expect(getProspectWebVariant(makeProspect({
      score_besoin_web: null,
      site_existant_url: 'https://example.com',
    }))).toBe('avec-site')
  })
})
