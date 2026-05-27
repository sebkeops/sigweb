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
  // 1. Maquette publiée
  if (prospect.maquette_url && prospect.maquette_url.trim().length > 0) {
    return prospect.maquette_url
  }

  const { siteUrl } = getSigwebConfig()
  const trimmed = siteUrl.replace(/\/+$/, '')

  // 2. Simulation par catégorie si existante
  if (availableSimulationSlugs.has(prospect.categorie)) {
    return `${trimmed}/simulations/${prospect.categorie}`
  }

  // 3. Fallback générique (simulateur interactif)
  return `${trimmed}/simulateur`
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
