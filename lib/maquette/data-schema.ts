import { z } from 'zod'

/**
 * Schémas Zod de validation au runtime de la structure complète
 * `MaquetteInitialData` + sous-ensemble `Prospect` consommé par le rendu
 * `app/demos/[slug]/components/*`.
 *
 * Pourquoi pas dans `lib/maquette/content-schema.ts` ?
 * `content-schema.ts` valide une **whitelist d'édition** (sous-ensemble
 * éditable par le formulaire admin via server action), avec contraintes
 * métier (longueurs max par champ). Ce fichier-ci valide une **structure
 * de données complète** lue depuis du JSONB en BDD — responsabilités
 * disjointes, on les sépare pour éviter qu'un futur ajout au formulaire
 * d'édition impacte involontairement la validation du JSONB.
 *
 * Cible d'usage principale : valider `projects.simulation_data` à la
 * lecture côté `/simulations/[slug]`. Le JSONB y est structuré comme :
 *
 *   {
 *     maquette: MaquetteInitialData,
 *     prospect: ProspectSubsetForSimulation
 *   }
 *
 * Pourquoi un wrapper `{ maquette, prospect }` et pas juste un
 * MaquetteInitialData ? Les sous-composants partagés avec `/demos/[slug]`
 * (Header, Hero, Histoire, Univers, Avis, Infos, Footer) consomment à la
 * fois un `Maquette` et un `Prospect` (6 champs prospect identifiés :
 * `nom_commerce`, `ville`, `google_rating`, `google_reviews_count`,
 * `google_reviews`, `google_opening_hours`). On stocke donc les deux pour
 * pouvoir alimenter les composants sans toucher leur signature.
 */

// ─── Sous-schémas pour les listes ──────────────────────────────────────

const MaquetteUniversItemSchema = z.object({
  cat: z.string(),
  name: z.string(),
  desc: z.string(),
})

const MaquetteValeurItemSchema = z.object({
  title: z.string(),
  desc: z.string(),
})

const MaquetteAvisItemSchema = z.object({
  source_id: z.string().optional(),
  author: z.string(),
  author_initial: z.string().optional(),
  rating: z.number().min(1).max(5),
  text: z.string(),
  date: z.string().nullable(),
  edited: z.boolean(),
})

const MAQUETTE_PHOTO_SLOTS = [
  'hero',
  'histoire',
  'univers_1',
  'univers_2',
  'univers_3',
  'univers_4',
  'univers_5',
] as const

const MaquettePhotoEntrySchema = z.object({
  id: z.string(),
  source: z.enum(['google', 'upload']),
  reference: z.string(),
  caption: z.string().optional(),
  uploaded_at: z.string().optional(),
})

const MaquettePhotoAssignmentSchema = z.object({
  slot: z.enum(MAQUETTE_PHOTO_SLOTS),
  photo_id: z.string().nullable(),
})

// ─── Schéma principal : MaquetteInitialData ────────────────────────────

/**
 * Valide la sortie complète de `generateInitialMaquette()`.
 *
 * Mirroir exact de l'interface `MaquetteInitialData` (`lib/maquette/types.ts`)
 * — toute évolution du type doit se répercuter ici, sous peine que le
 * parsing du JSONB échoue silencieusement à la lecture (`safeParse` →
 * `null` → page 404).
 *
 * On accepte `template_variant: z.string()` plutôt qu'un enum strict pour
 * tolérer les variants futurs sans bloquer la lecture (la validation
 * stricte est faite en amont par `categorieToVariant`).
 */
