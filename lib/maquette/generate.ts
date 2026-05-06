import type { Prospect } from '@/types'
import { getLogoInitial } from './initials'
import { buildInitialPhotoData } from './photos'
import { categorieToVariant, getTemplate } from './templates'
import type { MaquetteInitialData } from './types'

/**
 * Erreur typée pour les catégories hors scope du générateur V1.
 * Utilisée par la server action pour distinguer un échec "métier"
 * (catégorie non supportée) d'une erreur technique.
 */
export class UnsupportedCategoryError extends Error {
  readonly categorie: string
  constructor(categorie: string) {
    super(`Catégorie non supportée pour le générateur de maquettes : ${categorie}`)
    this.name = 'UnsupportedCategoryError'
    this.categorie = categorie
  }
}

/**
 * Génère le contenu initial d'une maquette à partir d'un prospect.
 *
 * Pure et déterministe : à entrée équivalente, sortie identique. Pas
 * d'appel BDD, pas d'appel API. Le slug et le `prospect_id` sont gérés
 * en amont (server action), et les avis (`avis_items`) restent à null
 * — la sélection se fait manuellement en Session 4.
 *
 * Photos (Session 3.0) : on stocke les refs Google dans le **pool**
 * `available_photos` + un mapping initial `photo_assignments` (hero ←
 * photo[0], histoire ← photo[1], univers_1..5 ← photo[2..6]). L'admin
 * réajustera dans l'éditeur via drag & drop.
 *
 * On remplit AUSSI les anciens champs (`hero_photo_url`, etc.) en
 * parallèle pendant la transition (cf. CLEANUP-TODO.md). Ce double-fill
 * sera retiré une fois le nouveau modèle validé sur quelques maquettes.
 *
 * Si `prospect.google_photo_refs` est null/vide, le pool est vide et tous
 * les slots ont `photo_id: null` — la page publique affiche un placeholder
 * neutre (cf. Session 3.1).
 */
export function generateInitialMaquette(
  prospect: Prospect,
  /**
   * Source d'IDs injectable, principalement pour les tests déterministes.
   * En production, omettre — `randomUUID()` est utilisé par défaut.
   */
  idGen?: () => string
): MaquetteInitialData {
  const variant = categorieToVariant(prospect.categorie)
  if (!variant) {
    throw new UnsupportedCategoryError(prospect.categorie)
  }

  const template = getTemplate(variant)
  const { defaults, universItems, valeursItems } = template

  const photoRefs = prospect.google_photo_refs ?? []

  // Nouveau modèle : pool + assignations
  const photoData = buildInitialPhotoData(photoRefs, idGen)

  // Anciens champs (transition) : on dérive du pool fraîchement construit
  // pour rester cohérent en cas de dédup. NE PAS lire `photoRefs` directement
  // — l'ordre du pool peut différer (dédup).
  const heroPhoto = photoData.available_photos[0]?.reference ?? null
  const histoirePhoto = photoData.available_photos[1]?.reference ?? null
  const universPhotos = photoData.available_photos.slice(2, 7).map((p) => p.reference)
  const universPhotosFinal: string[] | null =
    universPhotos.length > 0 ? universPhotos : null

  return {
    prospect_id: prospect.id,
    template_variant: variant,

    hero_eyebrow:        defaults.heroEyebrow(prospect.ville),
    hero_title:          defaults.heroTitle,
    hero_lead:           defaults.heroLead,
    hero_quote:          defaults.heroQuote,
    hero_quote_author:   defaults.heroQuoteAuthor,
    histoire_title:      defaults.histoireTitle,
    histoire_lead:       defaults.histoireLead,
    texte_presentation:  defaults.textePresentation,
    annee_creation:      null,
    cta_banner_title:    defaults.ctaBannerTitle,
    cta_banner_text:     defaults.ctaBannerText,

    logo_url:            null,
    logo_initial:        getLogoInitial(prospect.nom_commerce),
    palette_mode:        'category',
    palette_primary:     null,
    palette_accent:      null,

    hero_photo_url:        heroPhoto,
    histoire_photo_url:    histoirePhoto,
    univers_photos_urls:   universPhotosFinal,

    available_photos:    photoData.available_photos,
    photo_assignments:   photoData.photo_assignments,

    univers_items:  universItems,
    valeurs_items:  valeursItems,
    avis_items:     null,
  }
}
