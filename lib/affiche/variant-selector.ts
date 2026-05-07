import type { Prospect } from '@/types'
import type { AfficheVariant } from './types'

/**
 * Sélectionne la variante de l'affiche selon le critère C2 du scoring v2
 * (besoin web). Cf. `lib/scoring/criteria.ts > computeBesoinWeb`.
 *
 * Mapping :
 *   - score_besoin_web === 4 → 'sans-site'
 *     (pas de site OU compte réseau social seul)
 *   - score_besoin_web === 3 → 'avec-site'
 *     (plateforme générique low-cost type wixsite, eatbu, etc.)
 *   - score_besoin_web === 2 → 'avec-site'
 *     (vrai site existant)
 *   - score_besoin_web === null → 'sans-site'
 *     (cas dégradé : on assume l'absence de site = parti pris prudent)
 *
 * Fallback secondaire si jamais `score_besoin_web` n'est pas renseigné
 * (prospect créé manuellement avant le scoring) : on regarde directement
 * `site_existant_url`. Vide → 'sans-site'.
 */
export function getAfficheVariant(prospect: Prospect): AfficheVariant {
  if (prospect.score_besoin_web == null) {
    const url = (prospect.site_existant_url ?? '').trim()
    return url.length === 0 ? 'sans-site' : 'avec-site'
  }
  return prospect.score_besoin_web >= 4 ? 'sans-site' : 'avec-site'
}
