import { Image, StyleSheet, Text, View } from '@react-pdf/renderer'
import MarkupText from './MarkupText'
import { AFFICHE_COLORS } from './tokens'
import type { AfficheData } from '@/lib/affiche'

const styles = StyleSheet.create({
  cta: {
    marginTop: 'auto', // pousse le bloc en bas (au-dessus du footer)
    backgroundColor: AFFICHE_COLORS.creamWarm,
    paddingHorizontal: 36,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 3,
    borderTopColor: AFFICHE_COLORS.accent,
    borderTopStyle: 'solid',
    flexShrink: 0,
  },
  qrFrame: {
    width: 100,
    height: 100,
    backgroundColor: AFFICHE_COLORS.white,
    borderWidth: 2,
    borderColor: AFFICHE_COLORS.accent,
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 6,
    marginRight: 22,
    flexShrink: 0,
  },
  qrImg: { width: '100%', height: '100%' },
  text: { flex: 1 },
  title: {
    fontFamily: 'Nunito',
    fontSize: 19,
    fontWeight: 800,
    lineHeight: 1.2,
    color: AFFICHE_COLORS.ink,
    marginBottom: 6,
  },
  titleItalic: {
    color: AFFICHE_COLORS.accent,
    fontWeight: 700,
  },
  desc: {
    fontFamily: 'Nunito',
    fontSize: 12,
    lineHeight: 1.5,
    color: AFFICHE_COLORS.inkSoft,
    fontWeight: 500,
    marginBottom: 8,
  },
  url: {
    fontFamily: 'Nunito',
    fontSize: 11,
    color: AFFICHE_COLORS.primary,
    fontWeight: 700,
    letterSpacing: 0.2,
  },
})

interface Props {
  data: AfficheData
}

export default function QRSection({ data }: Props) {
  return (
    <View style={styles.cta}>
      <View style={styles.qrFrame}>
        <Image src={data.cta.qrDataUrl} style={styles.qrImg} />
      </View>
      <View style={styles.text}>
        <MarkupText
          content={data.cta.title}
          style={styles.title}
          italicStyle={styles.titleItalic}
        />
        <Text style={styles.desc}>{data.cta.description}</Text>
        <Text style={styles.url}>{data.cta.urlDisplay}</Text>
      </View>
    </View>
  )
}
