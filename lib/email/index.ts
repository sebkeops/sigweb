// API publique du module `lib/email/`.
//
// Tout ce qui touche à process.env (clé ScreenshotOne, clé Resend,
// secret unsubscribe) reste server-side via `'server-only'`. Aucun
// helper de ce module ne doit être importé depuis un Client Component.

export {
  generateMaquettePreview,
  ScreenshotProviderError,
  type MaquetteRef,
  type PreviewResult,
} from './preview-generator'

export {
  renderEmailContent,
  sendProspectEmail,
  EmailEligibilityError,
  type RenderEmailParams,
  type RenderedEmail,
  type SendOptions,
} from './sender'

export {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
} from './unsubscribe-token'
