export type ProjectKind = 'simulation' | 'realisation'

// L'ancienne interface `SimulationData` + `SimulationFeaturedCard` a été
// supprimée en Phase 3 (refonte rendu unifié). Les simulations publiques
// utilisent désormais le même modèle que les maquettes prospects :
// `lib/maquette/types.ts` → `MaquetteInitialData`, stocké dans
// `projects.simulation_data` (JSONB) sous le wrapper `{ maquette, prospect }`
// validé par `lib/maquette/data-schema.ts` → `SimulationPayloadSchema`.

export interface Project {
  id: string
  title: string
  slug: string
  business_type: string | null
  short_description: string | null
  content: string | null
  cover_image_url: string | null
  external_url: string | null
  project_kind: ProjectKind
  published: boolean
  featured_home: boolean
  created_at: string
  updated_at: string
  /**
   * Famille éditoriale (6 valeurs alignées sur `CATEGORIE_FAMILIES` —
   * cf. `lib/crm/constants.ts`). Renseigné uniquement pour les simulations
   * publiques, sert au filtre famille sur /simulations. Nullable pour les
   * réalisations.
   */
  category_family: string | null
}

export interface Contact {
  id: string
  name: string
  business_name: string | null
  email: string
  phone: string | null
  business_type: string | null
  message: string
  is_read: boolean
  created_at: string
}

export type ProspectCategorie =
  // V1 — Commerces de bouche
  | 'boulangerie' | 'boucherie' | 'restaurant' | 'pizzeria'
  | 'primeur' | 'fromager' | 'caviste'
  // V1 — Services à la personne
  | 'coiffeur' | 'esthetique' | 'kine' | 'cabinet'
  // V1 — Bâtiment & artisanat
  | 'menuisier' | 'plombier' | 'electricien' | 'peintre' | 'paysagiste'
  // V1 — Commerces & services
  | 'photographe'
  // V2 — Commerces de bouche additionnels
  | 'bar_cafe' | 'traiteur' | 'chocolatier' | 'epicerie_fine'
  // V2 — Bâtiment & artisanat additionnels
  | 'macon' | 'couvreur' | 'carreleur' | 'piscinier'
  // V2 — Services à la personne additionnels
  | 'osteopathe' | 'praticien_bien_etre'
  // V2 — Commerces & services additionnels
  | 'fleuriste' | 'bijoutier' | 'librairie' | 'garagiste'
  // V2 — Hébergement
  | 'gite' | 'camping'
  // Fallback
  | 'autre'

export type ProspectCanal =
  | 'a_definir' | 'terrain' | 'email' | 'reseaux' | 'telephone' | 'ecarte'

export type ProspectStatut =
  | 'a_qualifier' | 'qualifie' | 'maquette_prete' | 'contacte'
  | 'relance_1' | 'relance_2' | 'relance_3'
  | 'repondu' | 'rdv_pris' | 'devis_envoye'
  | 'signe' | 'perdu' | 'ecarte'

export type ProspectSource =
  | 'manuel'
  | 'enrichissement'
  | 'sourcing'
  | 'sirene'  // sourcé via API Sirene (data.gouv.fr ou INSEE)
  | 'both'    // fusion à l'import : connu de Google ET Sirene (match SIRET)

/**
 * État administratif d'une entreprise selon Sirene :
 *   - 'A' (Active), 'F' (Fermée), 'C' (Cessée)
 *   - null si l'info n'a pas encore été récupérée (prospect non enrichi Sirene)
 */
export type EtatAdministratif = 'A' | 'F' | 'C' | null

/**
 * Statut d'analyse PageSpeed pour le site existant d'un prospect.
 *   - null : pas encore demandé (ou prospect sans site)
 *   - 'pending' : en queue pour le cron PageSpeed batch
 *   - 'done' : analysé, scores stockés
 *   - 'error' : échec API (quota, URL invalide, timeout)
 */
export type PageSpeedStatus = 'pending' | 'done' | 'error' | null

export type GoogleBusinessStatus = 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'

export interface GoogleOpeningPeriod {
  open: { day: number; hour: number; minute: number }
  close?: { day: number; hour: number; minute: number }
}

export interface GoogleOpeningHours {
  weekdayDescriptions?: string[]
  periods?: GoogleOpeningPeriod[]
  openNow?: boolean
}

