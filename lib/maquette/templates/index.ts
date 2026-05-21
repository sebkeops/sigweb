import type { MaquetteTemplateVariant, ProspectCategorie } from '@/types'
import type { TemplateConfig } from '../types'
import { boulangerie } from './boulangerie'
import { boucherie } from './boucherie'
import { restaurant } from './restaurant'
import { pizzeria } from './pizzeria'
import {
  autre,
  bar_cafe,
  bijoutier,
  cabinet,
  camping,
  carreleur,
  caviste,
  chocolatier,
  coiffeur,
  couvreur,
  electricien,
  epicerie_fine,
  esthetique,
  fleuriste,
  fromager,
  garagiste,
  gite,
  kine,
  librairie,
  macon,
  menuisier,
  osteopathe,
  paysagiste,
  peintre,
  photographe,
  piscinier,
  plombier,
  praticien_bien_etre,
  primeur,
  traiteur,
} from './generic'

/**
 * Dictionnaire `variant → TemplateConfig`.
 *
 * Couvre les 19 catégories `ProspectCategorie`. Les 4 templates historiques
 * (Famille 2 : boulangerie / boucherie / restaurant / pizzeria) sont définis
 * dans des fichiers dédiés et construits à partir de leur preset + neutres
 * historiques pour préserver les valeurs visuelles existantes ; les 14 autres
 * sont dérivés via `buildGeneric` d'un preset + de défauts neutres mutualisés.
 */
export const TEMPLATES: Record<MaquetteTemplateVariant, TemplateConfig> = {
  // V1 — Famille 2
  boulangerie,
  boucherie,
  restaurant,
  pizzeria,
  // V1 — autres
  primeur,
  fromager,
  caviste,
  coiffeur,
  esthetique,
  kine,
  cabinet,
  menuisier,
  plombier,
  electricien,
  peintre,
  paysagiste,
  photographe,
  // V2 — stubs (annexes du brief "Consolidation finale" à intégrer)
  bar_cafe,
  traiteur,
  chocolatier,
  epicerie_fine,
  macon,
  couvreur,
  carreleur,
  piscinier,
  osteopathe,
  praticien_bien_etre,
  fleuriste,
  bijoutier,
  librairie,
  garagiste,
  gite,
  camping,
  // Fallback
  autre,
}

/**
 * Mappe une catégorie CRM vers un template variant.
 *
 * Depuis la généralisation Famille 2 → toutes catégories (session "presets
 * métier"), chaque catégorie a son template (identité 1:1). La signature
 * conserve `| null` pour compat avec les appelants existants qui distinguent
 * encore "catégorie supportée" vs "non supportée" — la valeur ne sera jamais
 * `null` en pratique. Voir aussi `isCategorieSupported()`.
 */
export function categorieToVariant(
  categorie: ProspectCategorie
): MaquetteTemplateVariant | null {
  // 1:1 entre catégorie et variant — la signature retourne `null` pour
  // compat avec l'API V1, mais en pratique on retourne toujours la catégorie
  // elle-même (qui est un variant valide par construction du record TEMPLATES).
  return categorie
}

export function isCategorieSupported(categorie: ProspectCategorie): boolean {
  return categorieToVariant(categorie) !== null
}

export function getTemplate(variant: MaquetteTemplateVariant): TemplateConfig {
  return TEMPLATES[variant]
}
