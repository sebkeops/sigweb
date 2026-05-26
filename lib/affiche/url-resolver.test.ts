import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Prospect } from '@/types'
import { resolveQRCodeUrl, shortDisplayUrl } from './url-resolver'

const ORIGINAL_SITE_URL = process.env.SIGWEB_SITE_URL

beforeAll(() => {
  process.env.SIGWEB_SITE_URL = 'https://www.sigweb.fr'
})
afterAll(() => {
  if (ORIGINAL_SITE_URL === undefined) delete process.env.SIGWEB_SITE_URL
  else process.env.SIGWEB_SITE_URL = ORIGINAL_SITE_URL
})

function makeProspect(overrides: Partial<Prospect>): Prospect {
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
    ...overrides,
  } as Prospect
}

describe('resolveQRCodeUrl', () => {
  // Set partagé pour les tests "priorité 2" — mime l'état BDD post-Phase-6
  // (simulations publiques publiées pour les 4 catégories historiques).
  const SIMS = new Set(['boulangerie', 'boucherie', 'pizzeria', 'coiffure'])
  const NO_SIMS = new Set<string>()

  it('priorité 1 — maquette publiée', () => {
    expect(resolveQRCodeUrl(makeProspect({
      maquette_url: 'https://www.sigweb.fr/demos/le-loup-gourmand',
      categorie: 'boulangerie',
    }), SIMS)).toBe('https://www.sigweb.fr/demos/le-loup-gourmand')
  })

  it('priorité 2 — simulation par catégorie (boulangerie existe)', () => {
    expect(resolveQRCodeUrl(makeProspect({
      maquette_url: null,
      categorie: 'boulangerie',
    }), SIMS)).toBe('https://www.sigweb.fr/simulations/boulangerie')
  })

  it('priorité 2 — simulation pizzeria existe', () => {
    expect(resolveQRCodeUrl(makeProspect({ categorie: 'pizzeria' }), SIMS))
      .toBe('https://www.sigweb.fr/simulations/pizzeria')
  })

  it('priorité 2 — simulation boucherie existe', () => {
    expect(resolveQRCodeUrl(makeProspect({ categorie: 'boucherie' }), SIMS))
      .toBe('https://www.sigweb.fr/simulations/boucherie')
  })

  it('priorité 3 — restaurant n\'a pas de simulation → fallback /simulateur', () => {
    expect(resolveQRCodeUrl(makeProspect({ categorie: 'restaurant' }), SIMS))
      .toBe('https://www.sigweb.fr/simulateur')
  })

  it('priorité 3 — autres catégories sans simulation → fallback /simulateur', () => {
    expect(resolveQRCodeUrl(makeProspect({ categorie: 'menuisier' }), SIMS))
      .toBe('https://www.sigweb.fr/simulateur')
    expect(resolveQRCodeUrl(makeProspect({ categorie: 'autre' }), SIMS))
      .toBe('https://www.sigweb.fr/simulateur')
  })

  it('maquette_url prend le pas même si la simulation existe', () => {
    expect(resolveQRCodeUrl(makeProspect({
      maquette_url: 'https://www.sigweb.fr/demos/abc',
      categorie: 'pizzeria',
    }), SIMS)).toBe('https://www.sigweb.fr/demos/abc')
  })

  it('maquette_url chaîne vide → traité comme absent (fallback simulation)', () => {
    expect(resolveQRCodeUrl(makeProspect({
      maquette_url: '   ',
      categorie: 'boulangerie',
    }), SIMS)).toBe('https://www.sigweb.fr/simulations/boulangerie')
  })

  it('Set vide (cas Phase 3 transitoire) → fallback /simulateur même pour boulangerie', () => {
    expect(resolveQRCodeUrl(makeProspect({
      categorie: 'boulangerie',
    }), NO_SIMS)).toBe('https://www.sigweb.fr/simulateur')
  })
})

describe('shortDisplayUrl', () => {
  it('retire le schéma + le www', () => {
    expect(shortDisplayUrl('https://www.sigweb.fr/demos/le-loup-gourmand'))
      .toBe('sigweb.fr/demos/le-loup-gourmand')
    expect(shortDisplayUrl('http://sigweb.fr/simulateur'))
      .toBe('sigweb.fr/simulateur')
  })

  it('retire le slash final', () => {
    expect(shortDisplayUrl('https://sigweb.fr/')).toBe('sigweb.fr')
  })
})