export interface Prospect {
  id: string
  created_at: string
  updated_at: string
  nom_commerce: string
  categorie: ProspectCategorie
  adresse: string | null
  ville: string | null
  code_postal: string | null
  distance_km: number | null
  telephone: string | null
  email: string | null
  site_existant_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  score: number | null
  canal: ProspectCanal
  statut: ProspectStatut
  notes: string | null
  date_dernier_contact: string | null
  date_relance_prevue: string | null
  source: ProspectSource

  // Enrichissement Google Places
  google_place_id: string | null
  google_rating: number | null
  google_reviews_count: number | null
  google_business_status: GoogleBusinessStatus | null
  google_categories: string[] | null
  google_opening_hours: GoogleOpeningHours | null
  google_photo_refs: string[] | null
  google_maps_url: string | null
  google_primary_type_display: string | null
  latitude: number | null
  longitude: number | null
  last_enriched_at: string | null

  // Scoring automatique (grille v2)
  score_calcule: number | null
  score_proximite: number | null
  score_besoin_web: number | null
  score_activite: number | null
  score_malus: number | null
  score_override_manuel: number | null
  score_explanations: string[] | null
  score_calcule_at: string | null
  score_override_at: string | null

  // Avis Google détaillés (max 5, snapshot via enrichissement Places)
  google_reviews: GoogleReviewItem[] | null

  // Liaison maquette
  maquette_id: string | null
  maquette_url: string | null

  // Désabonnement email (RGPD) — un prospect désabonné ne reçoit plus
  // jamais d'email, même via campagne manuelle.
  email_unsubscribed: boolean
  email_unsubscribed_at: string | null

  // ── Pilotage commercial CRM v3 (Phase 1) ──
  /**
   * Horodatage de la dernière transition de statut. Mis à jour par la
   * Server Action `updateProspectStatut` ET par la progression automatique
   * dans `sendProspectEmail` (envoi d'email = `contacte` ou progression
   * de relance). Source unique de vérité pour les métriques de durée.
   */
  statut_updated_at: string  // ISO

  /**
   * Flag de test — un prospect avec `is_test = true` n'apparaît pas dans
   * les KPIs dashboard et ne déclenche pas les transitions automatiques
   * de statut (cf. Phase 5 du chantier CRM v3). Permet à l'admin de créer
   * des prospects de bac à sable sans polluer les vraies stats.
   */
  is_test: boolean

  // ── Données légales Sirene (intégration data.gouv.fr / INSEE) ──

  /** SIRET 14 chiffres — clé naturelle de dédup à l'import (cross-sources). */
  siret: string | null
  /** Code NAF rev2 (ex: '1071C' pour boulangerie artisanale). */
  code_naf: string | null
  /** Libellé lisible du code NAF (ex: 'Cuisson de produits de boulangerie'). */
  libelle_naf: string | null
  /** Date de création légale de l'établissement. */
  date_creation: string | null  // ISO date (YYYY-MM-DD)
  /** Tranche d'effectif salarié Sirene (codes '00' à '53', ex: '11' = 10-19 salariés). */
  tranche_effectif: string | null
  etat_administratif: EtatAdministratif
  /** Payload brut Sirene (jsonb) pour ré-extraction ultérieure sans rappel API. */
  sirene_raw: unknown
  sirene_enriched_at: string | null  // ISO

  // ── Lot 2 : champs Sirene additionnels persistés ──
  /**
   * Nom de famille du dirigeant principal (personne physique).
   * Null si dirigeant personne morale (SAS/SARL gérée par une holding) ou
   * si l'unité légale n'a pas de dirigeants exposés par l'API.
   */
  dirigeant_nom: string | null
  /** Prénom(s) du dirigeant principal. Cf. `dirigeant_nom` pour le contexte. */
  dirigeant_prenom: string | null
  /**
   * `true` UNIQUEMENT si `statut_diffusion === 'O'` ET un dirigeant personne
   * physique est exposé. Permet d'utiliser le nom pour personnaliser un
   * email sans risquer de violer la diffusion partielle/protégée INSEE
   * (règle depuis 2023). Si `false`, ne JAMAIS afficher le nom au client.
   */
  dirigeant_nom_diffusible: boolean
  /**
   * Date de création de l'unité légale (entreprise), distincte de
   * `date_creation` (établissement). Utile pour le pitch d'ancienneté
   * « depuis AAAA » sur les commerces établis.
   */
  date_creation_entreprise: string | null
  /** Code INSEE brut de nature juridique (1000, 5410, 5710…). */
  forme_juridique_code: string | null
  /** Libellé humanisé pour l'admin (« SAS », « SARL », « Entrepreneur Individuel »…). */
  forme_juridique_label: string | null

