// Public API du module maquette.
// Le rendu HTML/CSS de la page publique vit dans app/demos/[slug]/ (Session 2).

export {
  generateInitialMaquette,
  generateInitialMaquetteFromProspect,
  UnsupportedCategoryError,
} from './generate'
export type { GenerateMaquetteInput } from './generate'
export { generateSlugBase, buildSuffixedSlug } from './slug'
export { getLogoInitial } from './initials'
export {
  TEMPLATES,
  categorieToVariant,
  isCategorieSupported,
  getTemplate,
} from './templates'
export type {
  TemplateConfig,
  TemplateDefaults,
  TemplatePalette,
  MaquetteInitialData,
} from './types'
