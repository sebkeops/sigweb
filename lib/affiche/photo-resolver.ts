import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getMaquettePhoto } from '@/lib/maquette/photos/resolve'
import type { Maquette, MaquettePhotoEntry, Prospect } from '@/types'
import { fetchGooglePhotoBuffer, fetchUploadPhotoBuffer } from './photo-fetcher'

/**
 * Résout la photo Hero à utiliser sur l'affiche A4 d'un prospect.
 *
 * Stratégie (ordre de priorité) :
 *
 *   1. Photo Hero de la maquette du prospect.
 *      Pourquoi : l'admin a déjà sélectionné soigneusement cette photo
 *      via le PhotoManager de l'éditeur de maquette. La réutiliser garantit
 *      une cohérence visuelle entre l'affiche papier et la page web vers
 *      laquelle pointe le QR code (le commerçant voit la même photo).
 *
 *   2. Première photo Google du prospect.
 *      Cas d'usage : prospect sans maquette, ou maquette dont le slot Hero
 *      n'a pas (encore) d'assignation.
 *
 *   3. `null` → le composant PDF affiche un placeholder dégradé vert sapin.
 *
 * Note : on ne filtre PAS sur `published = true`. Si l'admin a une maquette
 * en cours mais pas encore publiée, on profite quand même de sa sélection.
 * Le QR code de son côté ne pointera vers la maquette que si elle est publiée
 * (cf. `url-resolver.ts`) — c'est cohérent avec l'usage : on peut éditer la
 * Hero, générer une affiche de test, puis publier.
 *
 * Photos uploadées vs Google :
 *   - `source = 'google'`  → ref Places, fetch via Google Places API
 *   - `source = 'upload'`  → URL absolue Supabase Storage, fetch HTTP direct
 */
export async function resolveAffichePhotoBuffer(
  prospect: Prospect,
  supabase: SupabaseClient
): Promise<Buffer | null> {
  const heroEntry = await findMaquetteHeroEntry(prospect.id, supabase)
  if (heroEntry) {
    const buffer = await fetchEntryBuffer(heroEntry)
    if (buffer) return buffer
    // Si fetch échoue (ref invalide, upload supprimé, etc.), on retombe
    // sur le fallback Google plutôt que d'afficher le placeholder direct.
  }

  const ref = prospect.google_photo_refs?.[0]
  if (ref) {
    return fetchGooglePhotoBuffer(ref, { maxHeightPx: 800 })
  }

  return null
}

async function findMaquetteHeroEntry(
  prospectId: string,
  supabase: SupabaseClient
): Promise<MaquettePhotoEntry | null> {
  const { data, error } = await supabase
    .from('maquettes')
    .select('available_photos, photo_assignments')
    .eq('prospect_id', prospectId)
    .maybeSingle()

  if (error) {
    console.error('[affiche/photo-resolver] fetch maquette failed:', error)
    return null
  }
  if (!data) return null

  // On reconstruit un objet partial Maquette avec uniquement les champs lus —
  // c'est tout ce dont `getMaquettePhoto` a besoin.
  const stub = data as Pick<Maquette, 'available_photos' | 'photo_assignments'>
  return getMaquettePhoto(stub as Maquette, 'hero')
}

async function fetchEntryBuffer(
  entry: MaquettePhotoEntry
): Promise<Buffer | null> {
  if (entry.source === 'google') {
    return fetchGooglePhotoBuffer(entry.reference, { maxHeightPx: 800 })
  }
  if (entry.source === 'upload') {
    return fetchUploadPhotoBuffer(entry.reference)
  }
  return null
}
