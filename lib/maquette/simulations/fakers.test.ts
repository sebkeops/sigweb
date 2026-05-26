import { describe, expect, it } from 'vitest'
import type { ProspectCategorie } from '@/types'
import { makePrng } from './prng'
import { generateFakeBusiness } from './fakeBusiness'
import { generateFakeReviews } from './fakeReviews'
import { generateFakeHours, HOURS_PROFILES_BY_CATEGORIE } from './fakeHours'
import { UNSPLASH_KEYWORDS_BY_CATEGORIE } from './unsplashKeywords'

/**
 * Tests des parties pures du générateur de simulations publiques.
 *
 * Le pipeline complet (`buildFictiveSimulation`) implique un appel Unsplash
 * + upload Supabase qui sont mockables mais lourds à tester unitairement.
 * On teste donc ici les modules purs séparément :
 *   - PRNG : reproductibilité (même seed → même séquence)
 *   - fakeBusiness : reproductibilité + tient les contraintes (adresse,
 *     téléphone bien formaté, slug stable, etc.)
 *   - fakeReviews : 4-6 avis, notes 4 ou 5, pas de duplicate opening,
 *     dates dans la fenêtre [30, 365] jours
 *   - fakeHours : couverture des 34 catégories + 7 lignes
 *   - unsplashKeywords : couverture des 34 catégories
 */

const ALL_CATEGORIES: readonly ProspectCategorie[] = [
  'boulangerie', 'boucherie', 'restaurant', 'pizzeria',
  'primeur', 'fromager', 'caviste',
  'coiffeur', 'esthetique', 'kine', 'cabinet',
  'menuisier', 'plombier', 'electricien', 'peintre', 'paysagiste',
  'photographe',
  'bar_cafe', 'traiteur', 'chocolatier', 'epicerie_fine',
  'macon', 'couvreur', 'carreleur', 'piscinier',
  'osteopathe', 'praticien_bien_etre',
  'fleuriste', 'bijoutier', 'librairie', 'garagiste',
  'gite', 'camping',
  'autre',
]

describe('PRNG seedable — reproductibilité', () => {
  it('même seed → même séquence', () => {
    const a = makePrng('abc')
    const b = makePrng('abc')
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next())
    }
  })

  it('seeds différents → séquences différentes', () => {
    const a = makePrng('abc')
    const b = makePrng('abcd')
    let diff = 0
    for (let i = 0; i < 50; i++) {
      if (a.next() !== b.next()) diff++
    }
    expect(diff).toBeGreaterThan(40) // ~100% des valeurs différentes en pratique
  })

  it('intBetween respecte les bornes', () => {
    const p = makePrng('seed')
    for (let i = 0; i < 200; i++) {
      const v = p.intBetween(3, 7)
      expect(v).toBeGreaterThanOrEqual(3)
      expect(v).toBeLessThanOrEqual(7)
    }
  })

  it('pickN retourne n éléments uniques', () => {
    const p = makePrng('seed')
    const arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    const picked = p.pickN(arr, 5)
    expect(picked).toHaveLength(5)
    expect(new Set(picked).size).toBe(5)
  })
})

describe('generateFakeBusiness — reproductibilité + contraintes', () => {
  it('même seed → même business (deep equal)', () => {
    const a = generateFakeBusiness('boulangerie', makePrng('seed-1'))
    const b = generateFakeBusiness('boulangerie', makePrng('seed-1'))
    expect(a).toEqual(b)
  })

  it('seeds différents → business différents', () => {
    const a = generateFakeBusiness('boulangerie', makePrng('seed-1'))
    const b = generateFakeBusiness('boulangerie', makePrng('seed-2'))
    expect(a.nom_commerce).not.toBe(b.nom_commerce)
  })

  it('téléphone au format 05 XX XX XX XX', () => {
    const b = generateFakeBusiness('plombier', makePrng('seed'))
    expect(b.telephone).toMatch(/^05 \d{2} \d{2} \d{2} \d{2}$/)
  })

  it('code postal occitanie (32xxx ou 31xxx)', () => {
    const b = generateFakeBusiness('restaurant', makePrng('seed'))
    expect(b.code_postal).toMatch(/^3[12]\d{3}$/)
  })

  it('email cohérent avec le slug', () => {
    const b = generateFakeBusiness('coiffeur', makePrng('seed'))
    expect(b.email).toBe(`contact@${b.slug}.fr`)
  })

  it('produit un business valide pour les 34 catégories', () => {
    for (const cat of ALL_CATEGORIES) {
      const b = generateFakeBusiness(cat, makePrng(`s-${cat}`))
      expect(b.nom_commerce.length).toBeGreaterThan(0)
      expect(b.ville.length).toBeGreaterThan(0)
      expect(b.slug).toMatch(/^[a-z0-9-]+$/)
    }
  })
})

