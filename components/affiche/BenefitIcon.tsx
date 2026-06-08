import { Circle, Path, Rect, Svg } from '@react-pdf/renderer'

/**
 * Pictogrammes par bénéfice de l'affiche A4 (Lot 2 design).
 *
 * 4 SVG simples cohérents avec la charte SIGWEB (lignes stroke, pas de
 * fill couleur). Couleur passée en prop pour garder la cohérence avec
 * `AFFICHE_COLORS.primary` (vert sapin).
 *
 * Mapping par index (cf. ordre des bénéfices dans `lib/affiche/content.ts`) :
 *   0 — qualité (étoile)     ← « Un site clair et pro » / « Vos vraies photos » / « Refonte moderne »
 *   1 — temps (horloge)      ← « Mise en ligne en 2 à 4 semaines »
 *   2 — mobile (smartphone)  ← « Optimisé téléphone et facile à gérer »
 *   3 — gratuit (cadeau)     ← « Sans engagement, totalement gratuit à voir »
 *
 * Si un index hors plage est passé, on retombe sur 'quality' (sécurité —
 * on n'a jamais qu'exactement 4 bénéfices en pratique).
 */

type BenefitKind = 'quality' | 'time' | 'mobile' | 'gift'

export function kindForBenefitIndex(index: number): BenefitKind {
  switch (index) {
    case 0: return 'quality'
    case 1: return 'time'
    case 2: return 'mobile'
    case 3: return 'gift'
    default: return 'quality'
  }
}

interface Props {
  index: number
  color: string
  size?: number
}

export default function BenefitIcon({ index, color, size = 13 }: Props) {
  const kind = kindForBenefitIndex(index)
  switch (kind) {
    case 'quality':
      // Étoile pleine — qualité, premier argument fort
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d="M12 2.5L14.5 8.5L21 9.5L16.5 14L17.5 20.5L12 17.5L6.5 20.5L7.5 14L3 9.5L9.5 8.5Z"
            fill={color}
          />
        </Svg>
      )
    case 'time':
      // Horloge — délai 2-4 semaines
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} fill="none" />
          <Path
            d="M12 7V12L15.5 14"
            stroke={color}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      )
    case 'mobile':
      // Smartphone — optimisé téléphone
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect
            x={7}
            y={2.5}
            width={10}
            height={19}
            rx={2}
            stroke={color}
            strokeWidth={2}
            fill="none"
          />
          <Circle cx={12} cy={18.5} r={0.8} fill={color} />
        </Svg>
      )
    case 'gift':
      // Cadeau — sans engagement, gratuit
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect
            x={3}
            y={9}
            width={18}
            height={12}
            rx={1}
            stroke={color}
            strokeWidth={2}
            fill="none"
          />
          <Path
            d="M2 8H22V11H2Z"
            stroke={color}
            strokeWidth={2}
            fill="none"
          />
          <Path d="M12 8V21" stroke={color} strokeWidth={2} />
          <Path
            d="M12 8C12 5.5 9.5 4 8 4.5C6.5 5 7 7 8.5 7.5C9.5 7.8 11 8 12 8Z"
            stroke={color}
            strokeWidth={1.5}
            fill="none"
          />
          <Path
            d="M12 8C12 5.5 14.5 4 16 4.5C17.5 5 17 7 15.5 7.5C14.5 7.8 13 8 12 8Z"
            stroke={color}
            strokeWidth={1.5}
            fill="none"
          />
        </Svg>
      )
  }
}
