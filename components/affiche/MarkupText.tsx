import { Text } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { parseMarkers } from './parse-markers'

interface Props {
  content: string
  /** Style appliqué au `<Text>` racine. */
  style?: Style | Style[]
  /** Style des parts en italique (typiquement couleur d'accent). */
  italicStyle?: Style
  /** Style des parts en gras (typiquement couleur ink + fontWeight 700). */
  boldStyle?: Style
}

/**
 * Rendu d'une chaîne contenant des marqueurs `*italique*` et `**gras**`,
 * adapté à @react-pdf/renderer.
 *
 * Les `\n` natifs de la chaîne sont préservés (saut de ligne géré
 * naturellement par le moteur de rendu PDF).
 */
export default function MarkupText({ content, style, italicStyle, boldStyle }: Props) {
  const parts = parseMarkers(content)

  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.italic) {
          return (
            <Text key={i} style={[{ fontStyle: 'italic' }, italicStyle ?? {}]}>
              {part.text}
            </Text>
          )
        }
        if (part.bold) {
          return (
            <Text key={i} style={[{ fontWeight: 700 }, boldStyle ?? {}]}>
              {part.text}
            </Text>
          )
        }
        return <Text key={i}>{part.text}</Text>
      })}
    </Text>
  )
}
