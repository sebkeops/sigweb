import { describe, expect, it } from 'vitest'
import type { Prospect, ProspectCategorie } from '@/types'
import { generateInitialMaquette } from './generate'

function makeProspect(overrides: Partial<Prospect> = {}): Prospect {
  return {
    id: 'prospect-uuid-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    nom_commerce: 'Le Loup Gourmand',
    categorie: 'boulangerie',
    adresse: null,
    ville: 'L\'Isle Jourdain',
    code_postal: null,
    distance_km: null,
    telephone: null,
    email: null,
    site_existant_url: null,
    instagram_url: null,
    facebook_url: null,
    score: null,
    canal: 'a_definir',
    statut: 'a_qualifier',
    notes: null,
    date_dernier_contact: null,
    date_relance_prevue: null,
    source: 'manuel',
    google_place_id: null,
    google_rating: null,
    google_reviews_count: null,
    google_business_status: null,
    google_categories: null,
    google_opening_hours: null,
    google_photo_refs: null,
    google_maps_url: null,
    google_primary_type_display: null,
    latitude: null,
    longitude: null,
    last_enriched_at: null,
    score_calcule: null,
    score_proximite: null,
    score_besoin_web: null,
    score_activite: null,
    score_malus: null,
    score_override_manuel: null,
    score_explanations: null,
    score_calcule_at: null,
    score_override_at: null,
    google_reviews: null,
    maquette_id: null,
    maquette_url: null,
    email_unsubscribed: false,
    email_unsubscribed_at: null,
    ...overrides,
  }
}

describe('generateInitialMaquette — sélection du template', () => {
  // Depuis la généralisation Famille 2 → toutes catégories, chaque catégorie
  // CRM dispose de son propre template (1:1 entre `ProspectCategorie` et
  // `MaquetteTemplateVariant`). `UnsupportedCategoryError` reste exporté
  // pour compat mais n'est plus jamais déclenché par cette fonction.
  it.each<ProspectCategorie>([
    'boulangerie', 'boucherie', 'restaurant', 'pizzeria',
    'primeur', 'fromager', 'caviste',
    'coiffeur', 'esthetique', 'kine', 'cabinet',
    'menuisier', 'plombier', 'electricien', 'peintre', 'paysagiste',
    'photographe', 'autre',
  ])('catégorie %s → template_variant identique', (categorie) => {
    const m = generateInitialMaquette(makeProspect({ categorie }))
    expect(m.template_variant).toBe(categorie)
  })

  it('expose des défauts cohérents pour une catégorie non Famille 2', () => {
    const m = generateInitialMaquette(makeProspect({ categorie: 'coiffeur', ville: 'Auch' }))
    // Le preset coiffeur fournit son propre suptitle "Nos créations"
    expect(m.univers_section_suptitle).toBe('NOS PRESTATIONS')
    expect(m.univers_section_title).toContain('*')
    // Le brand tagline est précisé via la table de mappings
    expect(m.valeurs_items.length).toBe(4)
  })
})

describe('generateInitialMaquette — eyebrow et ville', () => {
  it('intègre la ville dans le hero_eyebrow', () => {
    const m = generateInitialMaquette(makeProspect({ ville: 'Pujaudran' }))
    expect(m.hero_eyebrow).toBe('Artisan boulanger · Pujaudran')
  })

  it('omet le séparateur de ville si ville null', () => {
    const m = generateInitialMaquette(makeProspect({ ville: null }))
    expect(m.hero_eyebrow).toBe('Artisan boulanger')
  })

  it('adapte l\'eyebrow par variant', () => {
    expect(generateInitialMaquette(makeProspect({ categorie: 'boucherie', ville: 'Auch' })).hero_eyebrow)
      .toBe('Artisan boucher · Auch')
    expect(generateInitialMaquette(makeProspect({ categorie: 'restaurant', ville: 'Auch' })).hero_eyebrow)
      .toBe('Cuisine de saison · Auch')
    expect(generateInitialMaquette(makeProspect({ categorie: 'pizzeria', ville: 'Auch' })).hero_eyebrow)
      .toBe('Pizzeria au feu de bois · Auch')
  })
})

