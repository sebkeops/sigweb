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
