import type { Prospect, WebVariant } from '@/types'
import { hasGoogleReputation } from '@/lib/prospect/has-google-data'
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
  prospect: Pick<
    Prospect,
    | 'nom_commerce'
    | 'categorie'
    | 'ville'
    | 'google_rating'
    | 'google_reviews_count'
    | 'google_photo_refs'
  >
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

  // Branchement Lot 2 — wording « nouveau commerce » pour les prospects
  // sans données Google (typiquement sourcés via Sirene). Note : on
  // détecte sur la DONNÉE Google (note OU avis OU photos), pas sur le
  // champ `source` qui peut être `'sirene'` mais devenir `'both'` après
  // enrichissement.
  if (!hasGoogleReputation(prospect)) {
    return buildContentNouveauCommerce({ nom, categorie, villeSuffix, qrTargetUrl })
  }

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
 * Wording « nouveau commerce » (Lot 2 — complément Sirene).
 *
 * Déclenché quand le prospect n'a aucune donnée Google (note, avis ni
 * photo). Cas typique : commerce neuf sourcé via Sirene.
 *
 * Ton :
 *   - Reconnaît le lancement, valorise « se rendre visible dès le départ »
 *   - Ne mentionne ni avis ni note (il n'y en a pas)
 *   - N'attaque pas un « site actuel pas à la hauteur » (il n'y en a pas)
 *   - L'image utilisée par le rendu est illustrative (univers métier),
 *     pas la boutique réelle — le wording doit rester cohérent (jamais
 *     « voici votre commerce »).
 *
 * Le wording est volontairement orthogonal à `WebVariant` : un nouveau
 * commerce avec un site existant est rare en pratique (cas Sirene = pas
 * de site dans 99 % des cas). On unifie pour simplifier.
 */
function buildContentNouveauCommerce(opts: {
  nom: string
  categorie: string
  villeSuffix: string
  qrTargetUrl: string
}): ContentResult {
  const { nom, categorie, villeSuffix, qrTargetUrl } = opts
  return {
    headerEyebrow: {
      line1: 'Une idée de site',
      line2: `pour votre ${categorie}`,
    },
    heroEyebrow: `${nom}${villeSuffix}`,
    heroTitle: `Votre ${categorie}\nmérite d'être *visible*\ndès le départ.`,
    pitchEyebrow: 'Une présence en ligne pour bien démarrer',
    // Une seule ligne (cf. brief Lot 2 — Robert Imbert) : on retire le
    // saut explicite. Si la zone est trop étroite pour la phrase, le
    // composant PDF gère le wrap automatiquement, mais le saut forcé
    // au milieu (« Vous venez de » / « vous lancer ») n'est jamais
    // souhaité.
    pitchTitle: 'Vous venez de *vous lancer*.',
    pitchText:
      `Offrez à votre ${categorie} une **vraie présence en ligne**, ` +
      `et donnez envie dès les premiers clics. Pas de fiche perdue, ` +
      `pas de bouche-à-oreille seul : une **vraie vitrine, dès le départ**.`,
    benefits: [
      '**Un site clair et pro**, prêt rapidement',
      COMMON_BENEFIT_TIME,
      '**Optimisé téléphone** et facile à gérer vous-même',
      COMMON_BENEFIT_FREE,
    ],
    ctaTitle: 'Scannez pour découvrir *une idée de site* pour votre commerce',
    ctaDescription: `J'ai préparé une projection de site pour ${nom}. Visible immédiatement depuis votre téléphone.`,
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