describe('generateInitialMaquette — photos Google', () => {
  it('affecte photos[0] / [1] / [2..6] aux blocs hero / histoire / univers', () => {
    const refs = [
      'places/A/photos/1', 'places/A/photos/2', 'places/A/photos/3',
      'places/A/photos/4', 'places/A/photos/5', 'places/A/photos/6',
      'places/A/photos/7', 'places/A/photos/8',
    ]
    const m = generateInitialMaquette(makeProspect({ google_photo_refs: refs }))
    expect(m.hero_photo_url).toBe('places/A/photos/1')
    expect(m.histoire_photo_url).toBe('places/A/photos/2')
    expect(m.univers_photos_urls).toEqual([
      'places/A/photos/3', 'places/A/photos/4', 'places/A/photos/5',
      'places/A/photos/6', 'places/A/photos/7',
    ])
  })

  it('null partout quand le prospect n\'a pas de photos', () => {
    const m = generateInitialMaquette(makeProspect({ google_photo_refs: null }))
    expect(m.hero_photo_url).toBeNull()
    expect(m.histoire_photo_url).toBeNull()
    expect(m.univers_photos_urls).toBeNull()
  })

  it('gère un nombre partiel de photos sans planter', () => {
    const m = generateInitialMaquette(makeProspect({
      google_photo_refs: ['places/A/photos/1', 'places/A/photos/2'],
    }))
    expect(m.hero_photo_url).toBe('places/A/photos/1')
    expect(m.histoire_photo_url).toBe('places/A/photos/2')
    expect(m.univers_photos_urls).toBeNull() // pas assez pour les univers
  })

  it('univers_photos_urls = null si exactement 2 photos (pas de surplus)', () => {
    const m = generateInitialMaquette(makeProspect({
      google_photo_refs: ['places/A/photos/1', 'places/A/photos/2'],
    }))
    expect(m.univers_photos_urls).toBeNull()
  })
})

describe('generateInitialMaquette — palette et logo', () => {
  it('palette_mode = "category" et palette overrides null', () => {
    const m = generateInitialMaquette(makeProspect())
    expect(m.palette_mode).toBe('category')
    expect(m.palette_primary).toBeNull()
    expect(m.palette_accent).toBeNull()
  })

  it('logo_url null à la création (uploadé en Session 5)', () => {
    const m = generateInitialMaquette(makeProspect())
    expect(m.logo_url).toBeNull()
  })

  it('logo_initial dérivé du nom du commerce', () => {
    expect(generateInitialMaquette(makeProspect({ nom_commerce: 'Le Loup Gourmand' })).logo_initial).toBe('L')
    expect(generateInitialMaquette(makeProspect({ nom_commerce: 'Maison Sabathé' })).logo_initial).toBe('M')
    expect(generateInitialMaquette(makeProspect({ nom_commerce: 'Aux Délices de Sophie' })).logo_initial).toBe('D')
  })
})

describe('generateInitialMaquette — déterminisme', () => {
  // Les available_photos contiennent des UUIDs random — pour comparer 2
  // sorties on injecte un idGen séquentiel identique aux deux appels.
  function makeIdGen() {
    let i = 0
    return () => `id-${++i}`
  }

  it('même prospect + même idGen → même sortie (deep equal)', () => {
    const p = makeProspect({
      ville: 'Pujaudran',
      categorie: 'boucherie',
      google_photo_refs: ['places/X/photos/1', 'places/X/photos/2', 'places/X/photos/3'],
    })
    const a = generateInitialMaquette(p, makeIdGen())
    const b = generateInitialMaquette(p, makeIdGen())
    expect(a).toEqual(b)
  })

  it('hors photos, le reste de la sortie est déterministe sans idGen', () => {
    const p = makeProspect({ ville: 'Pujaudran', categorie: 'boucherie' })
    const a = generateInitialMaquette(p)
    const b = generateInitialMaquette(p)
    // Les UUIDs des photos sont différents, mais comme le prospect n'a
    // pas de google_photo_refs, le pool est vide → comparaison stricte OK.
    expect(a).toEqual(b)
  })
})

describe('generateInitialMaquette — contenus par défaut', () => {
  it('univers_items et valeurs_items sont les valeurs du template', () => {
    const m = generateInitialMaquette(makeProspect({ categorie: 'boulangerie' }))
    expect(m.univers_items).toHaveLength(5)
    expect(m.valeurs_items).toHaveLength(4)
    expect(m.univers_items[0]).toEqual({
      cat: 'Spécialité maison',
      name: 'Pains au levain',
      desc: 'Tradition, complet, multi-céréales, seigle. Cuits sur sole, pour une croûte épaisse et une mie souple.',
    })
  })

  it('avis_items reste null à la génération initiale', () => {
    const m = generateInitialMaquette(makeProspect())
    expect(m.avis_items).toBeNull()
  })

  it('annee_creation reste null (saisie manuelle dans l\'éditeur)', () => {
    const m = generateInitialMaquette(makeProspect())
    expect(m.annee_creation).toBeNull()
  })

  it('le hero_quote_author est cohérent par variant', () => {
    expect(generateInitialMaquette(makeProspect({ categorie: 'boulangerie' })).hero_quote_author).toBe('— Le boulanger')
    expect(generateInitialMaquette(makeProspect({ categorie: 'boucherie' })).hero_quote_author).toBe('— Le boucher')
    expect(generateInitialMaquette(makeProspect({ categorie: 'restaurant' })).hero_quote_author).toBe('— Le chef')
    expect(generateInitialMaquette(makeProspect({ categorie: 'pizzeria' })).hero_quote_author).toBe('— Le pizzaiolo')
  })
})
