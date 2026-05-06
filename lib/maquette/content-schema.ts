import { z } from 'zod'

/**
 * Whitelist stricte des champs textuels éditables via la server action
 * `updateMaquetteContent`. AUCUN autre champ ne doit être éditable depuis
 * cette voie (slug = section Avancé Session 3.5, palette = 3.5, photos =
 * 3.4 via une server action dédiée, etc.).
 *
 * Si un champ ne figure pas ici, la validation Zod le rejettera silencieusement
 * (`.strict()` n'est pas utilisé pour permettre des partials, mais les valeurs
 * extra sont ignorées par `.parse()` car non déclarées dans le shape).
 */

// Limites raisonnables — empêche les payloads exorbitants côté serveur.
const TITLE_MAX = 200
const LEAD_MAX = 500
const PARAGRAPH_MAX = 2000
const QUOTE_MAX = 500
const SHORT_MAX = 100

// Helpers : trim + null si chaîne vide après trim. La BDD acceptant null,
// on évite les chaînes vides en pré-traitement côté serveur.
const trimToNull = (max: number) =>
  z.string().max(max).transform((s) => {
    const t = s.trim()
    return t.length === 0 ? null : t
  }).nullable()

export const updateMaquetteContentSchema = z.object({
  // Hero
  hero_eyebrow:        trimToNull(SHORT_MAX).optional(),
  hero_title:          trimToNull(TITLE_MAX).optional(),
  hero_lead:           trimToNull(LEAD_MAX).optional(),
  hero_quote:          trimToNull(QUOTE_MAX).optional(),
  hero_quote_author:   trimToNull(SHORT_MAX).optional(),

  // Histoire
  histoire_title:      trimToNull(TITLE_MAX).optional(),
  histoire_lead:       trimToNull(LEAD_MAX).optional(),
  texte_presentation:  trimToNull(PARAGRAPH_MAX).optional(),
  annee_creation: z.union([
    z.number().int().min(1800).max(2100),
    z.null(),
  ]).optional(),

  // CTA banner
  cta_banner_title:    trimToNull(TITLE_MAX).optional(),
  cta_banner_text:     trimToNull(LEAD_MAX).optional(),
}).strict()

export type EditableMaquetteContent = z.infer<typeof updateMaquetteContentSchema>

export type EditableField = keyof EditableMaquetteContent

/**
 * Liste runtime des champs éditables — utile pour les hooks et tests.
 * Doit rester en sync avec les clés du schéma Zod ci-dessus.
 */
export const EDITABLE_FIELDS: readonly EditableField[] = [
  'hero_eyebrow', 'hero_title', 'hero_lead', 'hero_quote', 'hero_quote_author',
  'histoire_title', 'histoire_lead', 'texte_presentation', 'annee_creation',
  'cta_banner_title', 'cta_banner_text',
] as const
