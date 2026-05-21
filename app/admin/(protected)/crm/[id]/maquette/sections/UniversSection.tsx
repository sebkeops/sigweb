'use client'

import { useState } from 'react'
import { UNIVERS_LIMITS } from '@/lib/maquette/content-schema'
import type { Maquette, MaquetteUniversItem } from '@/types'
import { useEditor } from '../editor/EditorContext'
import EditableField from '../editor/EditableField'
import styles from '../identity/identity.module.css'

const HINT_ITALIC = 'Encadrez avec *des étoiles* les mots à mettre en italique dans le rendu.'

interface Props {
  maquette: Maquette
  /** Items par défaut du template, pour les boutons "Réinitialiser". */
  defaultItems: MaquetteUniversItem[]
}

/**
 * Édition des 5 cartes Univers (cat / name / desc).
 *
 * Sauvegarde via le contexte d'édition principal (debounce 500 ms — on
 * batch les édits multi-cartes). On envoie le tableau **complet** à chaque
 * changement (pas un patch d'index), puisque le schéma Zod attend
 * exactement 5 items.
 *
 * Les boutons "Réinitialiser cette carte" / "Réinitialiser toutes les
 * cartes" remplacent les valeurs locales + envoient au contexte. La preview
 * iframe se rafraîchit après le save.
 */
export default function UniversSection({ maquette, defaultItems }: Props) {
  const { update } = useEditor()

  // Normalise à 5 items même si la BDD en a moins (cas legacy improbable).
  const initial = padTo5(maquette.univers_items ?? defaultItems, defaultItems)
  const [items, setItems] = useState<MaquetteUniversItem[]>(initial)

  function applyItems(next: MaquetteUniversItem[]) {
    const sliced = next.slice(0, UNIVERS_LIMITS.COUNT)
    setItems(sliced)
    update('univers_items', sliced)
  }

  function updateField(idx: number, field: keyof MaquetteUniversItem, value: string) {
    const next = items.map((it, i) => (i === idx ? { ...it, [field]: value } : it))
    applyItems(next)
  }

  function resetCard(idx: number) {
    const fallback = defaultItems[idx]
    if (!fallback) return
    if (!confirm(`Réinitialiser la carte ${idx + 1} aux valeurs par défaut du template ?`)) return
    const next = items.map((it, i) => (i === idx ? { ...fallback } : it))
    applyItems(next)
  }

  function resetAll() {
    if (!confirm('Réinitialiser les 5 cartes aux valeurs par défaut du template ?')) return
    applyItems(padTo5([], defaultItems))
  }

  return (
    <div className={styles.universContainer ?? ''}>
      <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--color-border, #e5e1d8)' }}>
        <div
          style={{
            marginBottom: 10,
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-ink, #1e1e1e)',
          }}
        >
          En-tête de section
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <EditableField
            kind="text"
            field="univers_section_suptitle"
            label="Sur-titre"
            placeholder="Nos créations"
            initialValue={maquette.univers_section_suptitle}
          />
          <EditableField
            kind="textarea"
            field="univers_section_title"
            label="Titre"
            hint={HINT_ITALIC}
            placeholder="Du pain, des viennoiseries, et bien *plus encore*."
            initialValue={maquette.univers_section_title}
            rows={2}
          />
          <EditableField
            kind="textarea"
            field="univers_section_intro"
            label="Paragraphe d'intro"
            placeholder="Chaque produit est confectionné à la main, dans notre fournil…"
            initialValue={maquette.univers_section_intro}
            rows={3}
          />
        </div>
      </div>

      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-ink, #1e1e1e)',
          }}
        >
          Cartes (5)
        </div>
        <button
          type="button"
          onClick={resetAll}
          className={styles.btnGhost}
          style={{ fontSize: '0.75rem' }}
        >
          Réinitialiser toutes les cartes
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map((item, idx) => (
          <UniversCardEditor
            key={idx}
            index={idx}
            item={item}
            onChange={(field, value) => updateField(idx, field, value)}
            onReset={() => resetCard(idx)}
          />
        ))}
      </div>
    </div>
  )
}

interface CardEditorProps {
  index: number
  item: MaquetteUniversItem
  onChange: (field: keyof MaquetteUniversItem, value: string) => void
  onReset: () => void
}

function UniversCardEditor({ index, item, onChange, onReset }: CardEditorProps) {
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
      <legend
        style={{
          padding: '0 6px',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--color-ink, #1e1e1e)',
        }}
      >
        Carte {index + 1}
        {index === 0 && (
          <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--color-muted, #7a6e60)', fontWeight: 400 }}>
            (mise en avant grande largeur)
          </span>
        )}
      </legend>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field
          label="Catégorie"
          value={item.cat}
          maxLength={UNIVERS_LIMITS.CAT_MAX}
          placeholder="Spécialité maison"
          onChange={(v) => onChange('cat', v)}
        />
        <Field
          label="Nom du produit"
          value={item.name}
          maxLength={UNIVERS_LIMITS.NAME_MAX}
          placeholder="Pains au levain"
          onChange={(v) => onChange('name', v)}
        />
        <Field
          label="Description"
          value={item.desc}
          maxLength={UNIVERS_LIMITS.DESC_MAX}
          placeholder="Tradition, complet, multi-céréales… Cuits sur sole."
          textarea
          onChange={(v) => onChange('desc', v)}
        />
      </div>

      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onReset}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '4px 8px',
            fontSize: '0.72rem',
            color: 'var(--color-muted, #7a6e60)',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Réinitialiser cette carte
        </button>
      </div>
    </fieldset>
  )
}

interface FieldProps {
  label: string
  value: string
  placeholder?: string
  maxLength: number
  textarea?: boolean
  onChange: (value: string) => void
}

function Field({ label, value, placeholder, maxLength, textarea, onChange }: FieldProps) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'block',
          marginBottom: 4,
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--color-muted, #7a6e60)',
        }}
      >
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={2}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 4,
            border: '1px solid var(--color-border, #e5e1d8)',
            fontSize: '0.85rem',
            color: 'var(--color-ink, #1e1e1e)',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 4,
            border: '1px solid var(--color-border, #e5e1d8)',
            fontSize: '0.85rem',
            color: 'var(--color-ink, #1e1e1e)',
          }}
        />
      )}
    </label>
  )
}

/**
 * Garantit un tableau de 5 items, en remplissant les slots manquants avec
 * les défauts du template.
 */
function padTo5(
  items: MaquetteUniversItem[],
  defaults: MaquetteUniversItem[]
): MaquetteUniversItem[] {
  const out: MaquetteUniversItem[] = []
  for (let i = 0; i < UNIVERS_LIMITS.COUNT; i++) {
    out.push(items[i] ?? defaults[i] ?? { cat: '', name: '', desc: '' })
  }
  return out
}
