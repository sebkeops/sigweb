import { describe, it, expect } from 'vitest'
import type { ProspectCategorie } from '@/types'
import { getTemplate } from '@/lib/maquette/templates'
import { UNSPLASH_KEYWORDS_BY_CATEGORIE } from './unsplashKeywords'

/**
 * Garde-fou de cohérence : le tuple `univers` de chaque catégorie
 * dans `UNSPLASH_KEYWORDS_BY_CATEGORIE` doit avoir exactement la
 * même longueur que les `universItems` du template correspondant.
 *
 * Pourquoi ce test :
 *   - La structure des keywords est positionnelle (univers[0] alimente
 *     le slot Univers_1, etc.).
 *   - Si quelqu'un réorganise les `universItems` d'un preset (ajout,
 *     suppression, réordre) sans mettre à jour les keywords, les images
 *     d'univers se retrouvent silencieusement décalées d'un cran côté
 *     visiteur — l'erreur ne pète ni au build ni au runtime, on ne la
 *     détecte qu'à l'œil sur la simulation rendue.
 *   - Ce test force la cohérence : si la longueur diffère, l'erreur
 *     remonte en local + CI au moment du `npm test`.
 *
 * À étendre si un jour on ajoute une assertion sur les NOMS d'univers
 * eux-mêmes (alignement de l'intention éditoriale + visuelle), mais en
 * V1 la contrainte "même longueur" suffit à attraper les régressions
 * les plus fréquentes.
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

describe('UNSPLASH_KEYWORDS_BY_CATEGORIE — cohérence avec template.universItems', () => {
  it.each(ALL_CATEGORIES)(
    '%s : univers.length === template.universItems.length',
    (categoryId) => {
      const template = getTemplate(categoryId)
      const keywords = UNSPLASH_KEYWORDS_BY_CATEGORIE[categoryId]

      expect(template.universItems).toBeDefined()
      expect(template.universItems.length).toBe(5)
      expect(keywords.univers.length).toBe(template.universItems.length)
    }
  )

  it('couvre exhaustivement les 34 catégories (pas d\'orphelin ni de manquant)', () => {
    // Chaque catégorie a une entrée
    for (const cat of ALL_CATEGORIES) {
      expect(UNSPLASH_KEYWORDS_BY_CATEGORIE[cat]).toBeDefined()
    }
    // Pas de catégorie en trop (le Record est exhaustif sur ProspectCategorie
    // par construction, mais on vérifie la liste de référence aussi)
    expect(Object.keys(UNSPLASH_KEYWORDS_BY_CATEGORIE).sort()).toEqual(
      [...ALL_CATEGORIES].sort()
    )
  })
})
