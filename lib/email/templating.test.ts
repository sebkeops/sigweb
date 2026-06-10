import { describe, expect, it } from 'vitest'
import {
  applyDirigeantPersonalization,
  applyHighlightFallback,
  applyNouveauCommerceIntroSwap,
  toTitleCase,
} from './templating'

describe('applyNouveauCommerceIntroSwap (Lot 2 fix)', () => {
  it('remplace « avec vos vraies photos et vos vrais avis Google » (sans-site)', () => {
    const tpl =
      `<p>J'ai préparé une simulation spécialement pour {{nom_commerce}}, avec vos vraies photos et vos vrais avis Google :</p>`
    const result = applyNouveauCommerceIntroSwap(tpl)
    expect(result).not.toContain('vraies photos')
    expect(result).not.toContain('avis Google')
    expect(result).toContain('pour vous montrer concrètement')
  })

  it('remplace « avec vos photos et vos vrais avis Google » (avec-site)', () => {
    const tpl =
      `<p>J'ai préparé une refonte pour {{nom_commerce}}, avec vos photos et vos vrais avis Google :</p>`
    const result = applyNouveauCommerceIntroSwap(tpl)
    expect(result).not.toContain('photos et vos vrais avis')
    expect(result).not.toContain('avis Google')
    expect(result).toContain('pour vous montrer concrètement')
  })

  it('idempotent : sans modif si pattern absent', () => {
    const tpl = `<p>Bonjour {{nom_commerce}}, voici ma proposition.</p>`
    expect(applyNouveauCommerceIntroSwap(tpl)).toBe(tpl)
  })

  it('fonctionne sur les versions texte (sans HTML)', () => {
    const tpl =
      `J'ai pris le temps de préparer une simulation spécialement pour {{nom_commerce}}, avec vos vraies photos et vos vrais avis Google :`
    const result = applyNouveauCommerceIntroSwap(tpl)
    expect(result).not.toMatch(/vraies photos|avis Google/)
    expect(result).toContain('pour vous montrer')
  })

  it('global : remplace toutes les occurrences (rare mais sait)', () => {
    const tpl =
      `Bonjour {{nom_commerce}}, avec vos vraies photos et vos vrais avis Google : voici un aperçu ; aussi, avec vos vraies photos et vos vrais avis Google : un autre.`
    const result = applyNouveauCommerceIntroSwap(tpl)
    expect(result).not.toMatch(/avis Google/)
    // Les 2 occurrences ont bien été swappées
    expect((result.match(/pour vous montrer concrètement/g) ?? []).length).toBe(2)
  })
})

describe('applyHighlightFallback (régression Lot 2)', () => {
  it('isNouveauCommerce=true utilise wording lancement (sans-site, html)', () => {
    const tpl = `<p>Salut</p><div class="highlight-fact">Avec {{nb_avis}} avis Google et {{rating}}/5...</div><p>Suite</p>`
    const result = applyHighlightFallback(tpl, 'sans-site', 'html', true)
    expect(result).toContain('Vous venez de lancer')
    expect(result).not.toContain('Avec {{nb_avis}}')
    // Pas de mention « site actuel » (qui est dans le fallback avec-site default)
    expect(result).not.toContain('site actuel')
  })

  it('isNouveauCommerce=false utilise le fallback variant-aware (back-compat)', () => {
    const tpl = `<p>Salut</p><div class="highlight-fact">Avec {{nb_avis}} avis Google et {{rating}}/5...</div><p>Suite</p>`
    const result = applyHighlightFallback(tpl, 'avec-site', 'html', false)
    expect(result).toContain('site actuel')
    expect(result).not.toContain('Vous venez de lancer')
  })

  it('isNouveauCommerce=true (texte)', () => {
    const tpl = `Hey\n\nAvec {{nb_avis}} avis Google et {{rating}}/5 vous êtes top.\n\nSuite`
    const result = applyHighlightFallback(tpl, 'sans-site', 'text', true)
    expect(result).toContain('Vous venez de lancer')
    expect(result).not.toContain('Avec {{nb_avis}}')
  })
})

describe('toTitleCase (formatage prénoms/noms Sirene)', () => {
  it('majuscule initiale, reste en minuscule', () => {
    expect(toTitleCase('JEHANNA')).toBe('Jehanna')
  })
  it('gère les composés avec tiret', () => {
    expect(toTitleCase('JEAN-PIERRE')).toBe('Jean-Pierre')
  })
  it('gère plusieurs prénoms espacés', () => {
    expect(toTitleCase('MARIE LOUISE')).toBe('Marie Louise')
  })
  it('idempotent sur du déjà formaté', () => {
    expect(toTitleCase('Jehanna')).toBe('Jehanna')
  })
})

describe('applyDirigeantPersonalization (Lot 2 PR D)', () => {
  it('HTML : remplace <p>Bonjour,</p> par <p>Bonjour {{Prénom}},</p>', () => {
    const tpl = `<p>Bonjour,</p><p>Je m'appelle…</p>`
    const result = applyDirigeantPersonalization(tpl, 'Sébastien', 'html')
    expect(result).toContain('<p>Bonjour Sébastien,</p>')
    expect(result).not.toContain('<p>Bonjour,</p>')
  })

  it('Texte : remplace "Bonjour," en début de ligne par "Bonjour {{Prénom}},"', () => {
    const tpl = `Bonjour,\nJe m'appelle Sébastien…`
    const result = applyDirigeantPersonalization(tpl, 'Marie', 'text')
    expect(result.startsWith('Bonjour Marie,')).toBe(true)
  })

  it('chaîne vide → template inchangé (cas non diffusible)', () => {
    const tpl = `<p>Bonjour,</p>`
    expect(applyDirigeantPersonalization(tpl, '', 'html')).toBe(tpl)
    expect(applyDirigeantPersonalization(tpl, '   ', 'html')).toBe(tpl)
  })

  it('respecte la casse fournie (caller responsable du format)', () => {
    // Contrat : applyDirigeantPersonalization N'altère PAS la casse —
    // c'est au caller de formater via toTitleCase avant d'appeler.
    const tpl = `<p>Bonjour,</p>`
    const result = applyDirigeantPersonalization(tpl, 'Jean-Pierre', 'html')
    expect(result).toContain('Bonjour Jean-Pierre,')
  })

  it('escape HTML les caractères dangereux dans le prénom', () => {
    const tpl = `<p>Bonjour,</p>`
    // Cas pathologique (improbable mais on défend) : pas d'XSS possible.
    const result = applyDirigeantPersonalization(tpl, '<script>', 'html')
    expect(result).not.toContain('<script>')
    expect(result).toContain('&lt;script&gt;')
  })

  it('ne touche pas les autres "Bonjour" du body (pas en début de ligne)', () => {
    const tpl = `<p>Bonjour,</p><p>Je vous redis bonjour, à vous !</p>`
    const result = applyDirigeantPersonalization(tpl, 'Sébastien', 'html')
    expect(result).toContain('<p>Bonjour Sébastien,</p>')
    expect(result).toContain('Je vous redis bonjour')
  })
})
