import type { Prospect } from '@/types'
import { CANAL_LABELS, CATEGORIE_LABELS, displayCategorie, STATUT_LABELS } from './constants'

const SEPARATOR = ';'

const COLUMNS: { header: string; getter: (p: Prospect) => string | null | undefined }[] = [
  { header: 'Nom du commerce', getter: (p) => p.nom_commerce },
  { header: 'Catégorie', getter: (p) => displayCategorie(p) },
  { header: 'Catégorie interne', getter: (p) => CATEGORIE_LABELS[p.categorie] },
  { header: 'Adresse', getter: (p) => p.adresse },
  { header: 'Code postal', getter: (p) => p.code_postal },
  { header: 'Ville', getter: (p) => p.ville },
  { header: 'Distance (km)', getter: (p) => (p.distance_km != null ? String(p.distance_km) : '') },
  { header: 'Téléphone', getter: (p) => p.telephone },
  { header: 'Email', getter: (p) => p.email },
  { header: 'Site existant', getter: (p) => p.site_existant_url },
  { header: 'Instagram', getter: (p) => p.instagram_url },
  { header: 'Facebook', getter: (p) => p.facebook_url },
  { header: 'Score', getter: (p) => (p.score != null ? String(p.score) : '') },
  { header: 'Canal', getter: (p) => CANAL_LABELS[p.canal] },
  { header: 'Statut', getter: (p) => STATUT_LABELS[p.statut] },
  { header: 'Notes', getter: (p) => p.notes },
  { header: 'Dernier contact', getter: (p) => p.date_dernier_contact },
  { header: 'Relance prévue', getter: (p) => p.date_relance_prevue },
  { header: 'Note Google', getter: (p) => (p.google_rating != null ? String(p.google_rating) : '') },
  { header: 'Avis Google', getter: (p) => (p.google_reviews_count != null ? String(p.google_reviews_count) : '') },
  { header: 'Statut Google', getter: (p) => p.google_business_status },
  { header: 'Type Google', getter: (p) => p.google_primary_type_display },
  { header: 'Lien Google Maps', getter: (p) => p.google_maps_url },
  { header: 'Latitude', getter: (p) => (p.latitude != null ? String(p.latitude) : '') },
  { header: 'Longitude', getter: (p) => (p.longitude != null ? String(p.longitude) : '') },
  { header: 'Dernier enrichissement', getter: (p) => p.last_enriched_at },
  { header: 'Créé le', getter: (p) => p.created_at },
  { header: 'Modifié le', getter: (p) => p.updated_at },
]

/**
 * Échappe une valeur pour CSV : entoure de guillemets si elle contient
 * un séparateur, un guillemet ou un saut de ligne ; double les guillemets
 * internes. Toute valeur null/undefined → chaîne vide.
 */
function escapeCsv(value: string | null | undefined): string {
  if (value == null) return ''
  const s = String(value)
  if (s.includes(SEPARATOR) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function buildProspectsCsv(prospects: Prospect[]): string {
  const lines: string[] = []
  lines.push(COLUMNS.map((c) => escapeCsv(c.header)).join(SEPARATOR))
  for (const p of prospects) {
    lines.push(COLUMNS.map((c) => escapeCsv(c.getter(p))).join(SEPARATOR))
  }
  // BOM UTF-8 pour que Excel détecte correctement l'encodage et les accents.
  return '﻿' + lines.join('\r\n')
}

export function buildExportFilename(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `prospects_sigweb_${yyyy}-${mm}-${dd}.csv`
}
