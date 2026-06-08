import { describe, expect, it } from 'vitest'
import { buildContent, formatRating } from './content'

const baseProspect = {
  nom_commerce: 'Boulangerie Pierre Baux',
  categorie: 'boulangerie' as const,
  ville: 'L\'Isle Jourdain',
  google_rating: 4.8,
  google_reviews_count: 156,
  google_photo_refs: ['places/X/photos/1'] as string[] | null,
}

describe('buildContent — variante sans-site', () => {
  it('cas nominal (avec note + nb avis Google)', () => {
    const r = buildContent({
      variant: 'sans-site',
      prospect: baseProspect,
      qrTargetUrl: 'https://www.sigweb.fr/demos/boulangerie-pierre-baux',
    })

    expect(r.headerEyebrow).toEqual({
      line1: 'Une simulation gratuite',
      line2: 'pour votre boulangerie',
    })
    expect(r.heroEyebrow).toBe('Boulangerie Pierre Baux · L\'Isle Jourdain')
    expect(r.heroTitle).toBe('Et si votre boulangerie\navait *enfin* son site ?')
    expect(r.pitchEyebrow).toBe('Une simulation faite pour vous')
    expect(r.pitchTitle).toContain('156 avis Google')
    expect(r.pitchTitle).toContain('*vraie clientèle*')
    expect(r.pitchText).toContain('**4,8/5**')
    expect(r.pitchText).toContain('boulangerie sur leur téléphone')
    expect(r.benefits).toHaveLength(4)
    expect(r.benefits[0]).toContain('**Vos vraies photos**')
    expect(r.benefits[1]).toContain('**Mise en ligne**')
    expect(r.benefits[2]).toContain('**Adapté au téléphone**')
    expect(r.benefits[3]).toContain('**Sans engagement**')
    expect(r.ctaTitle).toContain('*votre simulation*')
    expect(r.ctaDescription).toContain('Boulangerie Pierre Baux')
    expect(r.ctaUrlDisplay).toBe('sigweb.fr/demos/boulangerie-pierre-baux')
  })

  it('fallback si note OU nb avis manquant', () => {
    const r = buildContent({
      variant: 'sans-site',
      prospect: { ...baseProspect, google_rating: null },
      qrTargetUrl: 'https://www.sigweb.fr/demos/x',
    })
    expect(r.pitchTitle).toBe('Une *vraie clientèle*\nen attente de vous trouver.')
    expect(r.pitchText).not.toContain('/5')
    expect(r.pitchText).toContain('**Vous méritez mieux qu\'une fiche.**')
  })

  it('fallback si nb avis manquant', () => {
    const r = buildContent({
      variant: 'sans-site',
      prospect: { ...baseProspect, google_reviews_count: null },
      qrTargetUrl: 'https://www.sigweb.fr/demos/x',
    })
    expect(r.pitchTitle).toBe('Une *vraie clientèle*\nen attente de vous trouver.')
  })

  it('ville absente → eyebrow sans suffixe ville', () => {
    const r = buildContent({
      variant: 'sans-site',
      prospect: { ...baseProspect, ville: null },
      qrTargetUrl: 'https://www.sigweb.fr/demos/x',
    })
    expect(r.heroEyebrow).toBe('Boulangerie Pierre Baux')
  })
})

