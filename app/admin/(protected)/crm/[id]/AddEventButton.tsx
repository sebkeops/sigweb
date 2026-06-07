'use client'

import { useState, useTransition } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { addManualTimelineEvent } from '@/lib/actions/timeline-event'
import type {
  DmSentPlatform,
  ManualTimelineEventType,
  PhoneCallSubtype,
} from '@/types'

interface Props {
  prospectId: string
}

interface TypeOption {
  type: ManualTimelineEventType
  icon: string
  label: string
}

const TYPE_OPTIONS: TypeOption[] = [
  { type: 'phone_call',        icon: '📞', label: 'Appel téléphonique' },
  { type: 'affiche_deposited', icon: '📍', label: 'Affiche déposée' },
  { type: 'terrain_visit',     icon: '👣', label: 'Visite terrain' },
  { type: 'dm_sent',           icon: '💬', label: 'DM envoyé' },
  { type: 'meeting_scheduled', icon: '📅', label: 'RDV programmé' },
  { type: 'note',              icon: '📝', label: 'Note' },
]

/**
 * Bouton « + Ajouter un événement » sur la page CRM prospect (Phase 4C).
 *
 * Flow mobile-first :
 *   1. Clic → ouvre un bottom-sheet (Drawer side="bottom")
 *   2. Étape 1 : grille de 6 tuiles (tap targets ≥ 44px)
 *   3. Étape 2 : formulaire dynamique selon le type choisi
 *   4. Submit → server action → revalidatePath rafraîchit la timeline
 *
 * État local minimal : étape (choix de type vs formulaire), erreurs.
 * Le formulaire est volontairement non-controlled (FormData natif) —
 * moins de re-renders, plus simple à valider côté serveur.
 */
export default function AddEventButton({ prospectId }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<ManualTimelineEventType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function reset() {
    setSelectedType(null)
    setError(null)
  }

  function handleClose() {
    setOpen(false)
    // Reset après l'animation de sortie pour éviter un flicker visuel.
    setTimeout(reset, 250)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedType) return
    setError(null)

    const fd = new FormData(e.currentTarget)
    const input = buildInput(selectedType, fd)
    if (!input) {
      setError('Champs invalides.')
      return
    }

    startTransition(async () => {
      const result = await addManualTimelineEvent(prospectId, input)
      if (!result.success) {
        setError(result.error)
        return
      }
      handleClose()
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="md"
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto"
      >
        + Ajouter un événement
      </Button>

      <Drawer
        open={open}
        onClose={handleClose}
        side="bottom"
        title={selectedType ? labelForType(selectedType) : 'Nouvel événement'}
      >
        {!selectedType ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => setSelectedType(opt.type)}
                className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 py-4 text-center font-body text-sm font-medium text-ink shadow-sm transition active:scale-95 hover:border-primary hover:bg-primary-soft/30"
              >
                <span className="text-3xl" aria-hidden="true">
                  {opt.icon}
                </span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <EventFormFields type={selectedType} />

            {error && (
              <p role="alert" className="font-body text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={reset}
                disabled={pending}
              >
                Retour
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={pending}
              >
                Enregistrer
              </Button>
            </div>
          </form>
        )}
      </Drawer>
    </>
  )
}

function labelForType(type: ManualTimelineEventType): string {
  return TYPE_OPTIONS.find((o) => o.type === type)?.label ?? 'Événement'
}

// ─── Form fields par type ──────────────────────────────────────────

function EventFormFields({ type }: { type: ManualTimelineEventType }) {
  const defaultDateTime = nowAsLocalInput()

  return (
    <>
      <Field
        label="Date de l'événement"
        name="occurred_at"
        type="datetime-local"
        defaultValue={defaultDateTime}
        required
      />

      {type === 'phone_call' && (
        <Field label="Résultat de l'appel" name="event_subtype" type="select" required>
          <option value="sans_reponse">Sans réponse</option>
          <option value="parle">Conversation aboutie</option>
          <option value="message_vocal">Message vocal laissé</option>
        </Field>
      )}

      {type === 'dm_sent' && (
        <Field label="Plateforme" name="plateforme" type="select" required>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
        </Field>
      )}

      {type === 'meeting_scheduled' && (
        <Field
          label="Date du RDV"
          name="date_rdv"
          type="datetime-local"
          required
        />
      )}

      <Field
        label={type === 'note' ? 'Note' : 'Notes (optionnel)'}
        name="notes"
        type="textarea"
        required={type === 'note'}
        placeholder={
          type === 'phone_call'
            ? 'Ex : Demande à être rappelé jeudi matin.'
            : type === 'affiche_deposited'
              ? 'Ex : Affiche posée à côté de la caisse.'
              : type === 'terrain_visit'
                ? 'Ex : Passé en boutique vers 14h, accueilli par le gérant.'
                : type === 'dm_sent'
                  ? 'Ex : Présenté la simulation, demande à voir le détail.'
                  : type === 'meeting_scheduled'
                    ? 'Ex : RDV au cabinet, ramener démo iPad.'
                    : 'Ex : Rappel important à ne pas oublier.'
        }
      />
    </>
  )
}

interface FieldProps {
  label: string
  name: string
  type: 'datetime-local' | 'select' | 'textarea'
  required?: boolean
  defaultValue?: string
  placeholder?: string
  children?: React.ReactNode
}

function Field({
  label,
  name,
  type,
  required = false,
  defaultValue,
  placeholder,
  children,
}: FieldProps) {
  const id = `field-${name}`
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block font-body text-sm font-medium text-ink"
      >
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          required={required}
          placeholder={placeholder}
          rows={3}
          maxLength={2000}
          className="block w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : type === 'select' ? (
        <select
          id={id}
          name={name}
          required={required}
          defaultValue=""
          className="block min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="" disabled>
            Choisir…
          </option>
          {children}
        </select>
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          className="block min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Convertit un `datetime-local` input value (ex: `"2026-06-07T14:30"` en
 * heure locale) en ISO UTC pour Zod + BDD. L'input rend déjà en heure
 * locale, on doit juste passer par `new Date()` qui interprète comme
 * heure locale → toISOString = UTC.
 */
function localInputToIso(s: string): string {
  return new Date(s).toISOString()
}

function nowAsLocalInput(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildInput(
  type: ManualTimelineEventType,
  fd: FormData
): Record<string, unknown> | null {
  const occurredRaw = (fd.get('occurred_at') as string | null) ?? ''
  if (!occurredRaw) return null
  const occurred_at = localInputToIso(occurredRaw)
  const notesRaw = (fd.get('notes') as string | null) ?? ''
  const notes = notesRaw.trim() || undefined

  if (type === 'phone_call') {
    return {
      event_type: 'phone_call',
      occurred_at,
      event_subtype: fd.get('event_subtype') as PhoneCallSubtype,
      notes,
    }
  }
  if (type === 'dm_sent') {
    return {
      event_type: 'dm_sent',
      occurred_at,
      plateforme: fd.get('plateforme') as DmSentPlatform,
      notes,
    }
  }
  if (type === 'meeting_scheduled') {
    const rdvRaw = (fd.get('date_rdv') as string | null) ?? ''
    return {
      event_type: 'meeting_scheduled',
      occurred_at,
      date_rdv: rdvRaw ? localInputToIso(rdvRaw) : rdvRaw,
      notes,
    }
  }
  if (type === 'note') {
    return {
      event_type: 'note',
      occurred_at,
      notes: notesRaw.trim(),
    }
  }
  // affiche_deposited / terrain_visit : pas de champ spécifique
  return {
    event_type: type,
    occurred_at,
    notes,
  }
}