  // ── Performance site existant (PageSpeed Insights v5) ──

  /** Score de performance (0..100), null si non analysé ou prospect sans site. */
  pagespeed_score_perf: number | null
  /** Score performance mobile, null si non analysé ou si API n'a renvoyé qu'un score global. */
  pagespeed_score_mobile: number | null
  pagespeed_analyzed_at: string | null  // ISO
  pagespeed_status: PageSpeedStatus
  /** Payload brut PageSpeed pour audit ultérieur. */
  pagespeed_raw: unknown

  // ── Dédup ──

  /**
   * Avertissement de doublon potentiel posé à l'import quand un match
   * nom+CP a été détecté SANS SIRET commun (dédup conservatrice).
   * L'admin peut filtrer pour fusionner manuellement. Null = pas de doute.
   */
  dedup_warning: string | null
}

// ─── Maquettes (générateur de maquettes ultra-personnalisées) ────────────────

/**
 * Variant de template d'une maquette générée.
 *
 * Aligné 1:1 sur `ProspectCategorie` depuis la généralisation Famille 2 →
 * toutes catégories : chaque catégorie a son template, construit à partir
 * d'un preset métier (cf. `lib/maquette/presets/metiers.ts`). Les 4 variants
 * Famille 2 (boulangerie, boucherie, restaurant, pizzeria) conservent leurs
 * `TemplateConfig` historiques pour zéro régression ; les 14 autres sont
 * dérivés d'une base générique + preset.
 */
export type MaquetteTemplateVariant = ProspectCategorie

export type MaquettePaletteMode = 'category' | 'extracted' | 'custom'

/** Item d'une carte univers (5 par maquette). */
export interface MaquetteUniversItem {
  cat: string   // ex: "Spécialité maison"
  name: string  // ex: "Pains au levain"
  desc: string  // 1–2 lignes
}

/** Item d'une valeur (4 par maquette). */
export interface MaquetteValeurItem {
  title: string
  desc: string
}

/**
 * Avis affiché dans la maquette.
 * Snapshot autonome : permet l'édition manuelle d'un texte sans casser
 * la source `prospects.google_reviews`. `edited = true` flagge un override.
 *
 * `source_id` : référence Google (`places/X/reviews/Y`) si l'avis vient d'un
 * avis Google sélectionné. Permet de retrouver l'avis original pour
 * "Réinitialiser le texte". Absent pour les avis ajoutés manuellement
 * (futur — pas implémenté en V1).
 */
export interface MaquetteAvisItem {
  source_id?: string
  author: string
  author_initial?: string
  rating: number       // 1..5
  text: string
  date: string | null  // ISO ou date FR brute, à formatter au render
  edited: boolean
}

/**
 * Avis Google brut, tel que stocké dans `prospects.google_reviews`.
 * Format aligné sur Google Places API v1 (champ `reviews`).
 *
 * Convention V1 : on ne persiste que les avis ayant un `text` non vide
 * (un avis "5 étoiles sans commentaire" est visuellement inutile dans
 * la maquette). Le filtrage est fait à la normalisation, pas au render.
 *
 * On NE STOCKE PAS la chaîne relative ("il y a 2 mois") : elle vieillit
 * mal en BDD. À la place, on garde `publish_time` (ISO immuable) et on
 * calcule la chaîne relative dynamiquement au render via `date-fns`.
 */
export interface GoogleReviewItem {
  name: string                    // "places/X/reviews/Y"
  rating: number                  // 1..5
  text: string                    // non vide (filtré à la normalisation)
  author_name: string
  author_initial: string | null
  publish_time: string | null     // ISO
}

// ─── Photos : nouveau modèle pool + assignations ────────────────────────────
//
// Modèle introduit en Session 3.0 pour supporter la gestion humaine des
// placements (drag & drop dans l'éditeur) + l'upload de photos personnelles.
// Remplace progressivement l'ancien trio `hero_photo_url` / `histoire_photo_url`
// / `univers_photos_urls`. Cf. CLEANUP-TODO.md.

export type MaquettePhotoSource = 'google' | 'upload'

