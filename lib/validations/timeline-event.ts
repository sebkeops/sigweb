import { z } from 'zod'

/**
 * Validation des événements manuels timeline (CRM v3 Phase 4).
 *
 * Schéma discriminé sur `event_type`. Chaque variante n'autorise QUE
 * les champs qui ont du sens pour ce type — Zod rejette toute clé en
 * trop côté serveur (defense en profondeur : on ne stocke pas de
 * metadata folkloriques côté BDD si l'UI a un bug).
 *
 * Convention :
 *   - `occurredAt` : ISO string, doit parser via `new Date()`. Par
 *     défaut côté UI = maintenant, mais l'admin peut antidater (appel
 *     d'hier saisi ce matin).
 *   - `notes` : trim, max 2000 chars, optionnel SAUF pour `note` (où
 *     c'est le contenu principal de l'event).
 */

const NOTES_MAX = 2000

const occurredAtSchema = z
  .string()
  .min(1, 'Date requise.')
  .refine((s) => !Number.isNaN(new Date(s).getTime()), 'Date invalide.')

const notesOptional = z
  .string()
  .trim()
  .max(NOTES_MAX, `Notes trop longues (max ${NOTES_MAX} caractères).`)
  .optional()

const notesRequired = z
  .string()
  .trim()
  .min(1, 'Note requise.')
  .max(NOTES_MAX, `Notes trop longues (max ${NOTES_MAX} caractères).`)

export const phoneCallSchema = z.object({
  event_type: z.literal('phone_call'),
  occurred_at: occurredAtSchema,
  event_subtype: z.enum(['sans_reponse', 'parle', 'message_vocal']),
  notes: notesOptional,
})

export const afficheDepositedSchema = z.object({
  event_type: z.literal('affiche_deposited'),
  occurred_at: occurredAtSchema,
  notes: notesOptional,
})

export const terrainVisitSchema = z.object({
  event_type: z.literal('terrain_visit'),
  occurred_at: occurredAtSchema,
  notes: notesOptional,
})

export const dmSentSchema = z.object({
  event_type: z.literal('dm_sent'),
  occurred_at: occurredAtSchema,
  plateforme: z.enum(['facebook', 'instagram']),
  notes: notesOptional,
})

export const meetingScheduledSchema = z.object({
  event_type: z.literal('meeting_scheduled'),
  occurred_at: occurredAtSchema,
  date_rdv: z
    .string()
    .min(1, 'Date du RDV requise.')
    .refine((s) => !Number.isNaN(new Date(s).getTime()), 'Date du RDV invalide.'),
  notes: notesOptional,
})

export const noteSchema = z.object({
  event_type: z.literal('note'),
  occurred_at: occurredAtSchema,
  notes: notesRequired,
})

export const manualTimelineEventSchema = z.discriminatedUnion('event_type', [
  phoneCallSchema,
  afficheDepositedSchema,
  terrainVisitSchema,
  dmSentSchema,
  meetingScheduledSchema,
  noteSchema,
])

export type ManualTimelineEventInput = z.infer<typeof manualTimelineEventSchema>