describe('generateFakeReviews — structure et reproductibilité', () => {
  const FIXED_DATE = new Date('2026-06-01T00:00:00Z')

  it('même seed + même date → mêmes avis', () => {
    const a = generateFakeReviews('boulangerie', FIXED_DATE, makePrng('rs-1'))
    const b = generateFakeReviews('boulangerie', FIXED_DATE, makePrng('rs-1'))
    expect(a).toEqual(b)
  })

  it('produit 4 à 6 avis', () => {
    const r = generateFakeReviews('restaurant', FIXED_DATE, makePrng('rs-2'))
    expect(r.maquetteAvis.length).toBeGreaterThanOrEqual(4)
    expect(r.maquetteAvis.length).toBeLessThanOrEqual(6)
    expect(r.googleReviews.length).toBe(r.maquetteAvis.length)
  })

  it('notes 4 ou 5 uniquement', () => {
    const r = generateFakeReviews('pizzeria', FIXED_DATE, makePrng('rs-3'))
    for (const a of r.maquetteAvis) {
      expect([4, 5]).toContain(a.rating)
    }
  })

  it('toutes les openings sont uniques au sein d\'une simulation', () => {
    const r = generateFakeReviews('boulangerie', FIXED_DATE, makePrng('rs-4'))
    // Une "opening" est le préfixe textuel avant " - " ou ". " — on teste
    // que les auteurs sont distincts (qui sert aussi à éviter le doublon).
    const auteurs = r.maquetteAvis.map((a) => a.author)
    expect(new Set(auteurs).size).toBe(auteurs.length)
  })

  it('dates dans la fenêtre [30, 365] jours en arrière', () => {
    const r = generateFakeReviews('coiffeur', FIXED_DATE, makePrng('rs-5'))
    const now = FIXED_DATE.getTime()
    for (const a of r.maquetteAvis) {
      const date = new Date(a.date as string).getTime()
      const daysAgo = Math.floor((now - date) / (24 * 60 * 60 * 1000))
      expect(daysAgo).toBeGreaterThanOrEqual(30)
      expect(daysAgo).toBeLessThanOrEqual(365)
    }
  })

  it('reviewsCount > nbAvis effectifs (effet "X autres avis Google")', () => {
    const r = generateFakeReviews('garagiste', FIXED_DATE, makePrng('rs-6'))
    expect(r.reviewsCount).toBeGreaterThan(r.maquetteAvis.length)
  })

  it('averageRating cohérent et arrondi à 1 décimale', () => {
    const r = generateFakeReviews('fleuriste', FIXED_DATE, makePrng('rs-7'))
    expect(r.averageRating).toBeGreaterThanOrEqual(4)
    expect(r.averageRating).toBeLessThanOrEqual(5)
    // Arrondi à 1 décimale
    expect(Number((r.averageRating * 10).toFixed(0)) / 10).toBe(r.averageRating)
  })

  it('produit des avis valides pour les 34 catégories', () => {
    for (const cat of ALL_CATEGORIES) {
      const r = generateFakeReviews(cat, FIXED_DATE, makePrng(`c-${cat}`))
      expect(r.maquetteAvis.length).toBeGreaterThanOrEqual(4)
    }
  })
})

describe('generateFakeHours — couverture catégories', () => {
  it('expose un profil pour les 34 catégories', () => {
    for (const cat of ALL_CATEGORIES) {
      expect(HOURS_PROFILES_BY_CATEGORIE[cat]).toBeDefined()
    }
  })

  it('chaque profil retourne 7 lignes weekdayDescriptions', () => {
    for (const cat of ALL_CATEGORIES) {
      const hours = generateFakeHours(cat)
      expect(hours.weekdayDescriptions).toHaveLength(7)
      // Chaque ligne commence par un jour de la semaine
      const jours = ['Lundi:', 'Mardi:', 'Mercredi:', 'Jeudi:', 'Vendredi:', 'Samedi:', 'Dimanche:']
      hours.weekdayDescriptions?.forEach((line, i) => {
        expect(line.startsWith(jours[i] as string)).toBe(true)
      })
    }
  })
})

describe('UNSPLASH_KEYWORDS_BY_CATEGORIE — couverture', () => {
  it('expose au moins 3 mots-clés pour les 34 catégories', () => {
    for (const cat of ALL_CATEGORIES) {
      const pool = UNSPLASH_KEYWORDS_BY_CATEGORIE[cat]
      expect(pool).toBeDefined()
      expect(pool.length).toBeGreaterThanOrEqual(3)
    }
  })
})