export const MaquetteInitialDataSchema = z.object({
  prospect_id: z.string(),
  template_variant: z.string(),

  hero_eyebrow: z.string(),
  hero_title: z.string(),
  hero_lead: z.string(),
  hero_quote: z.string(),
  hero_quote_author: z.string(),
  histoire_title: z.string(),
  histoire_lead: z.string(),
  texte_presentation: z.string(),
  annee_creation: z.number().nullable(),
  univers_section_suptitle: z.string(),
  univers_section_title: z.string(),
  univers_section_intro: z.string(),
  cta_banner_title: z.string(),
  cta_banner_text: z.string(),

  brand_tagline: z.string(),
  nav_histoire_label: z.string(),
  nav_univers_label: z.string(),
  hero_cta_primaire: z.string(),
  histoire_suptitle: z.string(),
  avis_section_titre: z.string(),
  footer_colonne_label: z.string(),

  logo_url: z.null(),
  logo_initial: z.string(),
  palette_mode: z.literal('category'),
  palette_primary: z.null(),
  palette_accent: z.null(),

  // Anciens champs photos (transition — cf. CLEANUP-TODO.md)
  hero_photo_url: z.string().nullable(),
  histoire_photo_url: z.string().nullable(),
  univers_photos_urls: z.array(z.string()).nullable(),

  available_photos: z.array(MaquettePhotoEntrySchema),
  photo_assignments: z.array(MaquettePhotoAssignmentSchema),

  univers_items: z.array(MaquetteUniversItemSchema),
  valeurs_items: z.array(MaquetteValeurItemSchema),
  avis_items: z.array(MaquetteAvisItemSchema).nullable(),
})

// ─── Sous-ensemble Prospect requis par le rendu /demos ─────────────────

/**
 * Format `GoogleOpeningHours` simplifié — on tolère la forme native Google
 * Places sans imposer une validation stricte des `periods[]` (le rendu se
 * contente de `weekdayDescriptions`).
 */
const GoogleOpeningHoursSchema = z.object({
  weekdayDescriptions: z.array(z.string()).optional(),
  periods: z.array(z.unknown()).optional(),
  openNow: z.boolean().optional(),
})

/**
 * Avis Google brut tel que stocké dans `prospects.google_reviews` — utilisé
 * par `Avis.tsx` en fallback si `maquette.avis_items` est null. Pour une
 * simulation publique, on peut soit remplir `maquette.avis_items` (cas
 * principal en Phase 5/6), soit `prospect.google_reviews` (fallback). Les
 * deux chemins sont ouverts.
 */
const GoogleReviewItemSchema = z.object({
  name: z.string(),
  rating: z.number().min(1).max(5),
  text: z.string(),
  author_name: z.string(),
  author_initial: z.string().nullable(),
  publish_time: z.string().nullable(),
})

/**
 * Sous-ensemble strictement minimal de `Prospect` consommé par les
 * sous-composants `app/demos/[slug]/components/*` et par les helpers de
 * rendu transitifs.
 *
 * Audit :
 *   - Direct dans composants  : nom_commerce, ville, google_rating,
 *                                google_reviews_count, google_reviews,
 *                                google_opening_hours
 *   - Via `resolveInfos()`    : adresse, code_postal, telephone, email
 *
 * → 10 champs au total. Tout ajout ici doit aller de pair avec la mise
 * à jour du builder de simulation publique (Phase 5) qui doit fournir
 * la valeur.
 */
export const ProspectSubsetForSimulationSchema = z.object({
  nom_commerce: z.string(),
  ville: z.string().nullable(),
  adresse: z.string().nullable(),
  code_postal: z.string().nullable(),
  telephone: z.string().nullable(),
  email: z.string().nullable(),
  google_rating: z.number().nullable(),
  google_reviews_count: z.number().nullable(),
  google_reviews: z.array(GoogleReviewItemSchema).nullable(),
  google_opening_hours: GoogleOpeningHoursSchema.nullable(),
})

// ─── Payload complet stocké dans projects.simulation_data ──────────────

export const SimulationPayloadSchema = z.object({
  maquette: MaquetteInitialDataSchema,
  prospect: ProspectSubsetForSimulationSchema,
})

export type SimulationPayload = z.infer<typeof SimulationPayloadSchema>
export type ProspectSubsetForSimulation = z.infer<typeof ProspectSubsetForSimulationSchema>