/** Une photo dans le pool d'une maquette. */
export interface MaquettePhotoEntry {
  /** UUID local stable, sert au drag & drop et aux assignations. */
  id: string
  source: MaquettePhotoSource
  /**
   * Selon `source` :
   *   - 'google' : ref Places API (`places/X/photos/Y`)
   *   - 'upload' : URL absolue Supabase Storage (bucket `maquettes-assets`)
   */
  reference: string
  /** Légende optionnelle (édition future). */
  caption?: string
  /** ISO. Présent uniquement sur les photos uploadées (cf. brief 3.0). */
  uploaded_at?: string
}

export type MaquettePhotoSlot =
  | 'hero' | 'histoire'
  | 'univers_1' | 'univers_2' | 'univers_3' | 'univers_4' | 'univers_5'

/**
 * Assignation slot → photo.
 *
 * NOTE pour le drag & drop futur : la même `photo_id` PEUT légitimement
 * apparaître dans plusieurs assignations (cas d'une photo "signature" qu'on
 * veut afficher sur Hero ET Histoire, par exemple). À la migration legacy
 * en revanche, on désassigne les doublons (cf. `migrateLegacyPhotos`).
 */
export interface MaquettePhotoAssignment {
  slot: MaquettePhotoSlot
  photo_id: string | null
}

/**
 * Overrides des infos pratiques affichées dans la maquette publiée.
 *
 * Sémantique par champ :
 *   - clé absente (undefined)  → utiliser la valeur du prospect
 *   - clé présente avec null   → masquer cette info sur la maquette
 *   - clé présente avec string → override avec cette valeur custom
 */
export interface MaquetteInfosOverrides {
  adresse?: string | null
  telephone?: string | null
  email?: string | null
}

export interface Maquette {
  id: string
  created_at: string
  updated_at: string

  prospect_id: string
  slug: string
  template_variant: MaquetteTemplateVariant
  published: boolean
  published_at: string | null

  infos_overrides: MaquetteInfosOverrides | null

  hero_eyebrow: string | null
  hero_title: string | null
  hero_lead: string | null
  hero_quote: string | null
  hero_quote_author: string | null
  histoire_title: string | null
  histoire_lead: string | null
  texte_presentation: string | null
  annee_creation: number | null
  /** Suptitle de la section "Nos créations" — éditable depuis l'éditeur. */
  univers_section_suptitle: string | null
  /** Titre de la section "Nos créations" (markdown italique `*mot*`). */
  univers_section_title: string | null
  /** Paragraphe descriptif de la section "Nos créations". */
  univers_section_intro: string | null
  cta_banner_title: string | null
  cta_banner_text: string | null

  // ── Lexique global éditable (extension presets métier) ──
  // Tous nullable : fallback sur `template.defaults.*` côté rendu si NULL
  // (couvre les maquettes pré-migration ainsi que les nouveaux champs vidés
  // manuellement par l'admin).
  /** Sous-titre affiché sous le nom du commerce (header + footer). */
  brand_tagline: string | null
  /** Label de nav vers #histoire (header + footer). */
  nav_histoire_label: string | null
  /** Label de nav vers #univers (header + footer). */
  nav_univers_label: string | null
  /** Texte du bouton Hero primaire. */
  hero_cta_primaire: string | null
  /** Suptitle de la section Histoire (sectionEyebrow). */
  histoire_suptitle: string | null
  /** Titre de la section Avis (markdown italique `*mot*`). */
  avis_section_titre: string | null
  /** H4 de la colonne d'ancrage du Footer. */
  footer_colonne_label: string | null

  logo_url: string | null
  logo_initial: string | null
  palette_mode: MaquettePaletteMode
  palette_primary: string | null
  palette_accent: string | null

  /** @deprecated Remplacé par available_photos + photo_assignments. Cf. CLEANUP-TODO.md. */
  hero_photo_url: string | null
  /** @deprecated Cf. CLEANUP-TODO.md. */
  histoire_photo_url: string | null
  /** @deprecated Cf. CLEANUP-TODO.md. */
  univers_photos_urls: string[] | null

  /** Pool de toutes les photos disponibles (Google + uploads). */
  available_photos: MaquettePhotoEntry[] | null
  /** Assignation slot → photo. 7 slots : hero, histoire, univers_1..5. */
  photo_assignments: MaquettePhotoAssignment[] | null

  univers_items: MaquetteUniversItem[] | null
  valeurs_items: MaquetteValeurItem[] | null
  avis_items: MaquetteAvisItem[] | null
}

export const MAQUETTE_PHOTO_SLOTS: readonly MaquettePhotoSlot[] = [
  'hero', 'histoire',
  'univers_1', 'univers_2', 'univers_3', 'univers_4', 'univers_5',
] as const

