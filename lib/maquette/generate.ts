import type { Prospect, ProspectCategorie } from '@/types'
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
 * Input minimal pour `generateInitialMaquette`.
 *
 * Extrait des 5 seuls champs de `Prospect` réellement consommés par le
 * générateur. Cette signature découplée permet d'alimenter le générateur
 * depuis n'importe quelle source — un vrai prospect (via le wrapper
 * `generateInitialMaquetteFromProspect`) ou des données fictives (pour
 * les simulations publiques générées en Phase 5/6).
 */
export interface GenerateMaquetteInput {
  /**
   * Identifiant injecté tel quel dans `MaquetteInitialData.prospect_id`.
   * Pour un vrai prospect : `prospect.id`. Pour une simulation publique :
   * un UUID factice (`randomUUID()`) — le JSONB `projects.simulation_data`
   * n'a pas de FK vers `prospects`.
   */
  prospect_id: string
  categorie: ProspectCategorie
  nom_commerce: string
  ville: string | null
  /** Refs photos Google ou URLs absolues. Null/vide → pool vide. */
  google_photo_refs: string[] | null
}

/**
 * Génère le contenu initial d'une maquette à partir d'un input minimal.
 *
 * Pure et déterministe : à entrée équivalente, sortie identique. Pas
 * d'appel BDD, pas d'appel API. Le slug est géré en amont (server action),
 * et les avis (`avis_items`) restent à null — la sélection se fait
 * manuellement en Session 4 pour les vrais prospects (en Phase 6 pour les
 * simulations publiques, avec des avis fictifs templated).
 *
 * Photos (Session 3.0) : on stocke les refs dans le **pool**
 * `available_photos` + un mapping initial `photo_assignments` (hero ←
 * photo[0], histoire ← photo[1], univers_1..5 ← photo[2..6]). L'admin
 * réajustera dans l'éditeur via drag & drop.
 *
 * On remplit AUSSI les anciens champs (`hero_photo_url`, etc.) en
 * parallèle pendant la transition (cf. CLEANUP-TODO.md). Ce double-fill
 * sera retiré une fois le nouveau modèle validé sur quelques maquettes.
 *
 * Si `google_photo_refs` est null/vide, le pool est vide et tous
 * les slots ont `photo_id: null` — la page publique affiche un placeholder
 * neutre (cf. Session 3.1).
 */
export function generateInitialMaquette(
  input: GenerateMaquetteInput,
  /**
   * Source d'IDs injectable, principalement pour les tests déterministes.
   * En production, omettre — `randomUUID()` est utilisé par défaut.
   */
  idGen?: () => string
): MaquetteInitialData {
  const variant = categorieToVariant(input.categorie)
  if (!variant) {
    throw new UnsupportedCategoryError(input.categorie)
  }

  const template = getTemplate(variant)
  const { defaults, universItems, valeursItems } = template

  const photoRefs = input.google_photo_refs ?? []

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
    prospect_id: input.prospect_id,
    template_variant: variant,

    hero_eyebrow:        defaults.heroEyebrow(input.ville),
    hero_title:          defaults.heroTitle,
    hero_lead:           defaults.heroLead,
    hero_quote:          defaults.heroQuote,
    hero_quote_author:   defaults.heroQuoteAuthor,
    histoire_title:      defaults.histoireTitle,
    histoire_lead:       defaults.histoireLead,
    texte_presentation:  defaults.textePresentation,
    annee_creation:      null,
    // Section "Nos créations" — persistée dès la création pour que l'éditeur
    // ait des valeurs initiales modifiables (fallback template inutile à l'usage,
    // mais conservé dans Univers.tsx pour rétro-compatibilité des maquettes
    // pré-migration).
    univers_section_suptitle: defaults.universSectionSuptitle,
    univers_section_title:    defaults.universSectionTitle,
    univers_section_intro:    defaults.universSectionIntro,
    cta_banner_title:    defaults.ctaBannerTitle,
    cta_banner_text:     defaults.ctaBannerText,

    // Lexique global — extension presets métier, persisté pour éditabilité.
    brand_tagline:        defaults.brandTagline,
    nav_histoire_label:   defaults.navHistoireLabel,
    nav_univers_label:    defaults.navUniversLabel,
    hero_cta_primaire:    defaults.heroCtaPrimaire,
    histoire_suptitle:    defaults.histoireSuptitle,
    avis_section_titre:   defaults.avisSectionTitre,
    footer_colonne_label: defaults.footerColonneLabel,

    logo_url:            null,
    logo_initial:        getLogoInitial(input.nom_commerce),
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

/**
 * Wrapper de compatibilité — extrait les 5 champs `GenerateMaquetteInput`
 * d'un `Prospect` et appelle `generateInitialMaquette`.
 *
 * Préserve l'API précédente (`generateInitialMaquette(prospect)`) pour les
 * appelants existants côté CRM (server action `lib/actions/maquette.ts`),
 * sans imposer aux nouveaux appelants — typiquement le générateur de
 * simulations publiques en Phase 5 — de fabriquer un faux `Prospect`
 * complet avec 25 champs.
 */
export function generateInitialMaquetteFromProspect(
  prospect: Prospect,
  idGen?: () => string
): MaquetteInitialData {
  return generateInitialMaquette(
    {
      prospect_id: prospect.id,
      categorie: prospect.categorie,
      nom_commerce: prospect.nom_commerce,
      ville: prospect.ville,
      google_photo_refs: prospect.google_photo_refs,
    },
    idGen
  )
}
