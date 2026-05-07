import { StyleSheet, Text, View } from '@react-pdf/renderer'
import MarkupText from './MarkupText'
import { AFFICHE_COLORS } from './tokens'
import type { AfficheData } from '@/lib/affiche'

const styles = StyleSheet.create({
  pitch: {
    paddingHorizontal: 36,
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: AFFICHE_COLORS.cream,
    flexShrink: 0,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: AFFICHE_COLORS.accent,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Nunito',
    fontSize: 21,
    fontWeight: 700,
    lineHeight: 1.25,
    color: AFFICHE_COLORS.ink,
    letterSpacing: -0.2,
    marginBottom: 11,
  },
  titleItalic: {
    color: AFFICHE_COLORS.primary,
    fontWeight: 700,
  },
  text: {
    fontFamily: 'Nunito',
    fontSize: 13.5,
    lineHeight: 1.6,
    color: AFFICHE_COLORS.inkSoft,
    fontWeight: 400,
  },
  textBold: {
    color: AFFICHE_COLORS.ink,
    fontWeight: 700,
  },
})

interface Props {
  data: AfficheData
}

export default function PitchSection({ data }: Props) {
  return (
    <View style={styles.pitch}>
      <Text style={styles.eyebrow}>{data.pitch.eyebrow}</Text>
      <MarkupText
        content={data.pitch.title}
        style={styles.title}
        italicStyle={styles.titleItalic}
      />
      <MarkupText
        content={data.pitch.text}
        style={styles.text}
        boldStyle={styles.textBold}
      />
    </View>
  )
}
