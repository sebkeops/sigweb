import type { Maquette, Prospect } from '@/types'

export interface HeroMetaItem {
  value: string
  label: string
}

export interface HeroMetaResult {
  /** Si false, ne rendre AUCUN bandeau hero-meta (cf. règle de masquage groupé). */
  show: boolean
  items: HeroMetaItem[]
}

/**
 * Construit le bandeau "hero-meta" du hero (3 stats : depuis YYYY, note Google,
 * nb avis Google).
 *
 * Règle de masquage groupé (validée avec Sébastien) :
 *
 *   - Si la note Google est absente OU le nombre d'avis < 5 → on masque
 *     `depuis` ET `note` ET `avis` ensemble : un bandeau avec 1 seule stat
 *     orpheline ferait amateur.
 *   - Si en plus `annee_creation` est absente → on masque le bandeau entier
 *     (pas de bandeau avec une seule stat ou aucune).
 *
 * Source des stats :
 *   - `depuis`  ← `maquette.annee_creation` (saisie manuelle dans l'éditeur)
 *   - `note`    ← `prospect.google_rating` (lu dynamiquement, pas snapshot)
 *   - `avis`    ← `prospect.google_reviews_count`
 */
export function buildHeroMeta(maquette: Maquette, prospect: Prospect): HeroMetaResult {
  const annee = maquette.annee_creation
  const rating = prospect.google_rating
  const reviewsCount = prospect.google_reviews_count

  // Masque les stats Google ensemble (pas de bandeau avec une stat orpheline)
  const googleStatsValid = rating != null && reviewsCount != null && reviewsCount >= 5

  if (!googleStatsValid) {
    if (annee == null) {
      // Aucune stat exploitable : pas de bandeau du tout.
      return { show: false, items: [] }
    }
    // Annee seule : règle stricte → on n'affiche pas un bandeau orphelin.
    return { show: false, items: [] }
  }

  // À ce stade, googleStatsValid === true. Si annee est absente, on garde
  // les 2 stats Google (cohérentes ensemble) sans le `depuis`.
  const items: HeroMetaItem[] = []

  if (annee != null) {
    items.push({ value: String(annee), label: 'depuis' })
  }
  items.push({ value: `${rating!.toFixed(1)} ★`, label: 'avis Google' })
  items.push({ value: String(reviewsCount!), label: 'avis clients' })

  return { show: true, items }
}