// ─── Emails de prospection (Resend + tracking) ──────────────────────────────

/**
 * Variante de communication choisie selon l'état web du prospect.
 *
 *   - 'sans-site' : pas de site (ou compte réseau social seul)
 *   - 'avec-site' : vrai site OU plateforme générique low-cost
 *
 * Logique de sélection centralisée dans `lib/web-variant/getProspectWebVariant()`.
 * Partagée entre le générateur d'affiche A4 et le système d'envoi d'emails.
 */
export type WebVariant = 'sans-site' | 'avec-site'

/**
 * Statut d'un envoi, en cascade avec les events Resend :
 *   pending  → email créé en BDD, pas encore envoyé à Resend
 *   sent     → Resend a accepté la requête (resend_id présent)
 *   delivered → webhook email.delivered
 *   opened   → webhook email.opened (au moins 1 fois)
 *   clicked  → webhook email.clicked (au moins 1 fois — opened reste true)
 *   bounced  → adresse rejetée (hard ou soft bounce)
 *   complained → marqué spam par le destinataire
 */
export type EmailSendStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'

/**
 * Template d'une campagne. V1 : 1 seule campagne `is_default = true` à la
 * fois (index unique partiel garantit l'unicité).
 *
 * Le HTML/text contient des placeholders Mustache-like `{{var}}` (cf. seed
 * `seed_default_email_campaign.sql` pour la liste exhaustive). Ils sont
 * substitués au moment de l'envoi par le service de rendu (Phase 5).
 */
export interface EmailCampaign {
  id: string
  created_at: string
  updated_at: string
  name: string

  variant_sans_site_subject: string
  variant_sans_site_body_html: string
  variant_sans_site_body_text: string

  variant_avec_site_subject: string
  variant_avec_site_body_html: string
  variant_avec_site_body_text: string

  is_default: boolean
}

/**
 * Trace d'un email envoyé. On stocke le contenu FINAL après substitution
 * (subject + body), pas le template — l'historique reste lisible même si
 * la campagne est éditée plus tard.
 */
export interface EmailSend {
  id: string
  created_at: string

  prospect_id: string
  campaign_id: string | null

  variant: WebVariant

  to_email: string
  from_email: string
  subject: string
  body_html: string
  body_text: string

  preview_image_url: string | null
  maquette_url: string | null

  resend_id: string | null
  status: EmailSendStatus

  sent_at: string | null
  delivered_at: string | null
  first_opened_at: string | null
  last_opened_at: string | null
  open_count: number
  first_clicked_at: string | null
  click_count: number
  bounced_at: string | null
  bounce_reason: string | null
  unsubscribed_at: string | null

  /**
   * `true` quand l'envoi a été déclenché via le bouton « Envoyer un test »
   * (destinataire @sigweb.fr forcé par `toOverride`). Permet d'afficher
   * un badge TEST sur la carte timeline et de filtrer ces envois côté
   * dashboard pour ne pas polluer les métriques d'envois réels.
   */
  is_test: boolean
}

// ─── Pilotage commercial CRM v3 — Timeline (Phase 2) ─────────────────────────

/**
 * Types d'événements stockés dans `prospect_timeline_events`. Les events
 * email ne sont PAS dans cette liste : ils sont dérivés à la volée de
 * `email_sends` par l'aggregator (cf. `lib/crm/timeline-aggregator.ts`).
 */
export type ProspectTimelineEventType =
  // Phase 2
  | 'status_changed'
  // Phase 3
  | 'maquette_visited'
  // Phase 4
  | 'phone_call'
  | 'affiche_deposited'
  | 'terrain_visit'
  | 'dm_sent'
  | 'meeting_scheduled'
  | 'note'

export type ProspectTimelineEventSource = 'automatic' | 'manual'

/**
 * Ligne brute de `prospect_timeline_events`. Le `metadata` est typé en
 * `unknown` ici — chaque code consommateur (composant, server action)
 * narrowe le type selon le `event_type` qu'il manipule.
 */
export interface ProspectTimelineEvent {
  id: string
  created_at: string
  prospect_id: string
  event_type: ProspectTimelineEventType
  event_subtype: string | null
  source: ProspectTimelineEventSource
  occurred_at: string
  metadata: unknown
  notes: string | null
  created_by_user_id: string | null
  is_test: boolean
}

/**
 * Metadata d'un event `status_changed` — l'ancien et le nouveau statut
 * sont conservés pour reconstituer l'historique complet sans avoir à
 * joindre des lignes consécutives.
 */
