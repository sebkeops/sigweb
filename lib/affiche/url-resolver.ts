import type { Prospect } from '@/types'
import { getSigwebConfig } from './config'

/**
 * Détermine l'URL cible du QR code de l'affiche.
 *
 * Ordre de priorité :
 *   1. Maquette publiée pour ce prospect → URL maquette
 *      (`prospect.maquette_url` est rempli UNIQUEMENT quand publié,
 *      cf. `publishMaquette` / `unpublishMaquette` qui maintiennent
 *      le champ. Pas besoin d'un autre flag.)
 *   2. Simulation publique pour la catégorie du prospect si elle existe
 *      dans `availableSimulationSlugs` (slug = catégorie)
 *   3. Fallback simulateur interactif `<site>/simulateur` (catégories
 *      sans simulation publiée à ce jour)
 *
 * `availableSimulationSlugs` est injecté par l'appelant pour garder cette
 * fonction pure et synchrone — l'appelant (cf. `data-builder.ts`)
 * récupère la liste depuis Supabase (lecture publique des simulations
 * publiées) une fois par génération d'affiche.
 */
export function resolveQRCodeUrl(
  prospect: Prospect,
  availableSimulationSlugs: ReadonlySet<string>
): string {
  // 1. Maquette publiée → on tag `?src=affiche` (CRM v3 Phase 3) pour
  //    que le tracker maquette identifie correctement la source de la
  //    visite quand le prospect scanne le QR de l'affiche A4.
  if (prospect.maquette_url && prospect.maquette_url.trim().length > 0) {
    return withSource(prospect.maquette_url, 'affiche')
  }

  const { siteUrl } = getSigwebConfig()
  const trimmed = siteUrl.replace(/\/+$/, '')

  // 2. Simulation par catégorie si existante.
  //    `?src=carte` pour les futures cartes de visite ou `?src=affiche`
  //    pour les affiches A4 — ici on est dans le contexte affiche.
  if (availableSimulationSlugs.has(prospect.categorie)) {
    return withSource(`${trimmed}/simulations/${prospect.categorie}`, 'affiche')
  }

  // 3. Fallback générique (simulateur interactif). Pas de tracking
  //    Phase 3 sur cette page (Phase 3 cible /demos/[slug]), donc
  //    pas de `?src` à ajouter.
  return `${trimmed}/simulateur`
}

/**
 * Ajoute (ou remplace) le paramètre `?src=<source>` sur une URL. Gère
 * proprement les URLs avec ou sans query string existante, et n'écrase
 * pas un `?src=` déjà présent si la valeur est identique.
 */
function withSource(url: string, source: string): string {
  // Si l'URL contient déjà `src=<source>`, on la renvoie telle quelle.
  const hasSrc = /[?&]src=/.test(url)
  if (hasSrc) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}src=${encodeURIComponent(source)}`
}

/**
 * Représentation textuelle courte de l'URL pour affichage sous le QR
 * (sans schéma + sans www). Préserve le path interne.
 *
 * Exemples :
 *   https://sigweb.fr/demos/le-loup-gourmand → sigweb.fr/demos/le-loup-gourmand
 *   https://www.sigweb.fr/simulateur          → sigweb.fr/simulateur
 */
export function shortDisplayUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '')
}
