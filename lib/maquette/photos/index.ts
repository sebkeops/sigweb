export {
  buildInitialPhotoData,
  migrateLegacyPhotos,
  detectSourceFromRef,
  type LegacyPhotos,
  type PhotoData,
} from './build'

export { backfillGooglePhotos } from './backfill'
export type { BackfillInput, BackfillOutput } from './backfill'

export { resolvePhotoForSlot, getMaquettePhoto } from './resolve'

export {
  photoEntrySchema,
  photoAssignmentSchema,
  photoSlotSchema,
  photoSourceSchema,
  availablePhotosSchema,
  photoAssignmentsSchema,
  assertAssignmentsPointToPool,
} from './schema'

// `processPhotoBuffer` est `server-only` (sharp). NE PAS le re-exporter ici :
// l'index est tiré dans le bundle client (PhotoManager → lib/maquette/photos),
// importer le module sharp casserait le build. À importer directement depuis
// `@/lib/maquette/photos/process` dans les server actions uniquement.
