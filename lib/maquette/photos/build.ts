import type {
  MaquettePhotoAssignment,
  MaquettePhotoEntry,
  MaquettePhotoSlot,
} from '@/types'
import { MAQUETTE_PHOTO_SLOTS } from '@/types'

/**
 * Source d'IDs injectable pour les tests (déterminisme).
 *
 * En prod : `crypto.randomUUID()` global (disponible Node 20+ ET tous les
 * navigateurs modernes). Pas d'import `node:crypto` car ce module est tiré
 * transitivement dans le bundle client (via `GenerateMaquetteButton` →
 * `lib/maquette/index.ts`) et Webpack ne sait pas résoudre le scheme `node:`
 * côté navigateur.
 */
type IdGen = () => string

const defaultIdGen: IdGen = () => crypto.randomUUID()

export interface PhotoData {
  available_photos: MaquettePhotoEntry[]
  photo_assignments: MaquettePhotoAssignment[]
}

/**
 * Construit le pool initial de photos + l'assignation par défaut au moment
 * où une nouvelle maquette est générée à partir d'un prospect.
 *
 * Mapping initial (arbitraire, l'admin réajustera dans l'éditeur) :
 *   hero       ← photo[0]
 *   histoire   ← photo[1]
 *   univers_1  ← photo[2]
 *   univers_2  ← photo[3]
 *   …
 *   univers_5  ← photo[6]
 *
 * Si moins de 7 photos disponibles, les slots restants reçoivent `photo_id: null`
 * (la page publique affichera un placeholder neutre, cf. composants).
 *
 * Déduplication : si la même `reference` Google apparaît plusieurs fois dans
 * `googlePhotoRefs` (rare, mais possible), on ne la stocke qu'une seule fois
 * dans le pool. Les slots qui auraient pointé vers le doublon reçoivent null.
 */
export function buildInitialPhotoData(
  googlePhotoRefs: readonly string[],
  idGen: IdGen = defaultIdGen
): PhotoData {
  const seenRefs = new Set<string>()
  const available_photos: MaquettePhotoEntry[] = []

  for (const ref of googlePhotoRefs) {
    if (!ref || seenRefs.has(ref)) continue
    seenRefs.add(ref)
    available_photos.push({
      id: idGen(),
      source: 'google',
      reference: ref,
    })
  }

  const photo_assignments: MaquettePhotoAssignment[] = MAQUETTE_PHOTO_SLOTS.map(
    (slot, i) => ({
      slot,
      photo_id: available_photos[i]?.id ?? null,
    })
  )

  return { available_photos, photo_assignments }
}

/**
 * Migration des maquettes existantes (ancien modèle 3 colonnes) vers le
 * nouveau modèle pool + assignations.
 *
 * Stratégie de déduplication : si la même URL/ref apparaît dans plusieurs
 * slots legacy (rare, mais possible), on ne la stocke qu'une seule fois
 * dans le pool. Le PREMIER slot dans l'ordre (hero > histoire > univers_1..5)
 * garde la photo, les suivants se voient désassignés (`photo_id: null`).
 *
 * IMPORTANT : cette règle ne s'applique qu'à la migration. Dans le drag-drop
 * manuel post-migration, l'utilisateur PEUT volontairement assigner la même
 * photo à plusieurs slots (cas d'une photo "signature" affichée 2 fois) —
 * c'est un choix légitime qu'on n'empêchera pas côté éditeur.
 */
export interface LegacyPhotos {
  hero_photo_url: string | null
  histoire_photo_url: string | null
  univers_photos_urls: string[] | null
}

export function migrateLegacyPhotos(
  legacy: LegacyPhotos,
  idGen: IdGen = defaultIdGen
): PhotoData {
  // Ordre canonique = ordre de priorité pour la déduplication.
  const slotRefs: { slot: MaquettePhotoSlot; ref: string | null | undefined }[] = [
    { slot: 'hero',      ref: legacy.hero_photo_url },
    { slot: 'histoire',  ref: legacy.histoire_photo_url },
    { slot: 'univers_1', ref: legacy.univers_photos_urls?.[0] },
    { slot: 'univers_2', ref: legacy.univers_photos_urls?.[1] },
    { slot: 'univers_3', ref: legacy.univers_photos_urls?.[2] },
    { slot: 'univers_4', ref: legacy.univers_photos_urls?.[3] },
    { slot: 'univers_5', ref: legacy.univers_photos_urls?.[4] },
  ]

  const refToId = new Map<string, string>()
  const available_photos: MaquettePhotoEntry[] = []
  const photo_assignments: MaquettePhotoAssignment[] = []

  for (const { slot, ref } of slotRefs) {
    if (!ref) {
      photo_assignments.push({ slot, photo_id: null })
      continue
    }

    const existingId = refToId.get(ref)
    if (existingId) {
      // Doublon legacy → on désassigne ce slot (le premier garde l'attribution).
      photo_assignments.push({ slot, photo_id: null })
      continue
    }

    const id = idGen()
    refToId.set(ref, id)
    available_photos.push({
      id,
      source: detectSourceFromRef(ref),
      reference: ref,
    })
    photo_assignments.push({ slot, photo_id: id })
  }

  return { available_photos, photo_assignments }
}

/**
 * Détection grossière de la source d'une URL legacy :
 * - commence par `places/` → photo Google
 * - sinon → upload (URL Supabase Storage ou autre)
 *
 * Utilisé uniquement à la migration ; les nouvelles photos uploadées sont
 * tagguées explicitement à l'upload.
 */
export function detectSourceFromRef(ref: string): 'google' | 'upload' {
  return ref.startsWith('places/') ? 'google' : 'upload'
}
