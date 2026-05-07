/**
 * Parser des marqueurs typographiques dans les chaînes éditoriales.
 *
 * Convention :
 *   - `**mot**` → gras (priorité plus haute)
 *   - `*mot*`   → italique
 *   - `\n`      → saut de ligne (laissé tel quel pour <Text> @react-pdf)
 *
 * Le parser est rudimentaire (pas de markdown imbriqué) mais suffisant
 * pour les contenus éditoriaux de l'affiche, qui n'utilisent jamais de
 * combinaison gras+italique sur le même mot.
 *
 * Sortie : array de parts ordonnées, à rendre via `<Text>` imbriqués
 * avec les styles correspondants.
 */

export interface MarkerPart {
  text: string
  bold?: boolean
  italic?: boolean
}

/**
 * Parse les marqueurs **gras** et *italique* dans une string.
 * Les `\n` sont préservés tels quels dans `text`.
 */
export function parseMarkers(input: string | null | undefined): MarkerPart[] {
  if (!input) return []
  const parts: MarkerPart[] = []
  let i = 0
  let buffer = ''

  while (i < input.length) {
    // Match **bold** d'abord (priorité)
    if (input[i] === '*' && input[i + 1] === '*') {
      const end = input.indexOf('**', i + 2)
      if (end > i + 2) {
        if (buffer) parts.push({ text: buffer })
        buffer = ''
        parts.push({ text: input.slice(i + 2, end), bold: true })
        i = end + 2
        continue
      }
    }
    // Puis *italic*
    if (input[i] === '*') {
      const end = input.indexOf('*', i + 1)
      // exclut les paires vides ou whitespace-only
      if (end > i + 1) {
        const inner = input.slice(i + 1, end)
        const trimmed = inner.trim()
        if (trimmed.length > 0 && !inner.includes('*')) {
          if (buffer) parts.push({ text: buffer })
          buffer = ''
          parts.push({ text: inner, italic: true })
          i = end + 1
          continue
        }
      }
    }
    buffer += input[i]
    i++
  }
  if (buffer) parts.push({ text: buffer })
  return parts
}
