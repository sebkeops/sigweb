import type { Prospect, WebVariant } from '@/types'

/**
 * Sélectionne la variante de communication ('sans-site' / 'avec-site')
 * pour un prospect, selon le critère C2 du scoring v2 (besoin web).
 * Cf. `lib/scoring/criteria.ts > computeBesoinWeb`.
 *
 * Cette fonction est partagée entre :
 *   - le générateur d'affiche A4 (`lib/affiche/`) — choisit le pitch terrain
 *   - le système d'envoi d'emails (`lib/email/`)   — choisit le template
 *
 * Mapping :
 *   - score_besoin_web === 4 → 'sans-site'
 *     (pas de site OU compte réseau social seul)
 *   - score_besoin_web === 3 → 'avec-site'
 *     (plateforme générique low-cost type wixsite, eatbu, etc.)
 *   - score_besoin_web === 2 → 'avec-site'
 *     (vrai site existant)
 *   - score_besoin_web === null → fallback sur `site_existant_url` :
 *     vide → 'sans-site' (parti pris prudent), sinon 'avec-site'.
 *
 * Le fallback secondaire couvre les prospects créés à la main avant
 * que le scoring v2 ne soit calculé.
 */
export function getProspectWebVariant(prospect: Prospect): WebVariant {
  if (prospect.score_besoin_web == null) {
    const url = (prospect.site_existant_url ?? '').trim()
    return url.length === 0 ? 'sans-site' : 'avec-site'
  }
  return prospect.score_besoin_web >= 4 ? 'sans-site' : 'avec-site'
}
