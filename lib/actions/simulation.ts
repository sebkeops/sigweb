'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { ProspectCategorie } from '@/types'
import { buildFictiveSimulation } from '@/lib/maquette/simulations/buildFictiveSimulation'
import { CATEGORIES_EXPOSED_IN_ADMIN, CATEGORIE_FAMILIES } from '@/lib/crm/constants'
import { InMemoryRateLimiter } from '@/lib/rate-limit/in-memory'

/**
 * Server Action : génère une simulation publique fictive pour une
 * catégorie donnée, persiste la ligne `projects` en brouillon, et
 * renvoie l'id + le slug pour redirection côté UI.
 *
 * Authentification : admin obligatoire (route protégée par auth.getUser).
 * Rate limit : 5 générations / minute par utilisateur — protection
 * contre l'épuisement involontaire du quota Unsplash (50 req/h Demo,
 * et chaque génération consomme 7 req).
 *
 * Le résultat de la génération (~7 photos Unsplash + upload Storage)
 * prend ~15-25s. La ligne est créée avec `published = false` pour
 * permettre à l'admin d'éditer/relire avant publication.
 */

const GenerateSimulationInputSchema = z.object({
  categoryId: z
    .string()
    .refine(
      (v): v is ProspectCategorie =>
        CATEGORIES_EXPOSED_IN_ADMIN.has(v as ProspectCategorie),
      { message: 'Catégorie non exposée' }
    ),
})

export type GenerateSimulationActionState =
  | { success: true; id: string; slug: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Rate-limiter module-scope : partagé entre invocations sur la même
 * instance serverless, repart à zéro à chaque cold-start. Acceptable
 * vu qu'il sert uniquement à attraper les abus opportunistes (cf.
 * `lib/rate-limit/in-memory.ts` pour les limites V1 documentées).
 */
const limiter = new InMemoryRateLimiter({
  max: 5,
  windowMs: 60_000,
})

/**
 * Mapping `ProspectCategorie` → `category_family` à insérer en BDD,
 * dérivé une fois pour toutes au démarrage depuis `CATEGORIE_FAMILIES`
 * (la source unique de vérité côté code, cf. `lib/crm/constants.ts`).
 */
function buildCategoryFamilyMap(): Map<ProspectCategorie, string> {
  const map = new Map<ProspectCategorie, string>()
  for (const [familyKey, family] of Object.entries(CATEGORIE_FAMILIES)) {
    for (const id of family.ids) {
      map.set(id, familyKey)
    }
  }
  return map
}
const CATEGORY_FAMILY_MAP = buildCategoryFamilyMap()

export async function generateFictiveSimulationAction(
  _prev: GenerateSimulationActionState | null,
  formData: FormData
): Promise<GenerateSimulationActionState> {
  // 1. Auth admin
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non autorisé.' }

  // 2. Rate limit (clé par user.id pour ne pas bloquer un autre admin)
  const rl = limiter.hit(`sim:gen:${user.id}`)
  if (!rl.ok) {
    const seconds = Math.ceil((rl.resetAt - Date.now()) / 1000)
    return {
      success: false,
      error: `Trop de générations consécutives. Réessayez dans ${seconds}s.`,
    }
  }

  // 3. Validation input
  const parsed = GenerateSimulationInputSchema.safeParse({
    categoryId: formData.get('categoryId'),
  })
  if (!parsed.success) {
    return {
      success: false,
      error: 'Catégorie invalide.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }
  const categoryId = parsed.data.categoryId

  // 4. Pipeline générateur (7 req Unsplash + upload Storage)
  let result: Awaited<ReturnType<typeof buildFictiveSimulation>>
  try {
    // Pour éviter la collision de slug à la régénération via admin (un
    // même admin peut générer plusieurs fois la même catégorie en
    // brouillon pour comparer), on injecte un seed avec le timestamp.
    result = await buildFictiveSimulation({
      categoryId,
      supabase,
      options: { seed: `${categoryId}-${Date.now()}` },
    })
  } catch (err) {
    console.error('[generateFictiveSimulationAction] build', err)
    return {
      success: false,
      error:
        err instanceof Error
          ? `Génération échouée : ${err.message}`
          : 'Génération échouée.',
    }
  }

  // 5. INSERT ligne projects. Si collision de slug (rarissime vu le
  //    PRNG seedé sur timestamp), on suffixe-numérote.
  const baseSlug = result.slug
  let finalSlug = baseSlug
  let attempt = 0
  let insertedId: string | null = null

  while (attempt < 5) {
    const { data: inserted, error: insertErr } = await supabase
      .from('projects')
      .insert({
        title: result.business.nom_commerce,
        slug: finalSlug,
        business_type: categoryId,
        short_description: result.payload.maquette.brand_tagline,
        content: null,
        cover_image_url: result.payload.maquette.hero_photo_url,
        external_url: null,
        project_kind: 'simulation',
        published: false,
        featured_home: false,
        category_family: CATEGORY_FAMILY_MAP.get(categoryId) ?? null,
        simulation_data: result.payload,
      })
      .select('id')
      .single()

    if (!insertErr && inserted) {
      insertedId = inserted.id as string
      break
    }

    if (insertErr?.code === '23505') {
      // Slug déjà pris → suffixe et retry
      attempt += 1
      finalSlug = `${baseSlug}-${attempt + 1}`
      continue
    }

    console.error('[generateFictiveSimulationAction] insert', insertErr)
    return { success: false, error: 'Erreur lors de la création en BDD.' }
  }

  if (!insertedId) {
    return {
      success: false,
      error: 'Impossible de générer un slug unique après 5 tentatives.',
    }
  }

  // 6. Revalidate les pages publiques + admin (la nouvelle simulation
  //    n'est pas published donc /simulations ne change pas, mais la
  //    liste admin si)
  revalidatePath('/admin/projets')
  revalidatePath('/simulations')

  return { success: true, id: insertedId, slug: finalSlug }
}
