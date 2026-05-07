import type { MaquetteTemplateVariant, ProspectCategorie } from '@/types'
import type { TemplateConfig } from '../types'
import { boulangerie } from './boulangerie'
import { boucherie } from './boucherie'
import { restaurant } from './restaurant'
import { pizzeria } from './pizzeria'

export const TEMPLATES: Record<MaquetteTemplateVariant, TemplateConfig> = {
  boulangerie,
  boucherie,
  restaurant,
  pizzeria,
}

/**
 * Mappe une catégorie CRM vers un template variant.
 *
 * Renvoie `null` pour toute catégorie hors scope V1, ce qui doit
 * déclencher côté UI un message "Génération non disponible pour
 * cette catégorie pour le moment".
 *
 * V1 — uniquement Famille 2 (commerces de bouche stricts) :
 *   boulangerie, boucherie, restaurant, pizzeria.
 *
 * Volontairement exclus pour cette session :
 *   primeur, fromager, caviste — un template adapté sera créé plus tard.
 *   coiffeur / esthetique / kine / cabinet / artisans — Famille 3+, hors scope.
 */
export function categorieToVariant(
  categorie: ProspectCategorie
): MaquetteTemplateVariant | null {
  switch (categorie) {
    case 'boulangerie':
      return 'boulangerie'
    case 'boucherie':
      return 'boucherie'
    case 'restaurant':
      return 'restaurant'
    case 'pizzeria':
      return 'pizzeria'
    default:
      return null
  }
}

export function isCategorieSupported(categorie: ProspectCategorie): boolean {
  return categorieToVariant(categorie) !== null
}

export function getTemplate(variant: MaquetteTemplateVariant): TemplateConfig {
  return TEMPLATES[variant]
}
