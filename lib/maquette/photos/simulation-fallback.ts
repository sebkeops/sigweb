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
 *   1. Lookup `projects` où `simulation_data->maquette->>template_variant
 *      = categorie` ET `project_kind='simulation'` ET `published=true`.
 *      On filtre sur le `template_variant` car les `slug` des simulations
 *      sont des noms commerciaux fictifs (« la-table-artisan », « pizz-gabriel »),
 *      pas des noms de catégories. Le `template_variant` est aligné 1:1
 *      sur `ProspectCategorie` (cf. `categorieToVariant`).
 *   2. Si plusieurs simulations matchent (plusieurs simulations par
 *      catégorie sont fréquentes), on prend la première — leurs photos
 *      sont toutes générées sur les mêmes pools Unsplash, donc équivalentes.
 *   3. Parse `simulation_data` et extrait `available_photos` +
 *      `photo_assignments` de la maquette stockée.
 *   4. Si aucun match (catégorie sans simulation publique), retourne null.
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
    .eq('project_kind', 'simulation')
    .eq('published', true)
    .eq('simulation_data->maquette->>template_variant', categorie)
    .returns<{ simulation_data: unknown }[]>()
    .limit(1)

  if (error) {
    console.warn(
      '[simulation-fallback] lookup error',
      categorie,
      error.message
    )
    return null
  }
  if (!data || data.length === 0 || !data[0]?.simulation_data) return null

  const parsed = SimulationPayloadSchema.safeParse(data[0].simulation_data)
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
