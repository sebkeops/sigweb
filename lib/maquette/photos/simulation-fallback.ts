import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProspectCategorie } from '@/types'
import { SimulationPayloadSchema } from '@/lib/maquette/data-schema'
import type { PhotoData } from './build'

/**
 * Récupère les photos d'une simulation publique à réutiliser comme fallback
 * pour un prospect sans photos Google (typiquement un prospect sourcé via
 * Sirene, qui n'a pas de `google_photo_refs`).
 *
 * Logique :
 *   1. Lookup `projects` où `slug = categorie` ET `project_kind='simulation'`
 *      ET `published=true`. Le mapping catégorie → slug de simulation est
 *      direct (1:1) : la simulation publique pour la catégorie « boulangerie »
 *      a le slug « boulangerie ».
 *   2. Si trouvé, parse `simulation_data` et extrait `available_photos` +
 *      `photo_assignments` de la maquette stockée.
 *   3. Si aucun match (catégorie sans simulation publique), retourne null.
 *      Le caller fait alors un fallback « aucune photo » (placeholders).
 *
 * Pourquoi pas de re-mapping de slot ? Les 7 slots de maquette (hero,
 * histoire, univers_1..5) sont identiques entre simulations et maquettes
 * de prospect. On copie tel quel : mêmes images aux mêmes emplacements,
 * conformément à la demande utilisateur.
 *
 * Pourquoi conserver les `photo_id` originaux ? Ils sont uniques par
 * design (UUID). La copie pointe vers les mêmes URLs (`reference`), ce
 * qui est exactement le comportement voulu — on partage les fichiers
 * Supabase Storage des simulations sans les recopier.
 */
export async function getSimulationPhotoFallback(
  categorie: ProspectCategorie,
  supabase: SupabaseClient
): Promise<PhotoData | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('simulation_data')
    .eq('slug', categorie)
    .eq('project_kind', 'simulation')
    .eq('published', true)
    .returns<{ simulation_data: unknown }[]>()
    .maybeSingle()

  if (error) {
    console.warn(
      '[simulation-fallback] lookup error',
      categorie,
      error.message
    )
    return null
  }
  if (!data?.simulation_data) return null

  const parsed = SimulationPayloadSchema.safeParse(data.simulation_data)
  if (!parsed.success) {
    console.warn(
      '[simulation-fallback] simulation_data invalide pour',
      categorie
    )
    return null
  }

  return {
    available_photos: parsed.data.maquette.available_photos,
    photo_assignments: parsed.data.maquette.photo_assignments,
  }
}
