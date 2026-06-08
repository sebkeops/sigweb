import { StyleSheet, View } from '@react-pdf/renderer'
import BenefitIcon from './BenefitIcon'
import MarkupText from './MarkupText'
import { AFFICHE_COLORS } from './tokens'
import type { AfficheData } from '@/lib/affiche'

const styles = StyleSheet.create({
  // Wrapper externe : conserve les paddings de page (Lot 2 — pas de
  // régression du flux vertical de l'affiche).
  wrapper: {
    paddingHorizontal: 36,
    paddingBottom: 16,
    flexShrink: 0,
  },
  // Encadré dédié bénéfices (Lot 2 design — bloc distinct visuellement).
  box: {
    backgroundColor: AFFICHE_COLORS.benefitsBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AFFICHE_COLORS.benefitsBorder,
    paddingTop: 12,
    paddingBottom: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemCol: {
    width: '50%',
    paddingRight: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    marginRight: 8,
    marginTop: 1,
    width: 14,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontFamily: 'Nunito',
    fontSize: 12,
    lineHeight: 1.4,
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
    <View style={styles.wrapper}>
      <View style={styles.box}>
        {data.benefits.slice(0, 4).map((benefit, i) => (
          <View key={i} style={styles.itemCol}>
            <View style={styles.iconWrapper}>
              <BenefitIcon index={i} color={AFFICHE_COLORS.primary} />
            </View>
            <MarkupText
              content={benefit}
              style={styles.text}
              boldStyle={styles.textBold}
            />
          </View>
        ))}
      </View>
    </View>
  )
}
