import QRCode from 'qrcode'

/**
 * Génère un QR code en PNG dataURL pour intégration dans @react-pdf/<Image>.
 *
 * Paramètres :
 *   - width 300 : suffisant pour une zone d'affichage de ~110px en PDF
 *   - errorCorrectionLevel 'M' : tolère ~15 % d'erreur (réimpression OK
 *     même si l'affiche se froisse un peu en distribution terrain)
 *   - couleurs : ink #1A1814 (cohérent avec la charte) sur fond blanc
 *
 * Note : `qrcode` accepte des URLs jusqu'à ~2900 caractères en mode 'M'.
 * Nos URLs (sigweb.fr/demos/<slug> max ~80 chars) passent largement.
 */
export async function generateQRCodeDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#1A1814',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  })
}
