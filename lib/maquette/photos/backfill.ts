import type { MaquettePhotoAssignment, MaquettePhotoEntry } from '@/types'

/**
 * Backfill intelligent des photos Google sur une maquette existante.
 *
 * Préservations garanties (cf. brief 3.6 — principe directeur "ne jamais
 * casser une maquette existante") :
 *
 *   1. Les uploads (`source: 'upload'`) ne sont JAMAIS touchés.
 *   2. Les photos Google actuellement assignées à un slot sont préservées,
 *      même si Google ne les renvoie plus dans la nouvelle réponse.
 *   3. Les photos Google non assignées qui ne sont plus renvoyées par
 *      Google sont retirées du pool.
 *   4. Les nouvelles photos Google sont ajoutées au pool (et restent
 *      non assignées — l'admin les drag-droppera dans l'éditeur).
 *   5. Si une assignation pointait vers une photo désormais absente du pool
 *      (ne devrait pas arriver vu 2., mais sécurité), elle est désassignée.
 */

export interface BackfillInput {
  currentPool: readonly MaquettePhotoEntry[]
  currentAssignments: readonly MaquettePhotoAssignment[]
  freshGoogleRefs: readonly string[]
}

export interface BackfillOutput {
  available_photos: MaquettePhotoEntry[]
  photo_assignments: MaquettePhotoAssignment[]
  /** Compteurs pour les stats côté UI. */
  stats: {
    photos_added: number
    photos_removed: number
  }
}

// `crypto.randomUUID()` global (Node 20+ et navigateurs modernes) — évite
// d'importer `node:crypto` qui casse le bundle client. Cf. build.ts.
type IdGen = () => string
const defaultIdGen: IdGen = () => crypto.randomUUID()

export function backfillGooglePhotos(
  input: BackfillInput,
  idGen: IdGen = defaultIdGen
): BackfillOutput {
  const { currentPool, currentAssignments, freshGoogleRefs } = input

  const currentUploads = currentPool.filter((p) => p.source === 'upload')
  const currentGoogle = currentPool.filter((p) => p.source === 'google')

  const assignedPhotoIds = new Set(
    currentAssignments
      .filter((a) => a.photo_id !== null)
      .map((a) => a.photo_id as string)
  )

  const currentGoogleRefs = new Set(currentGoogle.map((p) => p.reference))
  const freshRefSet = new Set(freshGoogleRefs)

  // Photos Google à GARDER : présentes côté Google fraîches OU encore assignées.
  const googleToKeep = currentGoogle.filter(
    (p) => freshRefSet.has(p.reference) || assignedPhotoIds.has(p.id)
  )

  // Photos Google à AJOUTER : nouvelles refs côté Google, pas encore dans le pool.
  const googleToAdd: MaquettePhotoEntry[] = []
  for (const ref of freshGoogleRefs) {
    if (currentGoogleRefs.has(ref)) continue
    googleToAdd.push({
      id: idGen(),
      source: 'google',
      reference: ref,
    })
  }

  const removed = currentGoogle.length - googleToKeep.length

  // Reconstruction du pool : uploads d'abord (jamais touchés), puis Google.
  const newPool: MaquettePhotoEntry[] = [
    ...currentUploads,
    ...googleToKeep,
    ...googleToAdd,
  ]

  // Sécurité : assignation pointant vers une photo absente → désassigner.
  const newPoolIds = new Set(newPool.map((p) => p.id))
  const newAssignments: MaquettePhotoAssignment[] = currentAssignments.map((a) => {
    if (a.photo_id !== null && !newPoolIds.has(a.photo_id)) {
      return { slot: a.slot, photo_id: null }
    }
    return { slot: a.slot, photo_id: a.photo_id }
  })

  return {
    available_photos: newPool,
    photo_assignments: newAssignments,
    stats: {
      photos_added: googleToAdd.length,
      photos_removed: removed,
    },
  }
}
