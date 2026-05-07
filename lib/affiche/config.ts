/**
 * Configuration SIGWEB pour le rendu de l'affiche A4.
 *
 * Lecture exclusivement côté server (route handler), donc on accède
 * directement à `process.env.SIGWEB_*` sans préfixe `NEXT_PUBLIC_`.
 *
 * Fallbacks documentés volontairement en dur dans le code pour ne pas
 * crasher en dev si l'admin a oublié de copier les vars dans .env.local.
 * EN PROD, ces variables DOIVENT être renseignées sur Vercel — sinon
 * l'affiche distribuera des coordonnées potentiellement obsolètes.
 */

export interface SigwebConfig {
  contactName: string
  contactPhoneE164: string       // +33651927381 → utilisé pour `tel:` URI
  contactPhoneDisplay: string    // 06 51 92 73 81 → affiché à l'écran
  contactEmail: string
  contactLocation: string        // "Ségoufielle, Gers"
  businessLabel: string          // baseline header
  logoUrl: string                // logo rond blanc dans les bandeaux
  siteUrl: string                // https://www.sigweb.fr
}

const DEFAULTS: SigwebConfig = {
  contactName:        'Sébastien Siguenza',
  contactPhoneE164:   '+33651927381',
  contactPhoneDisplay:'06 51 92 73 81',
  contactEmail:       'contact@sigweb.fr',
  contactLocation:    'Ségoufielle, Gers',
  businessLabel:      'Sites internet pour commerçants et artisans',
  logoUrl:            'https://www.sigweb.fr/images/logo-v2.png',
  siteUrl:            'https://www.sigweb.fr',
}

export function getSigwebConfig(): SigwebConfig {
  return {
    contactName:         process.env.SIGWEB_CONTACT_NAME           ?? DEFAULTS.contactName,
    contactPhoneE164:    process.env.SIGWEB_CONTACT_PHONE           ?? DEFAULTS.contactPhoneE164,
    contactPhoneDisplay: process.env.SIGWEB_CONTACT_PHONE_DISPLAY  ?? DEFAULTS.contactPhoneDisplay,
    contactEmail:        process.env.SIGWEB_CONTACT_EMAIL          ?? DEFAULTS.contactEmail,
    contactLocation:     process.env.SIGWEB_CONTACT_LOCATION       ?? DEFAULTS.contactLocation,
    businessLabel:       process.env.SIGWEB_BUSINESS_LABEL         ?? DEFAULTS.businessLabel,
    logoUrl:             process.env.SIGWEB_LOGO_URL               ?? DEFAULTS.logoUrl,
    siteUrl:             process.env.SIGWEB_SITE_URL               ?? DEFAULTS.siteUrl,
  }
}

/**
 * Représentation textuelle courte du site (sans schéma) pour affichage.
 * "https://www.sigweb.fr" → "sigweb.fr"
 */
export function shortSiteDisplay(siteUrl: string): string {
  return siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '')
}
