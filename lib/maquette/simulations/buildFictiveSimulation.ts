import 'server-only'
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProspectCategorie } from '@/types'
import { generateInitialMaquette } from '@/lib/maquette'
import {
  SimulationPayloadSchema,
  type SimulationPayload,
} from '@/lib/maquette/data-schema'
import { makePrng } from './prng'
import { generateFakeBusiness, type FakeBusiness } from './fakeBusiness'
import { generateFakeReviews } from './fakeReviews'
import { generateFakeHours } from './fakeHours'
import { fetchAndStoreUnsplashPhotos } from './unsplash'

/**
 * Générateur principal de simulations publiques fictives.
 *
 * Pipeline déterministe à seed fixé :
 *   1. PRNG seedé (par défaut : `categoryId` lui-même, pour stabilité par
 *      catégorie sur les régénérations)
 *   2. Business fictif (nom commerce, adresse Occitanie, tel, email, slug)
 *   3. Reviews fictifs (4 à 6 avis, distribution 70% 5★ / 30% 4★)
 *   4. Horaires fictifs (profil par catégorie)
 *   5. Photos Unsplash (7) → Supabase Storage `project-images/simulations/{slug}/`
 *   6. `generateInitialMaquette({...})` avec UUID factice pour prospect_id
 *      et les URLs Supabase comme google_photo_refs
 *   7. Injection des avis fictifs dans `maquette.avis_items` (sinon le
 *      rendu fallback sur `prospect.google_reviews` mais le rendu admin
 *      vise toujours les avis curés via avis_items)
 *   8. Construction du sous-ensemble Prospect (10 champs)
 *   9. Validation Zod du payload final
 *
 * Pas de side effect BDD ici (insertion ligne `projects` : Phase 6, dans
 * la route admin). On retourne juste le payload validé prêt à être stocké
 * dans `projects.simulation_data` (JSONB).
 *
 * Throw si Unsplash échoue ou si la validation Zod échoue.
 */

export interface BuildFictiveSimulationInput {
  categoryId: ProspectCategorie
  /** Client Supabase avec droits d'écriture sur le bucket `project-images`. */
  supabase: SupabaseClient
  options?: {
    /**
     * Seed pour le PRNG — pilote la reproductibilité de tout le contenu
     * (nom commerce, avis, sélection des photos dans le pool Unsplash).
     * Par défaut : `categoryId` (stable au cours du temps pour une même catégorie).
     */
    seed?: string
    /**
     * Région cible — actuellement non utilisé (le pool de communes est
     * figé sur Occitanie), réservé pour évolution future.
     */
    region?: string
  }
}

/**
 * Retour combiné : le `SimulationPayload` à stocker en BDD + des
 * informations annexes utiles à l'appelant (slug à utiliser pour la ligne
 * `projects`, business pour pré-remplir `title`/`business_type`, etc.).
 */
export interface BuildFictiveSimulationResult {
  payload: SimulationPayload
  /** Slug à utiliser pour la ligne `projects.slug`. Dérivé du nom commerce. */
  slug: string
  /** Détails du business fictif — utile pour pré-remplir `projects.title`, etc. */
  business: FakeBusiness
}

export async function buildFictiveSimulation(
  input: BuildFictiveSimulationInput
): Promise<BuildFictiveSimulationResult> {
  const { categoryId, supabase, options = {} } = input
  const seed = options.seed ?? categoryId

  // 1. PRNG seedé — toutes les étapes "fictives" downstream sont
  //    déterministes à seed fixe.
  const prng = makePrng(seed)

  // 2. Business fictif
  const business = generateFakeBusiness(categoryId, prng)

  // 3. Reviews — date courante = "now" passé pour reproductibilité
  //    (les dates des avis sont calculées en offset depuis cette ancre)
  const reviews = generateFakeReviews(categoryId, new Date(), prng)

  // 4. Horaires
  const hours = generateFakeHours(categoryId)

  // 5. Photos Unsplash → Supabase Storage
  const photos = await fetchAndStoreUnsplashPhotos(
    supabase,
    categoryId,
    business.slug,
    prng
  )

  // 6. Génération du contenu maquette via la signature primaire refactorée
  //    en Phase 3 (cf. lib/maquette/generate.ts → GenerateMaquetteInput).
  //    `prospect_id` : UUID factice qui ne référence rien (décision Phase 3,
  //    validée user).
  //    `google_photo_refs` : URLs absolues Supabase Storage — `resolvePhotoUrl`
  //    les passe tel quel (les refs Google sont préfixées `places/`, ici
  //    on a des `https://...`).
  const fakeProspectId = randomUUID()
  const maquette = generateInitialMaquette({
    prospect_id: fakeProspectId,
    categorie: categoryId,
    nom_commerce: business.nom_commerce,
    ville: business.ville,
    google_photo_refs: [photos.heroUrl, ...photos.galleryUrls],
  })

  // 7. Injection des avis fictifs dans `maquette.avis_items`. Cela
  //    correspond au snapshot "avis curés" qu'un admin sélectionnerait
  //    en Session 4 pour une vraie maquette prospect — pour une
  //    simulation publique, on fait la sélection algorithmiquement.
  maquette.avis_items = reviews.maquetteAvis

  // 8. Construction du sous-ensemble Prospect attendu par le rendu
  //    (cf. lib/maquette/data-schema.ts → ProspectSubsetForSimulationSchema)
  const prospect = {
    nom_commerce: business.nom_commerce,
    ville: business.ville,
    adresse: business.adresse,
    code_postal: business.code_postal,
    telephone: business.telephone,
    email: business.email,
    google_rating: reviews.averageRating,
    google_reviews_count: reviews.reviewsCount,
    google_reviews: reviews.googleReviews,
    google_opening_hours: hours,
  }

  // 9. Validation Zod — throw si quoi que ce soit déraille (la fonction
  //    est censée toujours produire un payload valide ; un throw ici
  //    indique un bug ou une dérive de schéma)
  const payload: SimulationPayload = SimulationPayloadSchema.parse({
    maquette,
    prospect,
  })

  return {
    payload,
    slug: business.slug,
    business,
  }
}
