// Helpers purs sur les noms d'auteur Google (pas de 'server-only' :
// ces fonctions ne touchent ni au réseau ni au filesystem, et doivent
// rester testables hors environnement Next).

/**
 * Tronque un nom d'auteur Google au format "Prénom + Initiale.".
 *
 * Règles (validées avec Sébastien) :
 *   - "Jean-Luc Martin"        → "Jean-Luc M."   (prénom composé conservé)
 *   - "Sophie Martin-Dupont"   → "Sophie M."     (nom composé tronqué)
 *   - "Sophie Marie Martin"    → "Sophie M."     (initiale du 2e token)
 *   - "Cookie"                 → "Cookie"        (mononyme/pseudo, intact)
 *   - "  Sophie  Martin  "     → "Sophie M."     (espaces multiples normalisés)
 *   - ""                       → ""              (entrée vide → vide)
 *
 * Note : les tirets internes d'un token sont conservés (cf. "Jean-Luc"),
 * seul le **séparateur d'espace** entre tokens est utilisé pour split.
 */
export function formatAuthorName(rawName: string | null | undefined): string {
  if (!rawName) return ''
  const cleaned = rawName.trim().replace(/\s+/g, ' ')
  if (cleaned.length === 0) return ''
  const tokens = cleaned.split(' ')
  if (tokens.length === 1) return tokens[0]
  const first = tokens[0]
  const second = tokens[1]
  const initial = second.charAt(0).toUpperCase()
  if (!initial) return first
  return `${first} ${initial}.`
}

/**
 * Initiale d'auteur (1 lettre majuscule) à utiliser comme avatar dans la
 * maquette. Toujours tirée du **premier token** (= prénom, pas nom de famille).
 * Renvoie null si aucune lettre exploitable n'est trouvée.
 */
export function getAuthorInitial(rawName: string | null | undefined): string | null {
  if (!rawName) return null
  const cleaned = rawName.trim()
  const first = cleaned.split(/\s+/)[0] ?? ''
  const letter = first.normalize('NFD').match(/[A-Za-z]/)?.[0]
  return letter ? letter.toUpperCase() : null
}
