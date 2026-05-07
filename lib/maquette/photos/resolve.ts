import type {
  Maquette,
  MaquettePhotoAssignment,
  MaquettePhotoEntry,
  MaquettePhotoSlot,
} from '@/types'

/**
 * Résout la photo assignée à un slot d'une maquette.
 *
 * Convention de stockage (cf. `MaquettePhotoEntry.reference`) :
 *   - source 'google' → reference = `places/X/photos/Y` → à servir via le
 *     proxy `/api/demos/photo?ref=...` (la clé Google ne fuit jamais).
 *   - source 'upload' → reference = URL absolue Supabase Storage → pass-through.
 *
 * Le rendu côté composants doit utiliser `resolvePhotoUrl(photo.reference)`
 * (cf. `lib/maquette/render/resolvePhotoUrl.ts`) qui applique le bon
 * routage automatiquement selon le préfixe.
 *
 * Retourne `null` si :
 *   - le slot n'a pas d'assignation (ou photo_id null)
 *   - la photo référencée n'existe plus dans le pool (cas marginal post-migration)
 *
 * Le composant doit traiter `null` comme "afficher placeholder neutre".
 */
export function resolvePhotoForSlot(
  slot: MaquettePhotoSlot,
  available_photos: readonly MaquettePhotoEntry[] | null,
  photo_assignments: readonly MaquettePhotoAssignment[] | null
): MaquettePhotoEntry | null {
  if (!photo_assignments) return null
  const assignment = photo_assignments.find((a) => a.slot === slot)
  if (!assignment || !assignment.photo_id) return null
  if (!available_photos) return null
  return available_photos.find((p) => p.id === assignment.photo_id) ?? null
}

/** Helper de convenience pour résoudre directement depuis une Maquette. */
export function getMaquettePhoto(
  maquette: Maquette,
  slot: MaquettePhotoSlot
): MaquettePhotoEntry | null {
  return resolvePhotoForSlot(slot, maquette.available_photos, maquette.photo_assignments)
}
