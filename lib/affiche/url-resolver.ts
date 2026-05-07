import type { Prospect } from '@/types'
import { getAllSimulationSlugs } from '@/lib/data/simulations'
import { getSigwebConfig } from './config'

/**
 * Détermine l'URL cible du QR code de l'affiche.
 *
 * Ordre de priorité :
 *   1. Maquette publiée pour ce prospect → URL maquette
 *      (`prospect.maquette_url` est rempli UNIQUEMENT quand publié,
 *      cf. `publishMaquette` / `unpublishMaquette` qui maintiennent
 *      le champ. Pas besoin d'un autre flag.)
 *   2. Simulation générique du métier si elle existe sous
 *      `lib/data/simulations/<categorie>.json`
 *   3. Fallback simulateur interactif `<site>/simulateur`
 *      (notamment utilisé pour `restaurant` qui n'a pas de simulation
 *      dédiée à ce jour, et pour les catégories hors Famille 2)
 */
export function resolveQRCodeUrl(prospect: Prospect): string {
  // 1. Maquette publiée
  if (prospect.maquette_url && prospect.maquette_url.trim().length > 0) {
    return prospect.maquette_url
  }

  const { siteUrl } = getSigwebConfig()
  const trimmed = siteUrl.replace(/\/+$/, '')

  // 2. Simulation par catégorie si existante
  const availableSlugs = new Set(getAllSimulationSlugs())
  if (availableSlugs.has(prospect.categorie)) {
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
