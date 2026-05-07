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
const UNIVERS_CAT_MAX = 60
const UNIVERS_NAME_MAX = 80
const UNIVERS_DESC_MAX = 300
const UNIVERS_ITEMS_COUNT = 5

// Helpers : trim + null si chaîne vide après trim. La BDD acceptant null,
// on évite les chaînes vides en pré-traitement côté serveur.
const trimToNull = (max: number) =>
  z.string().max(max).transform((s) => {
    const t = s.trim()
    return t.length === 0 ? null : t
  }).nullable()

const trimToString = (max: number) =>
  z.string().max(max).transform((s) => s.trim())

const universItemSchema = z.object({
  cat: trimToString(UNIVERS_CAT_MAX),
  name: trimToString(UNIVERS_NAME_MAX),
  desc: trimToString(UNIVERS_DESC_MAX),
}).strict()

const AVIS_TEXT_MAX = 2000
const AVIS_AUTHOR_MAX = 100
const AVIS_MAX_COUNT = 3

const avisItemSchema = z.object({
  source_id: z.string().max(200).optional(),
  author: trimToString(AVIS_AUTHOR_MAX).pipe(z.string().min(1)),
  author_initial: z.string().max(2).optional(),
  rating: z.number().int().min(1).max(5),
  text: trimToString(AVIS_TEXT_MAX).pipe(z.string().min(1)),
  date: z.string().nullable(),
  edited: z.boolean(),
}).strict()

/**
 * 0 à 3 avis sélectionnés. Null = "pas d'override, utiliser les 3 premiers
 * avis Google disponibles" (comportement V1 par défaut).
 */
const avisItemsSchema = z.array(avisItemSchema).max(AVIS_MAX_COUNT).nullable()

const INFOS_ADRESSE_MAX = 200
const INFOS_TELEPHONE_MAX = 30
const INFOS_EMAIL_MAX = 254

/**
 * Override d'une info pratique :
 *   - undefined / clé absente → utiliser la valeur du prospect
 *   - null                    → masquer cette info
 *   - string                  → override avec cette valeur
 */
const infosOverrideField = (max: number) =>
  z.union([z.string().max(max), z.null()]).optional()

const infosOverridesSchema = z.object({
  adresse: infosOverrideField(INFOS_ADRESSE_MAX),
  telephone: infosOverrideField(INFOS_TELEPHONE_MAX),
  email: infosOverrideField(INFOS_EMAIL_MAX),
}).strict().nullable()

/**
 * Tableau d'items univers : taille fixe 5 (la maquette a 5 cartes).
 * Acceptable de garder un item entièrement vide (cat / name / desc tous vides)
 * — la page publique gérera l'affichage dégradé. On NE supprime PAS les
 * entrées vides côté validation pour rester aligné sur les 5 slots photos.
 */
const universItemsSchema = z.array(universItemSchema).length(UNIVERS_ITEMS_COUNT).nullable()

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

  // Univers (5 cartes)
  univers_items: universItemsSchema.optional(),

  // Avis (0 à 3 sélectionnés parmi prospect.google_reviews + édition possible)
  avis_items: avisItemsSchema.optional(),

  // Infos pratiques (overrides : custom value ou masquage)
  infos_overrides: infosOverridesSchema.optional(),

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
  'univers_items',
  'avis_items',
  'infos_overrides',
  'cta_banner_title', 'cta_banner_text',
] as const

export const UNIVERS_LIMITS = {
  CAT_MAX: UNIVERS_CAT_MAX,
  NAME_MAX: UNIVERS_NAME_MAX,
  DESC_MAX: UNIVERS_DESC_MAX,
  COUNT: UNIVERS_ITEMS_COUNT,
} as const

export const AVIS_LIMITS = {
  TEXT_MAX: AVIS_TEXT_MAX,
  AUTHOR_MAX: AVIS_AUTHOR_MAX,
  MAX_COUNT: AVIS_MAX_COUNT,
} as const

export const INFOS_LIMITS = {
  ADRESSE_MAX: INFOS_ADRESSE_MAX,
  TELEPHONE_MAX: INFOS_TELEPHONE_MAX,
  EMAIL_MAX: INFOS_EMAIL_MAX,
} as const
