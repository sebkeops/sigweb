'use client'

import { useEffect, useState } from 'react'
import { useEditor } from './EditorContext'
import type { EditableField as EditableFieldName } from '@/lib/maquette/content-schema'

type FieldKind = 'text' | 'textarea' | 'number'

interface BaseProps {
  field: EditableFieldName
  label: string
  /** Aide affichée sous le champ (ex: pour la syntaxe `*italique*`). */
  hint?: string
  /** Placeholder du champ (HTML attribute). */
  placeholder?: string
  /** Valeur initiale (lue depuis la maquette en BDD). */
  initialValue: string | number | null
  /** Hauteur en lignes pour les textarea (défaut: 3). */
  rows?: number
  /** Bornes pour les inputs number (recopie des contraintes BDD). */
  min?: number
  max?: number
}

interface TextProps extends BaseProps { kind: 'text' | 'textarea' }
interface NumberProps extends BaseProps { kind: 'number' }

type Props = TextProps | NumberProps

/**
 * Champ éditable connecté au contexte d'auto-save de l'éditeur.
 *
 * Pas de bouton "Enregistrer" : on appelle `update(field, value)` à chaque
 * changement, l'EditorProvider debounce et persiste seul. La preview iframe
 * se rafraîchit automatiquement via `contentVersion` au save terminé.
 *
 * State local non controllé pour garder le curseur stable pendant que le
 * Provider tourne en arrière-plan.
 */
export default function EditableField(props: Props) {
  const { field, label, hint, placeholder, initialValue, kind } = props
  const { update } = useEditor()

  // State local : on initialise sur la valeur reçue mais on n'écrase pas
  // sur les re-renders du parent (évite les conflits avec le typing utilisateur).
  const [value, setValue] = useState<string>(() => {
    if (initialValue == null) return ''
    return String(initialValue)
  })

  // Si la prop initialValue change après un reload (cas stale + reload), on resync.
  useEffect(() => {
    setValue(initialValue == null ? '' : String(initialValue))
  }, [initialValue])

  function handleChange(raw: string) {
    setValue(raw)
    if (kind === 'number') {
      const parsed = raw.trim() === '' ? null : Number(raw)
      if (parsed === null || (Number.isFinite(parsed) && Number.isInteger(parsed))) {
        update(field, parsed)
      }
      // Si l'input est en cours de frappe et n'est pas un int valide,
      // on attend — ne rien envoyer pour ne pas spam le serveur.
      return
    }
    update(field, raw)
  }

  return (
    <label className="block">
      <span className="mb-1 block font-body text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {kind === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={props.rows ?? 3}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink shadow-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : kind === 'number' ? (
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          min={props.min}
          max={props.max}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink shadow-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink shadow-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}
      {hint && (
        <span className="mt-1 block font-body text-xs text-muted">{hint}</span>
      )}
    </label>
  )
}
