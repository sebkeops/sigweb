import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { fr } from 'date-fns/locale/fr'

/**
 * Calcule la chaîne relative ("il y a 2 mois") à partir d'un ISO de date Google.
 *
 * On NE STOCKE PAS la chaîne relative en BDD : elle vieillit mal (un avis
 * créé en 2025 reste figé "il y a 2 mois" en 2026). On la calcule au render.
 *
 * Format type : "il y a 2 mois", "il y a 3 jours", "il y a presque 1 an".
 *
 * Renvoie `null` si l'ISO est invalide ou absent — le composant consommateur
 * peut alors décider de masquer la mention de date.
 */
export function formatRelativeTime(
  iso: string | null | undefined,
  now: Date = new Date()
): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null

  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: fr,
    // `now` non supporté natif par formatDistanceToNow ; on le passe via
    // l'option custom si besoin (sinon utilise Date.now()). Pour les tests
    // déterministes, on appelle directement avec une horloge mockée vitest.
  })
}
