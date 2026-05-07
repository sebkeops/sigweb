/**
 * API publique du module `lib/affiche/`.
 *
 * Le module construit la donnée prête à rendre dans le PDF (Phase 3).
 * Tout ce qui touche à `process.env`, à la clé Google Places ou à
 * `qrcode`/`sharp` reste server-side — aucun de ces helpers ne doit être
 * importé depuis un Client Component.
 */

export { buildAfficheData } from './data-builder'
export { getAfficheVariant } from './variant-selector'
export { resolveQRCodeUrl, shortDisplayUrl } from './url-resolver'
export { getCategorieLabel } from './categories'
export { buildContent, formatRating } from './content'
export { generateQRCodeDataUrl } from './qr-code'
export { getSigwebConfig, shortSiteDisplay } from './config'
export type { AfficheData, AfficheVariant, AfficheCategorie } from './types'
export type { ContentInput, ContentResult } from './content'
export type { SigwebConfig } from './config'
