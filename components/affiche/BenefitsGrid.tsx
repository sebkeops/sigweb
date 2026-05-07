import { StyleSheet, Text, View } from '@react-pdf/renderer'
import MarkupText from './MarkupText'
import { AFFICHE_COLORS } from './tokens'
import type { AfficheData } from '@/lib/affiche'

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 36,
    paddingBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  itemCol: {
    width: '50%',
    paddingRight: 11,
    paddingBottom: 9,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  check: {
    fontFamily: 'Nunito',
    color: AFFICHE_COLORS.primary,
    fontWeight: 800,
    fontSize: 16,
    lineHeight: 1,
    marginRight: 10,
    marginTop: 2,
  },
  text: {
    flex: 1,
    fontFamily: 'Nunito',
    fontSize: 12,
    lineHeight: 1.45,
    color: AFFICHE_COLORS.inkSoft,
    fontWeight: 500,
  },
  textBold: {
    color: AFFICHE_COLORS.ink,
    fontWeight: 700,
  },
})

interface Props {
  data: AfficheData
}

export default function BenefitsGrid({ data }: Props) {
  return (
    <View style={styles.grid}>
      {data.benefits.slice(0, 4).map((benefit, i) => (
        <View key={i} style={styles.itemCol}>
          <Text style={styles.check}>✓</Text>
          <MarkupText
            content={benefit}
            style={styles.text}
            boldStyle={styles.textBold}
          />
        </View>
      ))}
    </View>
  )
}
