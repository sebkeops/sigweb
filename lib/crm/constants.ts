import type { ProspectCanal, ProspectCategorie, ProspectSource, ProspectStatut } from '@/types'

type BadgeVariant = 'green' | 'orange' | 'gray' | 'red' | 'blue' | 'purple' | 'yellow' | 'indigo' | 'dark'

/**
 * Familles éditoriales (regroupement du select admin).
 *
 * L'ordre du record définit l'ordre d'affichage des `<optgroup>` dans le
 * select. `Autre` n'est pas dans une famille — il est rendu hors groupe à
 * la fin pour signaler son statut de fallback.
 */
export const CATEGORIE_FAMILIES = {
  bouche: {
    label: 'Commerces de bouche',
    ids: [
      'boulangerie', 'boucherie', 'restaurant', 'pizzeria',
      'primeur', 'fromager', 'caviste',
      'bar_cafe', 'traiteur', 'chocolatier', 'epicerie_fine',
    ] satisfies ProspectCategorie[],
  },
  batiment: {
    label: 'Bâtiment & artisanat',
    ids: [
      'macon', 'couvreur', 'carreleur',
      'menuisier', 'plombier', 'electricien', 'peintre', 'paysagiste',
      'piscinier',
    ] satisfies ProspectCategorie[],
  },
  services_personne: {
    label: 'Services à la personne',
    ids: [
      'coiffeur', 'esthetique', 'kine',
      'osteopathe', 'praticien_bien_etre', 'cabinet',
    ] satisfies ProspectCategorie[],
  },
  commerces_services: {
    label: 'Commerces & services',
    ids: [
      'fleuriste', 'bijoutier', 'librairie', 'garagiste', 'photographe',
    ] satisfies ProspectCategorie[],
  },
  hebergement: {
    label: 'Hébergement',
    ids: ['gite', 'camping'] satisfies ProspectCategorie[],
  },
  autre: {
    label: 'Autre',
    ids: ['autre'] satisfies ProspectCategorie[],
  },
} as const

/**
 * Liste à plat de toutes les options de catégorie (label + value).
 *
 * Sert de source pour `CATEGORIE_LABELS` (mapping id → label affichable),
 * indépendamment du regroupement par famille. Contient les 34 catégories,
 * y compris les 16 stubs V2 non encore exposés dans le select admin.
 */
export const CATEGORIE_OPTIONS: { value: ProspectCategorie; label: string }[] = [
  // V1 — Famille 2
  { value: 'boulangerie', label: 'Boulangerie' },
  { value: 'boucherie', label: 'Boucherie' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'pizzeria', label: 'Pizzeria' },
  // V1 — Commerces de bouche additionnels
  { value: 'primeur', label: 'Primeur' },
  { value: 'fromager', label: 'Fromager' },
  { value: 'caviste', label: 'Caviste' },
  // V1 — Services à la personne
  { value: 'coiffeur', label: 'Coiffeur' },
  { value: 'esthetique', label: 'Esthétique' },
  { value: 'kine', label: 'Kiné' },
  { value: 'cabinet', label: 'Cabinet' },
  // V1 — Bâtiment & artisanat
  { value: 'menuisier', label: 'Menuisier' },
  { value: 'plombier', label: 'Plombier' },
  { value: 'electricien', label: 'Électricien' },
  { value: 'peintre', label: 'Peintre' },
  { value: 'paysagiste', label: 'Paysagiste' },
  // V1 — Commerces & services
  { value: 'photographe', label: 'Photographe' },
  // V2 — Commerces de bouche additionnels (Annexe A)
  { value: 'bar_cafe', label: 'Bar-Café' },
  { value: 'traiteur', label: 'Traiteur' },
  { value: 'chocolatier', label: 'Chocolatier' },
  { value: 'epicerie_fine', label: 'Épicerie fine' },
  // V2 — Bâtiment & artisanat additionnels (Annexe B)
  { value: 'macon', label: 'Maçon' },
  { value: 'couvreur', label: 'Couvreur' },
  { value: 'carreleur', label: 'Carreleur' },
  { value: 'piscinier', label: 'Piscinier' },
  // V2 — Services à la personne additionnels (Annexe C)
  { value: 'osteopathe', label: 'Ostéopathe' },
  { value: 'praticien_bien_etre', label: 'Praticien bien-être' },
  // V2 — Commerces & services additionnels (Annexe D)
  { value: 'fleuriste', label: 'Fleuriste' },
  { value: 'bijoutier', label: 'Bijoutier' },
  { value: 'librairie', label: 'Librairie' },
  { value: 'garagiste', label: 'Garagiste' },
  // V2 — Hébergement (Annexe E)
  { value: 'gite', label: 'Gîte' },
  { value: 'camping', label: 'Camping' },
  // Fallback
  { value: 'autre', label: 'Autre' },
]

