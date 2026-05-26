import type {
  GoogleOpeningHours,
  Maquette,
  MaquetteTemplateVariant,
  Prospect,
  ProspectCategorie,
} from '@/types'
import type { SimulationPayload } from '@/lib/maquette/data-schema'

/**
 * Adapte un `SimulationPayload` (JSONB lu en BDD) en `{ maquette, prospect }`
 * complets compatibles avec les signatures des sous-composants partagés
 * `app/demos/[slug]/components/*`.
 *
 * Ces composants attendent un `Maquette` (ligne table `maquettes`) et un
 * `Prospect` (ligne table `prospects`) typés strictement. Comme les
 * simulations publiques ne vivent pas dans ces tables — elles sont stockées
 * dans `projects.simulation_data` (JSONB) — on fabrique ici des objets
 * **valeur-compatibles** mais sans réalité BDD : leurs `id`, `created_at`,
 * etc. sont factices et ne référencent rien.
 *
 * Cette fonction est appelée à chaque rendu (côté ISR), elle doit donc
 * rester rapide et sans effet de bord.
 */
export function simulationPayloadToRenderProps(
  payload: SimulationPayload,
  slug: string
): { maquette: Maquette; prospect: Prospect } {
  const m = payload.maquette
  const p = payload.prospect

  // ISO factice unique mais constant pour cette simulation — sert seulement
  // au type `Maquette`, jamais lu côté rendu (les composants n'utilisent pas
  // ces champs DB metadata).
  const FAKE_ISO = '2026-01-01T00:00:00.000Z'

  // Le `prospect_id` du payload est lui-même un UUID factice généré au build
  // (cf. décision validée en pré-Phase-3 : on stocke un UUID sans FK).
  const fakeProspectId = m.prospect_id

  const maquette: Maquette = {
    // ── Metadata DB factice ──
    id: `sim-maquette-${slug}`,
    created_at: FAKE_ISO,
    updated_at: FAKE_ISO,
    prospect_id: fakeProspectId,
    slug,
    published: true,
    published_at: FAKE_ISO,
    infos_overrides: null,

    // ── Contenu généré (MaquetteInitialData → Maquette) ──
    // Le schéma Zod tolère `template_variant: string` (pour ne pas bloquer
    // sur de futurs variants non encore typés) ; au runtime, la valeur est
    // garantie être un `MaquetteTemplateVariant` valide puisqu'elle vient
    // du générateur qui n'écrit que des variants enum.
    template_variant: m.template_variant as MaquetteTemplateVariant,
    hero_eyebrow: m.hero_eyebrow,
    hero_title: m.hero_title,
    hero_lead: m.hero_lead,
    hero_quote: m.hero_quote,
    hero_quote_author: m.hero_quote_author,
    histoire_title: m.histoire_title,
    histoire_lead: m.histoire_lead,
    texte_presentation: m.texte_presentation,
    annee_creation: m.annee_creation,
    univers_section_suptitle: m.univers_section_suptitle,
    univers_section_title: m.univers_section_title,
    univers_section_intro: m.univers_section_intro,
    cta_banner_title: m.cta_banner_title,
    cta_banner_text: m.cta_banner_text,
    brand_tagline: m.brand_tagline,
    nav_histoire_label: m.nav_histoire_label,
    nav_univers_label: m.nav_univers_label,
    hero_cta_primaire: m.hero_cta_primaire,
    histoire_suptitle: m.histoire_suptitle,
    avis_section_titre: m.avis_section_titre,
    footer_colonne_label: m.footer_colonne_label,
    logo_url: m.logo_url,
    logo_initial: m.logo_initial,
    palette_mode: m.palette_mode,
    palette_primary: m.palette_primary,
    palette_accent: m.palette_accent,
    hero_photo_url: m.hero_photo_url,
    histoire_photo_url: m.histoire_photo_url,
    univers_photos_urls: m.univers_photos_urls,
    available_photos: m.available_photos,
    photo_assignments: m.photo_assignments,
    univers_items: m.univers_items,
    valeurs_items: m.valeurs_items,
    avis_items: m.avis_items,
  }

  // Pour reconstruire un `Prospect` complet, on injecte les 10 champs du
  // payload là où ils sont attendus, et on remplit tous les autres avec
  // des valeurs nulles/par défaut. Les composants ne lisent pas ces champs
  // additionnels (audit `grep prospect\\.X` sur les composants demos).
  const prospect: Prospect = {
    // ── Metadata DB factice ──
    id: fakeProspectId,
    created_at: FAKE_ISO,
    updated_at: FAKE_ISO,

    // ── Champs lus par le rendu ──
    nom_commerce: p.nom_commerce,
    ville: p.ville,
    adresse: p.adresse,
    code_postal: p.code_postal,
    telephone: p.telephone,
    email: p.email,
    google_rating: p.google_rating,
    google_reviews_count: p.google_reviews_count,
    google_reviews: p.google_reviews,
    // Cast nécessaire : le schéma Zod déclare `periods` en `z.unknown()`
    // (le rendu ne lit que `weekdayDescriptions`, on n'impose donc pas le
    // détail des periods côté simulation). On force le type côté Prospect
    // sans aliaser silencieusement — la consommation côté `Infos.tsx` est
    // restreinte aux `weekdayDescriptions`.
    google_opening_hours: p.google_opening_hours as GoogleOpeningHours | null,

    // ── Catégorie cohérente avec le template variant (la majorité des
    //    variants sont des `ProspectCategorie` valides — la simulation est
    //    générée à partir d'une catégorie, donc cette correspondance est
    //    garantie en pratique) ──
    categorie: m.template_variant as ProspectCategorie,

    // ── Champs résiduels non lus par le rendu, défauts neutres ──
    distance_km: null,
    site_existant_url: null,
    instagram_url: null,
    facebook_url: null,
    score: null,
    canal: 'a_definir',
    statut: 'a_qualifier',
    notes: null,
    date_dernier_contact: null,
    date_relance_prevue: null,
    source: 'manuel',
    google_place_id: null,
    google_business_status: null,
    google_categories: null,
    google_photo_refs: null,
    google_maps_url: null,
    google_primary_type_display: null,
    latitude: null,
    longitude: null,
    last_enriched_at: null,
    score_calcule: null,
    score_proximite: null,
    score_besoin_web: null,
    score_activite: null,
    score_malus: null,
    score_override_manuel: null,
    score_explanations: null,
    score_calcule_at: null,
    score_override_at: null,
    maquette_id: null,
    maquette_url: null,
    email_unsubscribed: false,
    email_unsubscribed_at: null,
  }

  return { maquette, prospect }
}