describe('buildContent — variante avec-site', () => {
  it('cas nominal (avec note + nb avis Google)', () => {
    const r = buildContent({
      variant: 'avec-site',
      prospect: baseProspect,
      qrTargetUrl: 'https://www.sigweb.fr/demos/boulangerie-pierre-baux',
    })

    expect(r.headerEyebrow).toEqual({
      line1: 'Une nouvelle vitrine',
      line2: 'pour votre boulangerie',
    })
    expect(r.heroTitle).toBe('Votre boulangerie\nmérite *une nouvelle* vitrine.')
    expect(r.pitchEyebrow).toBe('Une simulation modernisée')
    expect(r.pitchTitle).toContain('156 avis, 4,8/5')
    expect(r.pitchTitle).toContain('*vous rend pas justice*')
    expect(r.pitchText).toContain('refonte qui change la donne')
    expect(r.benefits[0]).toContain('**Refonte moderne**')
    expect(r.benefits[2]).toContain('**Optimisé téléphone**')
    expect(r.ctaTitle).toContain('*votre nouvelle vitrine*')
    expect(r.ctaDescription).toContain('refonte spécifique')
  })

  it('fallback si données manquantes (note + nb avis null) — photos Google présentes', () => {
    const r = buildContent({
      variant: 'avec-site',
      prospect: {
        ...baseProspect,
        google_rating: null,
        google_reviews_count: null,
        // ← photos toujours présentes : on garde le wording « réputation établie »
      },
      qrTargetUrl: 'https://www.sigweb.fr/demos/x',
    })
    expect(r.pitchTitle).toBe('Un site qui ne\n*vous rend pas justice*.')
  })
})

describe('buildContent — wording « nouveau commerce » (aucune donnée Google)', () => {
  it('sans note, sans avis, sans photo → wording adapté lancement', () => {
    const r = buildContent({
      variant: 'sans-site',
      prospect: {
        ...baseProspect,
        google_rating: null,
        google_reviews_count: null,
        google_photo_refs: null,
      },
      qrTargetUrl: 'https://www.sigweb.fr/demos/x',
    })
    // Pas de mention « avis » / « note » / « votre site actuel »
    expect(r.pitchText).not.toMatch(/avis|note|site actuel/i)
    expect(r.heroTitle).toContain('visible')
    expect(r.headerEyebrow.line1).toBe('Une idée de site')
    expect(r.ctaTitle).toContain('idée de site')
  })

  it('photos vides + pas de note/avis → wording « nouveau commerce »', () => {
    const r = buildContent({
      variant: 'avec-site',
      prospect: {
        ...baseProspect,
        google_rating: null,
        google_reviews_count: null,
        google_photo_refs: [],
      },
      qrTargetUrl: 'x',
    })
    expect(r.pitchTitle).toContain('vous lancer')
  })

  it('photo Google présente → reste sur wording « réputation établie » (pas de bascule)', () => {
    const r = buildContent({
      variant: 'sans-site',
      prospect: {
        ...baseProspect,
        google_rating: null,
        google_reviews_count: null,
        google_photo_refs: ['places/X/photos/1'],
      },
      qrTargetUrl: 'x',
    })
    // Reste sur le wording existant (fallback variant), pas « nouveau commerce »
    expect(r.headerEyebrow.line1).toBe('Une simulation gratuite')
  })
})

describe('buildContent — labels catégorie humanisés', () => {
  it('boulangerie → "boulangerie"', () => {
    const r = buildContent({
      variant: 'sans-site',
      prospect: { ...baseProspect, categorie: 'boulangerie' },
      qrTargetUrl: 'x',
    })
    expect(r.heroTitle).toContain('votre boulangerie')
  })

  it('restaurant → "restaurant"', () => {
    const r = buildContent({
      variant: 'sans-site',
      prospect: { ...baseProspect, categorie: 'restaurant' },
      qrTargetUrl: 'x',
    })
    expect(r.heroTitle).toContain('votre restaurant')
  })

  it('coiffeur → "salon"', () => {
    const r = buildContent({
      variant: 'sans-site',
      prospect: { ...baseProspect, categorie: 'coiffeur' },
      qrTargetUrl: 'x',
    })
    expect(r.heroTitle).toContain('votre salon')
  })
})

describe('formatRating', () => {
  it('affiche 1 décimale en notation française', () => {
    expect(formatRating(4.8)).toBe('4,8')
    expect(formatRating(5)).toBe('5,0')
    expect(formatRating(4)).toBe('4,0')
    expect(formatRating(3.456)).toBe('3,5')
  })
})
