import { Image, StyleSheet, Text, View } from '@react-pdf/renderer'
import MarkupText from './MarkupText'
import { AFFICHE_COLORS } from './tokens'
import type { AfficheData } from '@/lib/affiche'

const styles = StyleSheet.create({
  hero: {
    height: 240,
    position: 'relative',
    flexShrink: 0,
    overflow: 'hidden',
    backgroundColor: AFFICHE_COLORS.primary,
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  // Dégradé simulé en 2 couches empilées :
  //   - overlayFull   : voile sombre uniforme sur TOUTE l'image (≈ 45%)
  //   - overlayBottom : renforcement sur la moitié basse pour lisibilité
  //                      du titre (cumulé ≈ 70%).
  // Note : on utilise width/height en % plutôt que top/bottom à 0 — sur
  // @react-pdf, le calcul de hauteur via top:0 + bottom:0 dans une vue
  // absolute ne se résout pas toujours et l'overlay devient invisible.
  overlayFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(20, 18, 14, 0.45)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '55%',
    backgroundColor: 'rgba(20, 18, 14, 0.45)',
  },
  // Placeholder utilisé si la photo Google n'est pas disponible
  placeholder: {
    position: 'absolute',
    inset: 0,
    backgroundColor: AFFICHE_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  placeholderText: {
    fontFamily: 'Nunito',
    fontSize: 26,
    fontWeight: 800,
    color: AFFICHE_COLORS.white,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  content: {
    position: 'absolute',
    bottom: 26,
    left: 36,
    right: 36,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: AFFICHE_COLORS.white,
    opacity: 0.95,
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Nunito',
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1.15,
    color: AFFICHE_COLORS.white,
    letterSpacing: -0.3,
  },
  titleItalic: {
    color: AFFICHE_COLORS.accentLight,
    fontWeight: 700,
  },
})

interface Props {
  data: AfficheData
}

export default function HeroSection({ data }: Props) {
  return (
    <View style={styles.hero}>
      {data.hero.photoUrl ? (
        <>
          <Image src={data.hero.photoUrl} style={styles.photo} />
          <View style={styles.overlayFull} />
          <View style={styles.overlayBottom} />
        </>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{data.prospect.nomCommerce}</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.eyebrow}>{data.hero.eyebrow}</Text>
        <MarkupText
          content={data.hero.title}
          style={styles.title}
          italicStyle={styles.titleItalic}
        />
      </View>
    </View>
  )
}
