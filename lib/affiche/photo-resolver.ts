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
export interface AfficheImageResult {
  buffer: Buffer | null
  /** Raison d'échec à afficher dans le PDF (debug Lot 2 — à retirer plus tard). */
  reason?: string
}

export async function resolveAffichePhotoBuffer(
  prospect: Prospect,
  supabase: SupabaseClient
): Promise<AfficheImageResult> {
  const heroEntry = await findMaquetteHeroEntry(prospect, supabase)
  if (heroEntry) {
    const buffer = await fetchEntryBuffer(heroEntry)
    if (buffer) return { buffer }
    const refExtract = heroEntry.reference.slice(-80)
    console.warn(
      '[affiche/photo-resolver] maquette hero entry trouvée mais fetch buffer KO',
      { prospectId: prospect.id, source: heroEntry.source, ref: heroEntry.reference }
    )
    return {
      buffer: null,
      reason: `Photo maquette trouvée (${heroEntry.source}) mais fetch KO. Ref: …${refExtract}`,
    }
  }

  const ref = prospect.google_photo_refs?.[0]
  if (ref) {
    const buffer = await fetchGooglePhotoBuffer(ref, { maxHeightPx: 800 })
    if (buffer) return { buffer }
    return {
      buffer: null,
      reason: `Fallback Google : fetch KO sur ref ${ref.slice(-40)}`,
    }
  }

  console.warn(
    '[affiche/photo-resolver] aucune image trouvée pour le prospect',
    { prospectId: prospect.id, maquette_id: prospect.maquette_id, nom: prospect.nom_commerce }
  )
  const maquetteHint = prospect.maquette_id ? 'mais ID rempli' : 'et pas de maquette_id'
  return {
    buffer: null,
    reason: `Aucune maquette ni photo Google. Maquette ${maquetteHint}.`,
  }
}

async function findMaquetteHeroEntry(
  prospect: Pick<Prospect, 'id' | 'maquette_id'>,
  supabase: SupabaseClient
): Promise<MaquettePhotoEntry | null> {
  // Stratégie de lookup en 2 passes :
  //   1. Si `prospect.maquette_id` est rempli (cas usuel après création
  //      via createMaquetteFromProspect), on query par PRIMARY KEY direct.
  //   2. Sinon (cas rare : maquette créée hors flow standard, ou
  //      désynchronisation), fallback sur `prospect_id` (clé étrangère).
  // La passe par PK est plus robuste car elle marche même si la maquette
  // a un `prospect_id` NULL ou pointant ailleurs.
  let data: { available_photos: unknown; photo_assignments: unknown } | null = null

  if (prospect.maquette_id) {
    const r = await supabase
      .from('maquettes')
      .select('available_photos, photo_assignments')
      .eq('id', prospect.maquette_id)
      .maybeSingle()
    if (r.error) {
      console.error(
        '[affiche/photo-resolver] fetch maquette by id failed:',
        r.error
      )
    } else {
      data = r.data as typeof data
    }
  }

  if (!data) {
    const r = await supabase
      .from('maquettes')
      .select('available_photos, photo_assignments')
      .eq('prospect_id', prospect.id)
      .maybeSingle()
    if (r.error) {
      console.error(
        '[affiche/photo-resolver] fetch maquette by prospect_id failed:',
        r.error
      )
      return null
    }
    data = r.data as typeof data
  }

  if (!data) {
    console.warn('[affiche/photo-resolver] aucune maquette en BDD', {
      prospectId: prospect.id,
      maquette_id: prospect.maquette_id,
    })
    return null
  }

  const stub = data as Pick<Maquette, 'available_photos' | 'photo_assignments'>

  // 1. Slot 'hero' explicitement assigné en priorité (cas usuel — admin
  //    a choisi la photo Hero dans le PhotoManager).
  const heroPhoto = getMaquettePhoto(stub as Maquette, 'hero')
  if (heroPhoto) return heroPhoto

  // 2. Fallback : première photo du pool. Cas typique pour les prospects
  //    Sirene dont la maquette hérite des photos d'une simulation (PR #29
  //    → #32) : si l'assignation 'hero' héritée pointe sur null ou un
  //    photo_id absent, on prend quand même la 1ère photo disponible
  //    pour ne pas générer une affiche sans image (brief Lot 2 : « la
  //    première image de la maquette »).
  const pool = stub.available_photos
  if (pool && pool.length > 0) return pool[0]

  console.warn('[affiche/photo-resolver] maquette sans photo (pool vide)', {
    prospectId: prospect.id,
  })
  return null
}

async function fetchEntryBuffer(
  entry: MaquettePhotoEntry
): Promise<Buffer | null> {
  // On ne fait PAS confiance au champ `source` : cas observé en prod sur
  // DETAIL VIANDES (PR #37) — une photo Supabase Storage (ref URL absolue)
  // était marquée `source: 'google'` dans la maquette, héritée d'une
  // simulation. fetchGooglePhotoBuffer rejetait la ref via son regex
  // `places/X/photos/Y` → buffer null → pas d'image.
  //
  // Solution : détecte le bon fetcher à partir du FORMAT de la ref,
  // pas du label source. Marche dans les 2 sens (URL absolue, ref Google).
  const ref = entry.reference
  if (/^https?:\/\//i.test(ref)) {
    return fetchUploadPhotoBuffer(ref)
  }
  if (/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(ref)) {
    return fetchGooglePhotoBuffer(ref, { maxHeightPx: 800 })
  }
  console.warn('[affiche/photo-resolver] format de ref inconnu', {
    source: entry.source,
    ref: ref.slice(0, 120),
  })
  return null
}