export interface StatusChangedMetadata {
  from: ProspectStatut | null  // null = initialisation / pas d'ancien connu
  to: ProspectStatut
}

// ─── Tracking visites maquette (CRM v3 Phase 3) ──────────────────────────────

/**
 * Source du trafic vers une page `/demos/{slug}`, derivee du parametre
 * `?src=...` dans l'URL. Whitelist stricte cote BDD (CHECK constraint).
 */
export type MaquetteVisitSource =
  | 'affiche'      // QR code de l'affiche A4 deposee en physique
  | 'email'        // Lien dans l'email Resend envoye au VRAI prospect
  | 'email-test'   // Lien dans l'email Resend envoye en MODE TEST a l'admin
                   // (bouton 'Envoyer un test' avec toOverride). Force
                   // is_test=true cote route handler → ces visites ne
                   // polluent ni l'encadre stats ni la timeline.
  | 'carte'        // QR de la carte de visite (capture preventive)
  | 'direct'       // Aucun `?src` ou trafic direct (defaut)
  | 'other'        // `?src` present avec valeur non whitelistee → normalise

/**
 * Resume du user agent — on NE conserve PAS le UA brut (quasi-identifiant).
 * `null` si non detectable (UA absent ou trop bizarre).
 */
export type MaquetteVisitUserAgent = 'mobile' | 'desktop' | 'tablet'

/**
 * Ligne brute de `maquette_visits`. Une ligne = une visite (page load
 * unique). La deduplication court terme (rafraichissements) se fait
 * cote event timeline via une fenetre de 30 min.
 */
export interface MaquetteVisit {
  id: string
  created_at: string
  slug: string
  prospect_id: string | null
  source: MaquetteVisitSource
  ip_hash: string
  user_agent_summary: MaquetteVisitUserAgent | null
  duration_seconds: number | null
  referrer: string | null
  is_test: boolean
}

/**
 * Metadata d'un event timeline `maquette_visited`. L'event est cree au
 * 1er passage puis mis a jour (UPSERT) a chaque nouvelle visite dans
 * une fenetre de 30 min (3 refresh ≠ 3 events).
 *
 * Si la 4eme visite arrive plus de 30 min apres la 3eme, un NOUVEL
 * event est cree au lieu de mettre a jour l'ancien.
 */
export interface MaquetteVisitedMetadata {
  visit_count: number
  first_visit_at: string  // ISO — premiere visite de ce groupe
  last_visit_at: string   // ISO — derniere visite de ce groupe (= occurred_at)
  /** Decompte des visites par source dans ce groupe. */
  sources: Partial<Record<MaquetteVisitSource, number>>
  /** Slug de la maquette concernee (utile cote rendu UI). */
  slug: string
}

// ─── Événements manuels timeline (CRM v3 Phase 4) ─────────────────────────────

/**
 * Sous-type d'un événement `phone_call` — résultat de l'appel.
 * - `sans_reponse` : a sonné, pas de décroché
 * - `parle` : conversation aboutie
 * - `message_vocal` : laissé un message sur répondeur
 */
export type PhoneCallSubtype = 'sans_reponse' | 'parle' | 'message_vocal'

/**
 * Plateforme sur laquelle un DM `dm_sent` a été envoyé. Restreint aux 3
 * réseaux utilisés en prospection : Facebook + Instagram pour les commerces
 * locaux, LinkedIn pour les artisans/professions liberales avec page pro.
 */
export type DmSentPlatform = 'facebook' | 'instagram' | 'linkedin'

export interface DmSentMetadata {
  plateforme: DmSentPlatform
}

/**
 * Metadata d'un event `meeting_scheduled` — date du RDV programmé.
 * Le lieu (cabinet / chez le commerçant / Zoom / etc.) reste libre dans
 * `notes` pour ne pas multiplier les champs au moment de la saisie.
 */
export interface MeetingScheduledMetadata {
  date_rdv: string  // ISO
}

/**
 * Types d'events Phase 4 qui se saisissent à la main via la modale/
 * bottom-sheet « Ajouter un événement ». `status_changed` et
 * `maquette_visited` ne sont PAS dans cette liste — ils sont créés
 * automatiquement par le système.
 */
export type ManualTimelineEventType =
  | 'phone_call'
  | 'affiche_deposited'
  | 'terrain_visit'
  | 'dm_sent'
  | 'meeting_scheduled'
  | 'note'
