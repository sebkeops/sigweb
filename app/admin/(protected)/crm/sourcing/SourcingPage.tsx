'use client'

import UnifiedSourcingForm from './UnifiedSourcingForm'

interface Props {
  baseCoords: { lat: number; lng: number } | null
}

/**
 * Page sourcing unifiée Google + Sirene (chantier Sirene/PageSpeed,
 * fusion UI suite à demande utilisateur). La logique de form est dans
 * UnifiedSourcingForm — ce wrapper ne fait que transmettre les coords.
 */
export default function SourcingPage({ baseCoords }: Props) {
  return <UnifiedSourcingForm baseCoords={baseCoords} />
}
