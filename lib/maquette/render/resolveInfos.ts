import type { MaquetteInfosOverrides, Prospect } from '@/types'

export interface ResolvedInfos {
  /** Ligne d'adresse complète à afficher. `null` = masquer / absent. */
  adresseLine: string | null
  /** Téléphone affiché tel quel. `null` = masquer / absent. */
  telephone: string | null
  /** Email affiché tel quel. `null` = masquer / absent. */
  email: string | null
}

/**
 * Résout les infos pratiques effectives à afficher dans la maquette.
 *
 * Sémantique des overrides (cf. `MaquetteInfosOverrides`) :
 *   - clé absente               → utiliser la valeur du prospect
 *   - clé présente avec null    → masquer (retourne null ici)
 *   - clé présente avec string  → utiliser cette valeur
 *
 * Pour l'adresse :
 *   - sans override : on compose `adresse, code_postal ville` depuis le prospect
 *   - avec override : on retourne la string custom telle quelle (l'admin
 *     a la responsabilité d'inclure code postal + ville s'il le souhaite)
 */
export function resolveInfos(
  prospect: Pick<Prospect, 'adresse' | 'code_postal' | 'ville' | 'telephone' | 'email'>,
  overrides: MaquetteInfosOverrides | null | undefined
): ResolvedInfos {
  const o = overrides ?? {}

  let adresseLine: string | null
  if ('adresse' in o) {
    adresseLine = o.adresse ?? null
  } else {
    const parts = [
      prospect.adresse,
      [prospect.code_postal, prospect.ville].filter(Boolean).join(' '),
    ].filter((s) => s && s.toString().trim().length > 0)
    adresseLine = parts.length > 0 ? parts.join(', ') : null
  }

  const telephone = 'telephone' in o ? (o.telephone ?? null) : prospect.telephone
  const email = 'email' in o ? (o.email ?? null) : prospect.email

  return { adresseLine, telephone, email }
}
