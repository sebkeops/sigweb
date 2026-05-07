import { Document, Page, StyleSheet } from '@react-pdf/renderer'
import { registerFonts } from './fonts'
import HeaderBand from './HeaderBand'
import HeroSection from './HeroSection'
import PitchSection from './PitchSection'
import BenefitsGrid from './BenefitsGrid'
import QRSection from './QRSection'
import FooterSignature from './FooterSignature'
import { AFFICHE_COLORS } from './tokens'
import type { AfficheData } from '@/lib/affiche'

// Enregistrement des fonts au mount du module (avant tout render).
registerFonts()

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Nunito',
    backgroundColor: AFFICHE_COLORS.cream,
    color: AFFICHE_COLORS.ink,
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
})

interface Props {
  data: AfficheData
}

/**
 * Document PDF complet d'une affiche A4 SIGWEB.
 *
 * Structure verticale en 6 zones (cf. maquettes HTML de référence) :
 *   1. HeaderBand      (vert sapin, logo + tagline)
 *   2. HeroSection     (photo Google + titre)
 *   3. PitchSection    (accroche personnalisée)
 *   4. BenefitsGrid    (4 bénéfices 2x2)
 *   5. QRSection       (QR code + CTA, marginTop:auto pour pousser en bas)
 *   6. FooterSignature (vert sapin, signature Sébastien)
 *
 * La QR section utilise `marginTop: 'auto'` pour absorber l'espace
 * vertical résiduel — la mise en page reste équilibrée même si le
 * pitch text est plus court ou plus long que la moyenne.
 */
export default function AfficheDocument({ data }: Props) {
  return (
    <Document
      title={`Affiche ${data.prospect.nomCommerce}`}
      author="SIGWEB"
      subject="Proposition de site internet"
    >
      <Page size="A4" style={styles.page}>
        <HeaderBand data={data} />
        <HeroSection data={data} />
        <PitchSection data={data} />
        <BenefitsGrid data={data} />
        <QRSection data={data} />
        <FooterSignature data={data} />
      </Page>
    </Document>
  )
}
