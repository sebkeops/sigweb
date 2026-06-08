import type { Prospect } from '@/types'

/**
 * Détermine si un prospect dispose de données de réputation Google
 * (Lot 2 — complément Sirene).
 *
 * Critère du brief :
 *   « Le prospect a une note Google ET/OU des avis ET/OU des photos »
 *
 * Conséquence :
 *   - Réputation établie (au moins UNE des 3) → wording actuel inchangé
 *   - Aucune des 3 → wording « nouveau commerce » (nouveau)
 *
 * Important : on N'utilise PAS le label `source` (`google` / `sirene` /
 * `both`) car un prospect Sirene enrichi Google ensuite DOIT basculer
 * automatiquement vers le wording « réputation établie ». La donnée
 * prime, le label de sourcing est secondaire.
 *
 * Type d'entrée volontairement permissif (`Pick<...>`) pour autoriser
 * l'appel depuis n'importe quel contexte (server action, route handler,
 * affiche, email) sans imposer la signature complète de `Prospect`.
 */
export function hasGoogleReputation(
  prospect: Pick<
    Prospect,
    'google_rating' | 'google_reviews_count' | 'google_photo_refs'
  >
): boolean {
  if (prospect.google_rating != null) return true
  if (prospect.google_reviews_count != null) return true
  if ((prospect.google_photo_refs?.length ?? 0) > 0) return true
  return false
}