/**
 * Whitelist des catégories exposées dans les selects admin (saisie prospect,
 * filtres, sourcing).
 *
 * Tant qu'un preset n'est pas finalisé (cf. brief "Consolidation finale",
 * annexes A → F en cours d'intégration), son id est dans le type
 * `ProspectCategorie` et dans la BDD (CHECK constraint étendu) mais pas
 * dans cette liste — l'admin ne peut donc pas saisir un prospect avec un
 * id "stub".
 *
 * À chaque livraison d'annexe, ajouter ici les ids correspondants.
 */
export const CATEGORIES_EXPOSED_IN_ADMIN: ReadonlySet<ProspectCategorie> = new Set([
  // V1 — Famille 2
  'boulangerie', 'boucherie', 'restaurant', 'pizzeria',
  // V1 — Commerces de bouche additionnels
  'primeur', 'fromager', 'caviste',
  // V1 — Services à la personne
  'coiffeur', 'esthetique', 'kine', 'cabinet',
  // V1 — Bâtiment & artisanat
  'menuisier', 'plombier', 'electricien', 'peintre', 'paysagiste',
  // V1 — Commerces & services
  'photographe',
  // V2 — Commerces de bouche (Annexe A intégrée)
  'bar_cafe', 'traiteur', 'chocolatier', 'epicerie_fine',
  // V2 — Bâtiment & artisanat (Annexe B intégrée)
  'macon', 'couvreur', 'carreleur', 'piscinier',
  // V2 — Commerces & services (Annexe D intégrée)
  'fleuriste', 'bijoutier', 'librairie', 'garagiste',
  // V2 — Services à la personne (Annexe C intégrée)
  'osteopathe', 'praticien_bien_etre',
  // V2 — Hébergement (Annexe E intégrée — famille apparaît pour la 1re fois)
  'gite', 'camping',
  // Fallback
  'autre',
])

export const CANAL_OPTIONS: { value: ProspectCanal; label: string }[] = [
  { value: 'a_definir', label: 'À définir' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'email', label: 'Email' },
  { value: 'reseaux', label: 'Réseaux sociaux' },
  { value: 'telephone', label: 'Téléphone' },
  { value: 'ecarte', label: 'Écarté' },
]

export const STATUT_OPTIONS: { value: ProspectStatut; label: string }[] = [
  { value: 'a_qualifier', label: 'À qualifier' },
  { value: 'qualifie', label: 'Qualifié' },
  { value: 'maquette_prete', label: 'Maquette prête' },
  { value: 'contacte', label: 'Contacté' },
  { value: 'relance_1', label: 'Relance 1' },
  { value: 'relance_2', label: 'Relance 2' },
  { value: 'relance_3', label: 'Relance 3' },
  { value: 'repondu', label: 'A répondu' },
  { value: 'rdv_pris', label: 'RDV pris' },
  { value: 'devis_envoye', label: 'Devis envoyé' },
  { value: 'signe', label: 'Signé' },
  { value: 'perdu', label: 'Perdu' },
  { value: 'ecarte', label: 'Écarté' },
]

