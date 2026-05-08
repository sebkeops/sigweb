import type { Prospect, WebVariant } from '@/types'
import { getCategorieLabel } from './categories'
import { shortDisplayUrl } from './url-resolver'
import type { AfficheData } from './types'

/**
 * Textes éditoriaux des 2 variantes — résolus avec les données prospect.
 *
 * Convention typographique (déjà présente dans le projet pour les
 * maquettes) :
 *   - `*mot*`  → italique avec couleur d'accent (orange ou vert selon zone)
 *   - `**mot**` → gras avec couleur principale (ink)
 *
 * Le parseur côté rendu PDF (Phase 3) interprète ces marqueurs.
 *
 * Logique de fallback données manquantes :
 *   - Si note Google OU nb avis manquant : on bascule sur les versions
 *     fallback du pitch (cf. brief section 8). Sinon on construit la
 *     variante "avec données chiffrées".
 */

export interface ContentInput {
  variant: WebVariant
  prospect: Pick<Prospect, 'nom_commerce' | 'categorie' | 'ville' | 'google_rating' | 'google_reviews_count'>
  qrTargetUrl: string
}

export interface ContentResult {
  headerEyebrow: { line1: string; line2: string }
  heroEyebrow: string
  heroTitle: string
  pitchEyebrow: string
  pitchTitle: string
  pitchText: string
  benefits: string[]
  ctaTitle: string
  ctaDescription: string
  ctaUrlDisplay: string
}

const COMMON_BENEFIT_TIME = '**Mise en ligne** en 2 à 4 semaines'
const COMMON_BENEFIT_FREE = '**Sans engagement**, totalement gratuit à voir'

export function buildContent(input: ContentInput): ContentResult {
  const { variant, prospect, qrTargetUrl } = input
  const categorie = getCategorieLabel(prospect.categorie)
  const nom = prospect.nom_commerce
  const villeSuffix = prospect.ville ? ` · ${prospect.ville}` : ''

  // Stats Google : on les garde uniquement si les 2 sont présentes
  // (note isolée sans nb d'avis n'a pas de sens dans nos phrases).
  const hasStats = prospect.google_rating != null && prospect.google_reviews_count != null
  const note = prospect.google_rating
  const nbAvis = prospect.google_reviews_count

  const headerEyebrow =
    variant === 'sans-site'
      ? { line1: 'Une simulation gratuite', line2: `pour votre ${categorie}` }
      : { line1: 'Une nouvelle vitrine',     line2: `pour votre ${categorie}` }

  const heroEyebrow = `${nom}${villeSuffix}`

  const heroTitle =
    variant === 'sans-site'
      ? `Et si votre ${categorie}\navait *enfin* son site ?`
      : `Votre ${categorie}\nmérite *une nouvelle* vitrine.`

  const pitchEyebrow =
    variant === 'sans-site'
      ? 'Une simulation faite pour vous'
      : 'Une simulation modernisée'

  let pitchTitle: string
  let pitchText: string

  if (variant === 'sans-site') {
    if (hasStats) {
      pitchTitle = `${nbAvis} avis Google,\nune *vraie clientèle*... mais en ligne ?`
      pitchText = `Avec une note de **${formatRating(note!)}/5**, vos clients vous apprécient. Mais quand de nouveaux habitants cherchent une ${categorie} sur leur téléphone, ils tombent juste sur votre fiche Google. **Vous méritez mieux qu'une fiche.**`
    } else {
      pitchTitle = 'Une *vraie clientèle*\nen attente de vous trouver.'
      pitchText = `Vos clients vous apprécient. Mais quand de nouveaux habitants cherchent une ${categorie} sur leur téléphone, ils tombent juste sur votre fiche Google. **Vous méritez mieux qu'une fiche.**`
    }
  } else {
    if (hasStats) {
      pitchTitle = `${nbAvis} avis, ${formatRating(note!)}/5...\net un site qui ne *vous rend pas justice*.`
      pitchText = `Vous avez gagné la confiance de vos clients. Mais votre site actuel n'est pas à la hauteur de la qualité de votre ${categorie}. **J'ai préparé une refonte qui change la donne.**`
    } else {
      pitchTitle = 'Un site qui ne\n*vous rend pas justice*.'
      pitchText = `Vous avez gagné la confiance de vos clients. Mais votre site actuel n'est pas à la hauteur de la qualité de votre ${categorie}. **J'ai préparé une refonte qui change la donne.**`
    }
  }

  const benefits: string[] =
    variant === 'sans-site'
      ? [
          '**Vos vraies photos** et vos vrais avis Google déjà intégrés',
          COMMON_BENEFIT_TIME,
          '**Adapté au téléphone** et facile à gérer vous-même',
          COMMON_BENEFIT_FREE,
        ]
      : [
          '**Refonte moderne** avec vos vraies photos et avis Google',
          COMMON_BENEFIT_TIME,
          '**Optimisé téléphone** et facile à gérer vous-même',
          COMMON_BENEFIT_FREE,
        ]

  const ctaTitle =
    variant === 'sans-site'
      ? 'Scannez pour voir *votre simulation*'
      : 'Scannez pour voir *votre nouvelle vitrine*'

  const ctaDescription =
    variant === 'sans-site'
      ? `J'ai préparé un aperçu spécifique de ${nom}. Visible immédiatement depuis votre téléphone.`
      : `J'ai préparé une refonte spécifique de ${nom}. Visible immédiatement depuis votre téléphone.`

  return {
    headerEyebrow,
    heroEyebrow,
    heroTitle,
    pitchEyebrow,
    pitchTitle,
    pitchText,
    benefits,
    ctaTitle,
    ctaDescription,
    ctaUrlDisplay: shortDisplayUrl(qrTargetUrl),
  }
}

/**
 * Formate une note Google en notation française (virgule décimale, 1 chiffre
 * après la virgule). 4.8 → "4,8".
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1).replace('.', ',')
}

/**
 * Type aggrégé exporté pour faciliter la composition par data-builder.
 */
export type { AfficheData }
