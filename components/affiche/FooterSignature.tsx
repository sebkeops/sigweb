import { Image, StyleSheet, Text, View } from '@react-pdf/renderer'
import { AFFICHE_COLORS } from './tokens'
import type { AfficheData } from '@/lib/affiche'

const styles = StyleSheet.create({
  footer: {
    backgroundColor: AFFICHE_COLORS.primary,
    color: AFFICHE_COLORS.white,
    paddingHorizontal: 36,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  signature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 38,
    height: 38,
    backgroundColor: AFFICHE_COLORS.white,
    borderRadius: 19,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: { width: '100%', height: '100%', objectFit: 'contain' },
  name: {
    fontFamily: 'Nunito',
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.2,
    color: AFFICHE_COLORS.white,
  },
  role: {
    fontFamily: 'Nunito',
    fontSize: 9,
    fontWeight: 500,
    opacity: 0.85,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
    color: AFFICHE_COLORS.white,
  },
  coords: {
    fontFamily: 'Nunito',
    fontSize: 10,
    fontWeight: 500,
    textAlign: 'right',
    lineHeight: 1.5,
    opacity: 0.95,
    color: AFFICHE_COLORS.white,
  },
  coordsBold: {
    fontWeight: 700,
  },
})

interface Props {
  data: AfficheData
}

export default function FooterSignature({ data }: Props) {
  return (
    <View style={styles.footer}>
      <View style={styles.signature}>
        <View style={styles.logoCircle}>
          <Image src={data.footer.logoUrl} style={styles.logoImg} />
        </View>
        <View>
          <Text style={styles.name}>{data.footer.contactName}</Text>
          <Text style={styles.role}>{data.footer.contactRole}</Text>
        </View>
      </View>

      <View>
        <Text style={[styles.coords, styles.coordsBold]}>{data.footer.phoneDisplay}</Text>
        <Text style={styles.coords}>
          {data.footer.email} · {data.footer.siteDisplay}
        </Text>
      </View>
    </View>
  )
}
