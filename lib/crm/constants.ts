import type { ProspectCanal, ProspectCategorie, ProspectSource, ProspectStatut } from '@/types'

type BadgeVariant = 'green' | 'orange' | 'gray' | 'red' | 'blue' | 'purple' | 'yellow' | 'indigo' | 'dark'

export const CATEGORIE_OPTIONS: { value: ProspectCategorie; label: string }[] = [
  { value: 'boulangerie', label: 'Boulangerie' },
  { value: 'boucherie', label: 'Boucherie' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'pizzeria', label: 'Pizzeria' },
  { value: 'primeur', label: 'Primeur' },
  { value: 'fromager', label: 'Fromager' },
  { value: 'caviste', label: 'Caviste' },
  { value: 'coiffeur', label: 'Coiffeur' },
  { value: 'esthetique', label: 'Esthétique' },
  { value: 'kine', label: 'Kiné' },
  { value: 'cabinet', label: 'Cabinet' },
  { value: 'menuisier', label: 'Menuisier' },
  { value: 'plombier', label: 'Plombier' },
  { value: 'electricien', label: 'Électricien' },
  { value: 'peintre', label: 'Peintre' },
  { value: 'paysagiste', label: 'Paysagiste' },
  { value: 'photographe', label: 'Photographe' },
  { value: 'autre', label: 'Autre' },
]

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
