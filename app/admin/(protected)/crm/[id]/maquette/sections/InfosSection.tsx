'use client'

import { useState } from 'react'
import { INFOS_LIMITS } from '@/lib/maquette/content-schema'
import type { MaquetteInfosOverrides, Prospect } from '@/types'
import { useEditor } from '../editor/EditorContext'

interface Props {
  prospect: Prospect
  initialOverrides: MaquetteInfosOverrides | null
}

type FieldKey = 'adresse' | 'telephone' | 'email'
type Mode = 'auto' | 'custom' | 'hidden'

interface FieldConfig {
  key: FieldKey
  label: string
  hint: string
  maxLength: number
  prospectValue: string | null
  multiline?: boolean
}

/**
 * Section "Infos pratiques" — override des coordonnées affichées dans la
 * maquette publiée.
 *
 * Mode par champ :
 *   - 'auto'   → utiliser la valeur du prospect (CRM)
 *   - 'custom' → input texte avec valeur custom
 *   - 'hidden' → masquer cette info dans la maquette
 *
 * Sauvegarde : on envoie l'objet `infos_overrides` complet à chaque
 * changement (debounce 500 ms via le contexte d'édition).
 *
 * Stockage BDD :
 *   - clé absente du JSON       → 'auto'
 *   - clé présente avec null    → 'hidden'
 *   - clé présente avec string  → 'custom'
 *   - infos_overrides=null      → 3 modes 'auto' (équivalent à objet vide)
 */
export default function InfosSection({ prospect, initialOverrides }: Props) {
  const { update } = useEditor()
  const [overrides, setOverrides] = useState<MaquetteInfosOverrides>(initialOverrides ?? {})

  function applyOverrides(next: MaquetteInfosOverrides) {
    setOverrides(next)
    // On envoie null si le payload est intégralement vide pour rester propre.
    const isEmpty = Object.keys(next).length === 0
    update('infos_overrides', isEmpty ? null : next)
  }

  function setMode(key: FieldKey, mode: Mode, currentValue: string | null) {
    const next = { ...overrides }
    if (mode === 'auto') {
      delete next[key]
    } else if (mode === 'hidden') {
      next[key] = null
    } else {
      // Si on passe en custom, on initialise avec la valeur du prospect
      // pour ne pas démarrer sur une chaîne vide.
      next[key] = typeof next[key] === 'string' ? next[key] : (currentValue ?? '')
    }
    applyOverrides(next)
  }

  function setCustomValue(key: FieldKey, value: string) {
    const next = { ...overrides, [key]: value }
    applyOverrides(next)
  }

  const fields: FieldConfig[] = [
    {
      key: 'adresse',
      label: 'Adresse',
      hint: 'Visible dans la section "Nous trouver" et dans le footer.',
      maxLength: INFOS_LIMITS.ADRESSE_MAX,
      prospectValue: prospect.adresse,
      multiline: true,
    },
    {
      key: 'telephone',
      label: 'Téléphone',
      hint: 'Utilisé sur les boutons "Appeler" du header, du CTA banner et du footer.',
      maxLength: INFOS_LIMITS.TELEPHONE_MAX,
      prospectValue: prospect.telephone,
    },
    {
      key: 'email',
      label: 'Email',
      hint: 'Visible uniquement si renseigné. Lien mailto: dans le footer.',
      maxLength: INFOS_LIMITS.EMAIL_MAX,
      prospectValue: prospect.email,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-muted, #7a6e60)', margin: 0 }}>
        Par défaut la maquette affiche les coordonnées du prospect (CRM). Tu peux
        override chaque champ ou le masquer si l&apos;information ne doit pas être
        publique.
      </p>

      {fields.map((field) => {
        const override = overrides[field.key]
        const mode: Mode = override === undefined
          ? 'auto'
          : override === null
            ? 'hidden'
            : 'custom'
        return (
          <FieldEditor
            key={field.key}
            field={field}
            mode={mode}
            customValue={typeof override === 'string' ? override : ''}
            onModeChange={(m) => setMode(field.key, m, field.prospectValue)}
            onCustomChange={(v) => setCustomValue(field.key, v)}
          />
        )
      })}
    </div>
  )
}

interface FieldEditorProps {
  field: FieldConfig
  mode: Mode
  customValue: string
  onModeChange: (mode: Mode) => void
  onCustomChange: (value: string) => void
}

function FieldEditor({ field, mode, customValue, onModeChange, onCustomChange }: FieldEditorProps) {
  return (
    <fieldset
      style={{
        border: '1px solid var(--color-border, #e5e1d8)',
        borderRadius: 6,
        padding: '12px 14px',
        margin: 0,
        background: 'white',
      }}
    >
      <legend style={{ padding: '0 6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-ink, #1e1e1e)' }}>
        {field.label}
      </legend>

      <p style={{ margin: '0 0 8px 0', fontSize: '0.72rem', color: 'var(--color-muted, #7a6e60)' }}>
        {field.hint}
      </p>

      <div style={{ marginBottom: 8 }}>
        <strong style={{ fontSize: '0.72rem', color: 'var(--color-muted, #7a6e60)' }}>
          Valeur du prospect :
        </strong>{' '}
        <span style={{ fontSize: '0.85rem', color: 'var(--color-ink, #1e1e1e)' }}>
          {field.prospectValue || <em style={{ color: 'var(--color-muted, #7a6e60)' }}>(vide)</em>}
        </span>
      </div>

      <div role="radiogroup" aria-label={`Mode pour ${field.label}`} style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        <RadioOption
          checked={mode === 'auto'}
          onChange={() => onModeChange('auto')}
          label="Utiliser la valeur du prospect"
        />
        <RadioOption
          checked={mode === 'custom'}
          onChange={() => onModeChange('custom')}
          label="Personnaliser"
        />
        <RadioOption
          checked={mode === 'hidden'}
          onChange={() => onModeChange('hidden')}
          label="Masquer"
        />
      </div>

      {mode === 'custom' && (
        field.multiline ? (
          <textarea
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            maxLength={field.maxLength}
            rows={2}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 4,
              border: '1px solid var(--color-border, #e5e1d8)',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        ) : (
          <input
            type="text"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            maxLength={field.maxLength}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 4,
              border: '1px solid var(--color-border, #e5e1d8)',
              fontSize: '0.85rem',
            }}
          />
        )
      )}

      {mode === 'hidden' && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#a16207' }}>
          ⚠ Cette information ne sera pas affichée sur la maquette publiée.
        </p>
      )}
    </fieldset>
  )
}

function RadioOption({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', cursor: 'pointer' }}>
      <input type="radio" checked={checked} onChange={onChange} />
      <span style={{ fontWeight: checked ? 600 : 400 }}>{label}</span>
    </label>
  )
}
