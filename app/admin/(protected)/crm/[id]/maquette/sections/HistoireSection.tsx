'use client'

import { useState } from 'react'
import { VALEURS_LIMITS } from '@/lib/maquette/content-schema'
import type { Maquette, MaquetteValeurItem } from '@/types'
import { useEditor } from '../editor/EditorContext'
import EditableField from '../editor/EditableField'

interface Props {
  maquette: Maquette
  /** Atouts par défaut du template, pour fallback + boutons "Réinitialiser". */
  defaultValeurs: MaquetteValeurItem[]
}

const HINT_ITALIC = 'Encadrez avec *des étoiles* les mots à mettre en italique dans le rendu.'

/**
 * Section éditeur "Histoire & atouts" — regroupe les 3 textes Histoire
 * (titre / phrase italique / paragraphe) + l'année de création + les 4
 * atouts (sous le hero, rendus dans la section Histoire de la maquette).
 */
export default function HistoireSection({ maquette, defaultValeurs }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <EditableField
          kind="textarea"
          field="histoire_title"
          label="Titre"
          hint={HINT_ITALIC}
          placeholder="Une boulangerie de *quartier*, ouverte à tous."
          initialValue={maquette.histoire_title}
          rows={2}
        />
        <EditableField
          kind="textarea"
          field="histoire_lead"
          label="Phrase italique d'intro"
          placeholder="Avec une seule idée en tête : faire du bon pain, simplement."
          initialValue={maquette.histoire_lead}
          rows={2}
        />
        <EditableField
          kind="textarea"
          field="texte_presentation"
          label="Paragraphe principal"
          placeholder="Pas de fioritures. Du levain naturel…"
          initialValue={maquette.texte_presentation}
          rows={5}
        />
        <EditableField
          kind="number"
          field="annee_creation"
          label="Année de création"
          placeholder="2014"
          initialValue={maquette.annee_creation}
          min={1800}
          max={2100}
        />
        <p className="font-body text-xs text-muted">
          L&apos;année alimente le bandeau « X ans de savoir-faire » et le bloc Hero meta.
          Laisser vide masque le bandeau.
        </p>
      </div>

      <ValeursEditor
        initialValeurs={maquette.valeurs_items}
        defaultValeurs={defaultValeurs}
      />
    </div>
  )
}

interface ValeursEditorProps {
  initialValeurs: MaquetteValeurItem[] | null
  defaultValeurs: MaquetteValeurItem[]
}

/**
 * Édition des 4 atouts (sous-bloc dans la section "Nos atouts" en bas de
 * la section Histoire de la page publique). Logique alignée sur
 * `UniversSection` : on envoie le tableau complet à chaque changement, le
 * schéma Zod attend exactement 4 items.
 *
 * Les icônes ne sont pas exposées à l'édition : le rendu utilise un cycle
 * décoratif unicode (◐◑◒◓) appliqué par position (cf. Histoire.tsx).
 */
function ValeursEditor({ initialValeurs, defaultValeurs }: ValeursEditorProps) {
  const { update } = useEditor()
  const initial = padTo(VALEURS_LIMITS.COUNT, initialValeurs ?? defaultValeurs, defaultValeurs)
  const [items, setItems] = useState<MaquetteValeurItem[]>(initial)

  function applyItems(next: MaquetteValeurItem[]) {
    const sliced = next.slice(0, VALEURS_LIMITS.COUNT)
    setItems(sliced)
    update('valeurs_items', sliced)
  }

  function updateField(idx: number, field: keyof MaquetteValeurItem, value: string) {
    const next = items.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    applyItems(next)
  }

  function resetAtout(idx: number) {
    const fallback = defaultValeurs[idx]
    if (!fallback) return
    if (!confirm(`Réinitialiser l'atout ${idx + 1} aux valeurs par défaut du template ?`)) return
    const next = items.map((it, i) => (i === idx ? { ...fallback } : it))
    applyItems(next)
  }

  function resetAll() {
    if (!confirm('Réinitialiser les 4 atouts aux valeurs par défaut du template ?')) return
    applyItems(padTo(VALEURS_LIMITS.COUNT, [], defaultValeurs))
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: '1px solid var(--color-border, #e5e1d8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-ink, #1e1e1e)',
          }}
        >
          Atouts (4)
        </h3>
        <button
          type="button"
          onClick={resetAll}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '4px 6px',
            fontSize: '0.72rem',
            color: 'var(--color-muted, #7a6e60)',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Tout réinitialiser
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, idx) => (
          <AtoutEditor
            key={idx}
            index={idx}
            item={item}
            onChange={(field, value) => updateField(idx, field, value)}
            onReset={() => resetAtout(idx)}
          />
        ))}
      </div>
    </div>
  )
}

interface AtoutEditorProps {
  index: number
  item: MaquetteValeurItem
  onChange: (field: keyof MaquetteValeurItem, value: string) => void
  onReset: () => void
}

function AtoutEditor({ index, item, onChange, onReset }: AtoutEditorProps) {
  return (
    <fieldset
      style={{
        border: '1px solid var(--color-border, #e5e1d8)',
        borderRadius: 6,
        padding: '10px 12px',
        margin: 0,
        background: 'white',
      }}
    >
      <legend
        style={{
          padding: '0 6px',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--color-ink, #1e1e1e)',
        }}
      >
        Atout {index + 1}
      </legend>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <CompactField
          label="Titre"
          value={item.title}
          maxLength={VALEURS_LIMITS.TITLE_MAX}
          placeholder="Levain naturel"
          onChange={(v) => onChange('title', v)}
        />
        <CompactField
          label="Sous-titre"
          value={item.desc}
          maxLength={VALEURS_LIMITS.DESC_MAX}
          placeholder="Pétrissage long, fermentation lente."
          onChange={(v) => onChange('desc', v)}
        />
      </div>

      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onReset}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '2px 6px',
            fontSize: '0.7rem',
            color: 'var(--color-muted, #7a6e60)',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Réinitialiser
        </button>
      </div>
    </fieldset>
  )
}

interface CompactFieldProps {
  label: string
  value: string
  placeholder?: string
  maxLength: number
  onChange: (value: string) => void
}

function CompactField({ label, value, placeholder, maxLength, onChange }: CompactFieldProps) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          marginBottom: 3,
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--color-muted, #7a6e60)',
        }}
      >
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{
          width: '100%',
          padding: '7px 10px',
          borderRadius: 4,
          border: '1px solid var(--color-border, #e5e1d8)',
          fontSize: '0.85rem',
          color: 'var(--color-ink, #1e1e1e)',
        }}
      />
    </label>
  )
}

/**
 * Garantit un tableau de N items, en remplissant les slots manquants avec
 * les défauts du template (sinon item vide).
 */
function padTo(
  count: number,
  items: MaquetteValeurItem[],
  defaults: MaquetteValeurItem[]
): MaquetteValeurItem[] {
  const out: MaquetteValeurItem[] = []
  for (let i = 0; i < count; i++) {
    out.push(items[i] ?? defaults[i] ?? { title: '', desc: '' })
  }
  return out
}
