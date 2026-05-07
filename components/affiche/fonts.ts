import path from 'node:path'
import { Font } from '@react-pdf/renderer'

/**
 * Enregistre la police Nunito pour @react-pdf/renderer.
 *
 * Stratégie : TTF embarqués localement dans `public/fonts/`.
 *
 * Pourquoi pas un CDN ?
 *   - gstatic.com utilise des hashes versionnés qui changent silencieusement
 *     quand Google met à jour la font (404 surprise).
 *   - Bunny Fonts ne sert que woff/woff2 ; @react-pdf nécessite TTF/OTF.
 *   - Embarquer les 6 TTF (~750 KB) garantit zéro dépendance réseau au render.
 *
 * Pourquoi 6 variants ?
 *   - @react-pdf NE SYNTHÉTISE PAS l'italique. Si on utilise
 *     `fontStyle: 'italic'` dans un style sans avoir enregistré la version
 *     italique de la font, throw : "Could not resolve font for Nunito,
 *     fontWeight X, fontStyle italic". On enregistre normal (400/600/700/800)
 *     + italic (400/700) — les seuls poids/styles utilisés dans l'affiche.
 *
 * Path filesystem : `process.cwd()` pointe vers le root du projet en local
 * et vers `/var/task/` sur Vercel ; dans les deux cas les fichiers de
 * `public/` y sont présents et lisibles côté serveur.
 */

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts')

let registered = false

export function registerFonts(): void {
  if (registered) return
  Font.register({
    family: 'Nunito',
    fonts: [
      { src: path.join(FONTS_DIR, 'nunito-400.ttf'), fontWeight: 400 },
      { src: path.join(FONTS_DIR, 'nunito-600.ttf'), fontWeight: 600 },
      { src: path.join(FONTS_DIR, 'nunito-700.ttf'), fontWeight: 700 },
      { src: path.join(FONTS_DIR, 'nunito-800.ttf'), fontWeight: 800 },
      { src: path.join(FONTS_DIR, 'nunito-400-italic.ttf'), fontWeight: 400, fontStyle: 'italic' },
      { src: path.join(FONTS_DIR, 'nunito-700-italic.ttf'), fontWeight: 700, fontStyle: 'italic' },
    ],
  })
  // Désactive le hyphenation auto qui produit des coupures visuelles
  // gênantes sur les titres de l'affiche.
  Font.registerHyphenationCallback((word) => [word])
  registered = true
}
