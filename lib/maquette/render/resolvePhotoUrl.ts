/**
 * Convention de stockage des photos d'une maquette :
 *
 *   - Une photo Google est stockée comme `places/X/photos/Y` (ref API).
 *     Au render, on la sert via le proxy public `/api/demos/photo?ref=...`,
 *     qui stream l'image côté serveur sans exposer la clé Google.
 *
 *   - Une photo uploadée manuellement est stockée comme URL absolue
 *     (`https://...supabase.co/storage/v1/object/public/maquettes-assets/...`)
 *     ou comme URL relative — dans les deux cas on la sert telle quelle.
 *
 * Le distinguo se fait sur le préfixe `places/`. C'est volontaire : pas de
 * colonne supplémentaire, pas de discriminator, juste une convention claire.
 *
 * Si un futur besoin impose un autre type de ref (ex : Cloudinary), il faudra
 * étendre cette fonction — pas un autre endroit.
 */

export interface ResolvePhotoOptions {
  /** Largeur cible pour le resize côté Google (40–1600). Défaut : 1200. */
  width?: number
}

export function resolvePhotoUrl(
  refOrUrl: string | null | undefined,
  opts: ResolvePhotoOptions = {}
): string | null {
  if (!refOrUrl) return null

  const trimmed = refOrUrl.trim()
  if (trimmed.length === 0) return null

  // Photo Google : on passe par le proxy public.
  if (trimmed.startsWith('places/')) {
    const w = opts.width ?? 1200
    const safeWidth = Math.min(Math.max(Math.floor(w), 40), 1600)
    return `/api/demos/photo?ref=${encodeURIComponent(trimmed)}&w=${safeWidth}`
  }

  // URL absolue ou relative : pass-through.
  return trimmed
}
