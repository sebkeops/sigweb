import type { EnrichedPlaceData } from '@/lib/google-places'
import type { Prospect } from '@/types'

/**
 * Champs exposés au formulaire pour pré-remplissage. Reste un sous-ensemble
 * de Prospect, conforme à ce que ProspectForm attend.
 */
export function enrichedToFormDefaults(data: EnrichedPlaceData): Partial<Prospect> {
  return {
    nom_commerce: data.name,
    categorie: data.suggestedCategorie,
    adresse: data.formattedAddress,
    ville: data.city,
    code_postal: data.postalCode,
    distance_km: data.distanceKm,
    telephone: data.phoneNumber,
    site_existant_url: data.website,
    // Le libellé Google sert d'aide visuelle dans le formulaire (pas un input
    // soumis), pour expliciter pourquoi le select reste sur "Autre" quand le
    // type Google n'est pas mappé dans notre enum CRM.
    google_primary_type_display: data.primaryTypeDisplay,
  }
}

/**
 * Champs google_* + lat/lon + last_enriched_at à insérer/mettre à jour
 * en base. Source de vérité : la donnée Google fraîche (récupérée par
 * une server action qui a refait un Place Details).
 *
 * `google_reviews` : snapshot des avis détaillés (max 5, filtrés sur
 * texte non vide à la normalisation). `null` si aucun avis exploitable
 * — l'UI maquette gérera l'affichage dégradé.
 */
export function enrichedToGoogleDbFields(data: EnrichedPlaceData) {
  return {
    google_place_id: data.placeId,
    google_rating: data.rating,
    google_reviews_count: data.userRatingCount,
    google_business_status: data.businessStatus,
    google_categories: data.types.length > 0 ? data.types : null,
    google_opening_hours: data.openingHours,
    google_photo_refs: data.photoRefs.length > 0 ? data.photoRefs : null,
    google_maps_url: data.googleMapsUrl,
    google_primary_type_display: data.primaryTypeDisplay,
    google_reviews: data.reviews.length > 0 ? data.reviews : null,
    latitude: data.latitude,
    longitude: data.longitude,
    last_enriched_at: new Date().toISOString(),
  }
}
