/**
 * Convertit les marqueurs `*mot*` en `<em>mot</em>` pour le rendu HTML
 * de la maquette, sans risque XSS.
 *
 * Convention :
 *   - les paires `*...*` non vides sont converties (non-greedy)
 *   - tout le reste de la chaîne est échappé (& < > " ')
 *   - les retours à la ligne `\n` sont conservés tels quels (le composant
 *     consommateur peut décider de `white-space: pre-line` ou de `<br />`)
 *
 * Usage :
 *   <p dangerouslySetInnerHTML={{ __html: parseItalicMarkers(text) }} />
 *
 * Ne jamais passer du contenu utilisateur directement à `dangerouslySetInnerHTML`
 * sans passer par cette fonction (ou un autre escapeur côté serveur).
 */

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c])
}

export function parseItalicMarkers(input: string | null | undefined): string {
  if (!input) return ''

  // 1. On échappe TOUT le HTML d'abord. Les * deviennent juste des * (pas
  //    d'entité spéciale), donc le pattern de remplacement reste fiable.
  const escaped = escapeHtml(input)

  // 2. On transforme `*mot ou plusieurs mots*` en `<em>...</em>`.
  //    - non-greedy avec `[^*]+?` pour ne pas chevaucher 2 paires
  //    - rejette les paires vides `**` (le contenu doit avoir ≥ 1 caractère
  //      qui n'est pas une étoile, et pas commencer/finir par un espace —
  //      fenêtre d'usage : encadrer des mots, pas du whitespace).
  return escaped.replace(/\*([^\s*][^*]*?[^\s*]|[^\s*])\*/g, '<em>$1</em>')
}

/**
 * Retourne la chaîne sans les marqueurs `*`, utile pour les `aria-label`,
 * `<title>`, ou tout contexte texte brut.
 */
export function stripItalicMarkers(input: string | null | undefined): string {
  if (!input) return ''
  return input.replace(/\*([^\s*][^*]*?[^\s*]|[^\s*])\*/g, '$1')
}
