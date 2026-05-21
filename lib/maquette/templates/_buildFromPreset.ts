import type { MetierPreset } from '@/lib/maquette/presets/metiers'
import type { MaquetteTemplateVariant, MaquetteValeurItem } from '@/types'
import type { TemplateConfig, TemplateDefaults, TemplatePalette } from '../types'

/**
 * Construction d'un `TemplateConfig` à partir d'un preset métier.
 *
 * Depuis la consolidation "Brief Consolidation finale" (16 catégories
 * supplémentaires + lexique global + defaults intégrés), le preset porte
 * **toutes** les valeurs spécifiques à la catégorie :
 *   - palette (primary + accent + background)
 *   - brandTagline
 *   - 4 atouts (sous le Hero)
 *   - 3 champs section "Nos créations"
 *   - 6 champs lexique global
 *   - 11 champs defaults (Hero / Histoire / CTA + 5 cartes univers)
 *   - paletteOverrides optionnel (uniquement Famille 2)
 *
 * La factory n'a plus aucun argument narratif externe : il suffit de passer
 * le preset, le variant en sort (ou est forcé si différent du preset.id).
 */
export interface BuildTemplateArgs {
  /** Variant cible (clé du record TEMPLATES). Par défaut, `preset.id`. */
  variant?: MaquetteTemplateVariant
  preset: MetierPreset
}

/**
 * Éclaircit une couleur hex `#RRGGBB` d'un ratio (0..1) vers le blanc.
 * Ratio 0 → identité ; ratio 1 → blanc.
 *
 * Sert à dériver les variantes "soft" et "light" à partir des couleurs
 * principales du preset. Évite d'imposer aux presets de définir ces variantes
 * (5 couleurs à choisir au lieu de 3, casse-tête pour les non-graphistes).
 */
function lighten(hex: string, ratio: number): string {
  const clean = hex.replace('#', '')
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return hex
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const lerp = (c: number) => Math.round(c + (255 - c) * Math.min(Math.max(ratio, 0), 1))
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(lerp(r))}${toHex(lerp(g))}${toHex(lerp(b))}`
}

/**
 * Convertit les atouts d'un preset (objet `{icon, titre, sousTitre}`) vers
 * la forme persistée en BDD (`MaquetteValeurItem` = `{title, desc}`). Le
 * champ `icon` du preset est documentaire — il n'est pas utilisé au rendu
 * (cf. `Histoire.tsx`, cycle unicode décoratif par position).
 */
export function presetAtoutsToValeurs(preset: MetierPreset): MaquetteValeurItem[] {
  return preset.atouts.map((a) => ({ title: a.titre, desc: a.sousTitre }))
}

/**
 * Compose le suptitle Hero à partir du qualifier du preset et de la ville
 * du prospect. Si la ville est absente, on retourne le qualifier seul.
 */
function buildHeroEyebrow(qualifier: string): (city: string | null) => string {
  return (city) => (city ? `${qualifier} · ${city}` : qualifier)
}

export function buildTemplate(args: BuildTemplateArgs): TemplateConfig {
  const { preset } = args
  const variant: MaquetteTemplateVariant = args.variant ?? preset.id

  const overrides = preset.paletteOverrides
  const palette: TemplatePalette = {
    cream:        preset.couleurs.background,
    creamLight:   lighten(preset.couleurs.background, 0.4),
    // creamWarm un peu plus chaud : on le ramène vers l'accent à faible ratio
    // plutôt que d'introduire un darken. Donne un voile cohérent avec la marque.
    creamWarm:    lighten(preset.couleurs.accent, 0.7),
    ink:          '#1A1612',
    inkSoft:      '#4A3F35',
    inkMuted:     '#7A6E60',
    primary:      preset.couleurs.primary,
    primarySoft:  overrides?.primarySoft ?? lighten(preset.couleurs.primary, 0.25),
    accent:       preset.couleurs.accent,
    accentLight:  overrides?.accentLight ?? lighten(preset.couleurs.accent, 0.25),
    // Surcharges historiques (Famille 2) : écrasent les valeurs dérivées
    // pour restaurer cream/ink/inkSoft/inkMuted etc. à l'identique
    // pré-refacto. Pour les autres presets, ces neutres sont les valeurs
    // dérivées + valeurs en dur ci-dessus.
    ...(overrides?.palette ?? {}),
  }

  const d = preset.defaults
  const defaults: TemplateDefaults = {
    heroEyebrow:       buildHeroEyebrow(d.heroEyebrowQualifier),
    heroTitle:         d.heroTitle,
    heroLead:          d.heroLead,
    heroQuote:         d.heroQuote,
    heroQuoteAuthor:   d.heroQuoteAuthor,
    histoireTitle:     d.histoireTitle,
    histoireLead:      d.histoireLead,
    textePresentation: d.textePresentation,
    ctaBannerTitle:    d.ctaBannerTitle,
    ctaBannerText:     d.ctaBannerText,
    universSectionSuptitle: preset.nosCreations.suptitle,
    universSectionTitle:    preset.nosCreations.titrePrincipal,
    universSectionIntro:    preset.nosCreations.paragraphe,
    brandTagline:           preset.brandTagline,
    navHistoireLabel:       preset.lexique.navHistoireLabel,
    navUniversLabel:        preset.lexique.navUniversLabel,
    heroCtaPrimaire:        preset.lexique.heroCtaPrimaire,
    histoireSuptitle:       preset.lexique.histoireSuptitle,
    avisSectionTitre:       preset.lexique.avisSectionTitre,
    footerColonneLabel:     preset.lexique.footerColonneLabel,
  }

  return {
    variant,
    palette,
    defaults,
    // Les 5 cartes univers sont readonly dans le preset ; on les copie pour
    // exposer un MaquetteUniversItem[] mutable côté schéma.
    universItems: [...d.universItems],
    valeursItems: presetAtoutsToValeurs(preset),
  }
}
