import { z } from 'zod'

/**
 * Schémas Zod pour valider à RUNTIME tout ce qui s'écrit dans
 * `maquettes.available_photos` et `maquettes.photo_assignments`.
 *
 * Pourquoi : les colonnes sont en JSONB sans CHECK constraint en BDD
 * (volontaire, pour rester souple). TypeScript ne valide qu'à la compilation.
 * Le seul garde-fou contre une donnée corrompue est ces schémas — à appeler
 * AVANT tout INSERT/UPDATE qui touche ces colonnes.
 */

export const photoSourceSchema = z.enum(['google', 'upload'])

export const photoSlotSchema = z.enum([
  'hero',
  'histoire',
  'univers_1',
  'univers_2',
  'univers_3',
  'univers_4',
  'univers_5',
])

export const photoEntrySchema = z.object({
  id: z.string().uuid(),
  source: photoSourceSchema,
  reference: z.string().min(1).max(2048),
  caption: z.string().max(280).optional(),
  uploaded_at: z.string().datetime({ offset: true }).optional(),
})

export const photoAssignmentSchema = z.object({
  slot: photoSlotSchema,
  photo_id: z.string().uuid().nullable(),
})

export const availablePhotosSchema = z.array(photoEntrySchema)

/**
 * Les 7 slots DOIVENT être présents (même avec photo_id=null) et chaque slot
 * apparaît exactement une fois. C'est ce qui garantit que le rendu de la
 * maquette ne tombe jamais sur un slot manquant.
 */
export const photoAssignmentsSchema = z.array(photoAssignmentSchema)
  .length(7)
  .superRefine((items, ctx) => {
    const seen = new Set<string>()
    for (const a of items) {
      if (seen.has(a.slot)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `slot dupliqué: ${a.slot}`,
        })
      }
      seen.add(a.slot)
    }
    const expected = ['hero', 'histoire', 'univers_1', 'univers_2', 'univers_3', 'univers_4', 'univers_5']
    for (const exp of expected) {
      if (!seen.has(exp)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `slot manquant: ${exp}`,
        })
      }
    }
  })

/**
 * Validation croisée pool ↔ assignments : toute `photo_id` non-null doit
 * référencer un id présent dans le pool. À utiliser sur le couple complet
 * avant écriture BDD.
 */
export function assertAssignmentsPointToPool(
  pool: { id: string }[],
  assignments: { photo_id: string | null }[]
): void {
  const ids = new Set(pool.map((p) => p.id))
  for (const a of assignments) {
    if (a.photo_id !== null && !ids.has(a.photo_id)) {
      throw new Error(`Assignation orpheline: photo_id ${a.photo_id} absent du pool`)
    }
  }
}