export const CATEGORIE_LABELS: Record<ProspectCategorie, string> = Object.fromEntries(
  CATEGORIE_OPTIONS.map((o) => [o.value, o.label])
) as Record<ProspectCategorie, string>

/**
 * Renvoie les familles à afficher dans le select admin, avec leurs options
 * filtrées par `CATEGORIES_EXPOSED_IN_ADMIN`. Les familles totalement vides
 * (toutes leurs catégories non exposées) sont omises.
 *
 * Utilisé pour rendre un `<select>` avec `<optgroup>` côté formulaires
 * admin (ProspectForm, ProspectFilters, SourcingPage).
 */
export function getExposedCategoriesByFamily(): Array<{
  family: string
  label: string
  options: { value: ProspectCategorie; label: string }[]
}> {
  return (Object.entries(CATEGORIE_FAMILIES) as Array<
    [keyof typeof CATEGORIE_FAMILIES, (typeof CATEGORIE_FAMILIES)[keyof typeof CATEGORIE_FAMILIES]]
  >)
    .map(([family, { label, ids }]) => ({
      family,
      label,
      options: ids
        .filter((id) => CATEGORIES_EXPOSED_IN_ADMIN.has(id))
        .map((id) => ({ value: id, label: CATEGORIE_LABELS[id] })),
    }))
    .filter((g) => g.options.length > 0)
}

export const CANAL_LABELS: Record<ProspectCanal, string> = Object.fromEntries(
  CANAL_OPTIONS.map((o) => [o.value, o.label])
) as Record<ProspectCanal, string>

export const STATUT_LABELS: Record<ProspectStatut, string> = Object.fromEntries(
  STATUT_OPTIONS.map((o) => [o.value, o.label])
) as Record<ProspectStatut, string>

export const CANAL_BADGE: Record<ProspectCanal, BadgeVariant> = {
  a_definir: 'gray',
  terrain: 'green',
  email: 'blue',
  reseaux: 'purple',
  telephone: 'orange',
  ecarte: 'red',
}

export const STATUT_BADGE: Record<ProspectStatut, BadgeVariant> = {
  a_qualifier: 'gray',
  qualifie: 'blue',
  maquette_prete: 'purple',
  contacte: 'yellow',
  relance_1: 'orange',
  relance_2: 'orange',
  relance_3: 'orange',
  repondu: 'indigo',
  rdv_pris: 'indigo',
  devis_envoye: 'indigo',
  signe: 'green',
  perdu: 'red',
  ecarte: 'dark',
}

export const CATEGORIE_BADGE: BadgeVariant = 'gray'

export const SOURCE_OPTIONS: { value: ProspectSource; label: string }[] = [
  { value: 'manuel', label: 'Saisi manuellement' },
  { value: 'enrichissement', label: 'Enrichissement Google' },
  { value: 'sourcing', label: 'Sourcing batch' },
]

export const SOURCE_LABELS: Record<ProspectSource, string> = Object.fromEntries(
  SOURCE_OPTIONS.map((o) => [o.value, o.label])
) as Record<ProspectSource, string>

export const SOURCE_ICONS: Record<ProspectSource, string> = {
  manuel: '🖋️',
  enrichissement: '🔍',
  sourcing: '🌐',
}

/**
 * Libellé de catégorie à afficher pour un prospect :
 * - utilise le label localisé Google (ex: "Magasin de nouveautés") si la
 *   catégorie interne est tombée sur 'autre' ET qu'on a un libellé Google,
 * - sinon utilise le label de notre enum CRM.
 */
export function displayCategorie(p: {
  categorie: ProspectCategorie
  google_primary_type_display?: string | null
}): string {
  if (p.categorie === 'autre' && p.google_primary_type_display) {
    return p.google_primary_type_display
  }
  return CATEGORIE_LABELS[p.categorie]
}
