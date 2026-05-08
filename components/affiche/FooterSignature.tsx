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
  // Avatar rond : on applique le borderRadius directement sur l'Image — c'est
  // ce qui fonctionne le plus proprement dans @react-pdf (un overflow:hidden
  // sur le View parent ne masque pas toujours l'image enfant). Bordure blanche
  // discrète pour détacher la photo du fond vert sapin.
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    objectFit: 'cover',
    // Décale le crop vers le haut pour ne pas couper le visage : la photo
    // source est un portrait avec le visage centré sur ~30% du haut, donc
    // un cover centré (50% 50%) tronque le front. '50% 20%' place le centre
    // du crop dans le tiers supérieur de l'image.
    objectPosition: '50% 5%',
    borderWidth: 2,
    borderColor: AFFICHE_COLORS.white,
    borderStyle: 'solid',
  },
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
        <Image src={data.footer.avatarUrl} style={styles.avatar} />
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
