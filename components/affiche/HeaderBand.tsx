import { Image, StyleSheet, Text, View } from '@react-pdf/renderer'
import { AFFICHE_COLORS } from './tokens'
import type { AfficheData } from '@/lib/affiche'

const styles = StyleSheet.create({
  band: {
    backgroundColor: AFFICHE_COLORS.primary,
    color: AFFICHE_COLORS.white,
    paddingHorizontal: 32,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 42,
    height: 42,
    backgroundColor: AFFICHE_COLORS.white,
    borderRadius: 21,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoImg: { width: '100%', height: '100%', objectFit: 'contain' },
  brandText: { color: AFFICHE_COLORS.white },
  brandName: {
    fontFamily: 'Nunito',
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: 0.9,
    lineHeight: 1.1,
  },
  brandTag: {
    fontSize: 9,
    fontWeight: 500,
    opacity: 0.85,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: AFFICHE_COLORS.white,
    opacity: 0.95,
    textAlign: 'right',
    lineHeight: 1.4,
  },
})

interface Props {
  data: AfficheData
}

export default function HeaderBand({ data }: Props) {
  return (
    <View style={styles.band}>
      <View style={styles.brand}>
        <View style={styles.logoCircle}>
          <Image src={data.footer.logoUrl} style={styles.logoImg} />
        </View>
        <View style={styles.brandText}>
          <Text style={styles.brandName}>SIGWEB</Text>
          <Text style={styles.brandTag}>Sites internet pour commerçants et artisans</Text>
        </View>
      </View>

      <View>
        <Text style={styles.eyebrow}>{data.headerEyebrow.line1}</Text>
        <Text style={styles.eyebrow}>{data.headerEyebrow.line2}</Text>
      </View>
    </View>
  )
}
