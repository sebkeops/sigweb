/**
 * Configuration du filtre famille de la galerie publique `/simulations`.
 *
 * Source de vérité : `lib/crm/constants.ts → CATEGORIE_FAMILIES`. On en
 * dérive ici une liste ordonnée d'options exposées au public, avec leur
 * slug URL (querystring `?famille=...`) — la famille `autre` est volontairement
 * masquée (fallback CRM interne, pas pertinent côté public).
 *
 * Cette config est statique et partagée par le serveur (`page.tsx`) et le
 * client (`FamilyFilter.tsx`). Pas d'import de `lib/crm/constants` ici pour
 * éviter une dépendance bidirectionnelle ; les keys sont alignées et
 * vérifiées par TypeScript via le type ci-dessous.
 */

import { CATEGORIE_FAMILIES } from '@/lib/crm/constants'

/** Clé interne de famille — alignée avec `lib/crm/constants.ts`. */
export type FamilyKey = keyof typeof CATEGORIE_FAMILIES

/** Option exposée au public — `autre` exclue. */
export interface PublicFamilyOption {
  /** Clé interne, alignée avec `Project.category_family`. */
  key: Exclude<FamilyKey, 'autre'>
  /** Slug stable utilisé en querystring (`?famille=...`). */
  slug: string
  /** Label affiché sur la pilule. */
  label: string
}

/**
 * Ordre d'affichage figé par le brief (Phase 4) — calqué sur l'ordre des
 * familles dans `lib/crm/constants.ts`. La famille `autre` est exclue.
 */
export const PUBLIC_FAMILY_OPTIONS: readonly PublicFamilyOption[] = [
  { key: 'bouche',             slug: 'commerces-bouche',    label: 'Commerces de bouche' },
  { key: 'batiment',           slug: 'batiment',            label: 'Bâtiment & artisanat' },
  { key: 'services_personne',  slug: 'services-personne',   label: 'Services à la personne' },
  { key: 'commerces_services', slug: 'commerces-services',  label: 'Commerces & services' },
  { key: 'hebergement',        slug: 'hebergement',         label: 'Hébergement' },
] as const

/**
 * Slug spécial pour l'option "Toutes" — pas de filtre actif. Choisi
 * différent des slugs de famille pour éviter toute collision.
 */
export const ALL_FAMILIES_SLUG = 'toutes'

/** Convertit un slug URL en clé interne, ou null si invalide / "toutes". */
export function familySlugToKey(
  slug: string | null | undefined
): PublicFamilyOption['key'] | null {
  if (!slug || slug === ALL_FAMILIES_SLUG) return null
  return PUBLIC_FAMILY_OPTIONS.find((f) => f.slug === slug)?.key ?? null
}
