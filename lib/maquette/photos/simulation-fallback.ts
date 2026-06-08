import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProspectCategorie } from '@/types'
import { SimulationPayloadSchema } from '@/lib/maquette/data-schema'
import type { PhotoData } from './build'

/**
 * Récupère les photos d'une simulation à réutiliser comme fallback pour
 * un prospect sans photos Google (typiquement un prospect sourcé via
 * Sirene, qui n'a pas de `google_photo_refs`).
 *
 * Logique :
 *   1. Lookup `projects` où `project_kind='simulation'` ET
 *      `simulation_data->maquette->>template_variant = categorie`.
 *      Filtre par `template_variant` (filtre JSONB Postgres) car les
 *      `slug` des simulations sont des noms commerciaux fictifs
 *      (« la-table-artisan », « pizz-gabriel »). Le `template_variant`
 *      est aligné 1:1 sur `ProspectCategorie` (cf. `categorieToVariant`).
 *   2. **PAS de filtre `published=true`** : on accepte aussi les
 *      simulations non publiées (en admin) dès qu'elles ont des photos
 *      générées. Demande explicite utilisateur — l'admin peut avoir des
 *      simulations en brouillon avec photos prêtes mais pas encore en ligne.
 *   3. Parcourt jusqu'à 10 simulations matchant et retourne la PREMIÈRE
 *      qui a des `available_photos` non vides. Évite de retourner un pool
 *      vide si une simulation existe mais n'a pas encore eu ses photos
 *      générées (cas d'une simulation en cours de création).
 *   4. Si aucune simulation matchante a de photos, retourne null →
 *      placeholders neutres côté composants.
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
    .eq('simulation_data->maquette->>template_variant', categorie)
    .returns<{ simulation_data: unknown }[]>()
    .limit(10)

  if (error) {
    console.warn(
      '[simulation-fallback] lookup error',
      categorie,
      error.message
    )
    return null
  }
  if (!data || data.length === 0) return null

  // Parcourt les candidats et retourne le premier avec des photos.
  // Une simulation peut exister sans photos (brouillon en cours de
  // création) — on ignore et essaie le suivant.
  for (const row of data) {
    if (!row?.simulation_data) continue
    const parsed = SimulationPayloadSchema.safeParse(row.simulation_data)
    if (!parsed.success) continue
    if (parsed.data.maquette.available_photos.length === 0) continue
    return {
      available_photos: parsed.data.maquette.available_photos,
      photo_assignments: parsed.data.maquette.photo_assignments,
    }
  }

  return null
}
