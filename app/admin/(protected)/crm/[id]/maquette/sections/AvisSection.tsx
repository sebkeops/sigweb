'use client'

import { useMemo, useState } from 'react'
import { AVIS_LIMITS } from '@/lib/maquette/content-schema'
import { getAuthorInitial } from '@/lib/google-places/author-name'
import { formatRelativeTime } from '@/lib/maquette/render/formatRelativeTime'
import type { GoogleReviewItem, MaquetteAvisItem, Prospect } from '@/types'
import { useEditor } from '../editor/EditorContext'

interface Props {
  prospect: Prospect
  /** Sélection courante (null = défaut "3 premiers Google avis"). */
  initialAvis: MaquetteAvisItem[] | null
}

/**
 * Sélection des avis à afficher dans la maquette + édition possible du texte.
 *
 * Modèle :
 *   - `prospect.google_reviews` (max 5) est la source.
 *   - `maquette.avis_items` (null par défaut) est le snapshot sélectionné.
 *   - Si `null`, la page publique affiche automatiquement les 3 premiers
 *     avis Google (comportement V1 actuel).
 *   - Si tableau, on l'utilise (max 3 entrées).
 *
 * UX :
 *   - Liste des avis Google avec checkbox de sélection (max 3 cochées).
 *   - Pour chaque sélectionné, bouton "Éditer le texte" → textarea inline.
 *   - Marqueur "Édité" si le texte diffère de l'original Google.
 *   - Bouton "Réinitialiser le texte" pour restaurer l'original.
 *   - Avertissement si moins de 3 avis Google dispos.
 *
 * Sauvegarde : via le contexte d'édition (debounce 500 ms, batche avec
 * d'autres édits texte). On envoie le tableau complet à chaque changement.
 */
export default function AvisSection({ prospect, initialAvis }: Props) {
  const { update } = useEditor()
  const reviews = useMemo(() => prospect.google_reviews ?? [], [prospect.google_reviews])
  const [selection, setSelection] = useState<MaquetteAvisItem[]>(() =>
    initialAvis ?? defaultSelection(reviews)
  )

  function applySelection(next: MaquetteAvisItem[]) {
    setSelection(next)
    update('avis_items', next)
  }

  function toggleReview(review: GoogleReviewItem) {
    const idx = selection.findIndex((a) => a.source_id === review.name)
    if (idx >= 0) {
      // Désélection
      applySelection(selection.filter((_, i) => i !== idx))
      return
    }
    if (selection.length >= AVIS_LIMITS.MAX_COUNT) {
      // Limite atteinte — on remplace le 1er pour laisser la place
      // (UX simple : on remonte l'ordre des sélections vers le début).
      // Alternative : juste bloquer. On bloque pour rester explicite.
      return
    }
    applySelection([...selection, googleReviewToAvis(review)])
  }

  function updateText(idx: number, text: string) {
    const next = selection.map((a, i) => {
      if (i !== idx) return a
      const original = reviews.find((r) => r.name === a.source_id)
      const editedFlag = original ? text.trim() !== original.text.trim() : true
      return { ...a, text, edited: editedFlag }
    })
    applySelection(next)
  }

  function resetText(idx: number) {
    const target = selection[idx]
    if (!target?.source_id) return
    const original = reviews.find((r) => r.name === target.source_id)
    if (!original) return
    if (!confirm('Restaurer le texte original Google de cet avis ?')) return
    const next = selection.map((a, i) =>
      i === idx ? { ...a, text: original.text, edited: false } : a
    )
    applySelection(next)
  }

  function isSelected(reviewName: string): boolean {
    return selection.some((a) => a.source_id === reviewName)
  }

  function selectionIndex(reviewName: string): number {
    return selection.findIndex((a) => a.source_id === reviewName)
  }

  if (reviews.length === 0) {
    return (
      <div style={{ padding: 12, fontSize: '0.85rem', color: 'var(--color-muted, #7a6e60)' }}>
        Aucun avis Google détaillé n&apos;est récupéré pour ce prospect. Lance le bouton
        <strong> « Recharger avis Google »</strong> dans le header CRM, ou laisse vide
        pour ne pas afficher de section avis sur la maquette publiée.
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: '0.85rem', color: 'var(--color-text, #1e1e1e)' }}>
        <strong>{selection.length}</strong> / {AVIS_LIMITS.MAX_COUNT} avis sélectionnés
        {' '}({reviews.length} disponible{reviews.length > 1 ? 's' : ''} chez Google).
        {reviews.length < 3 && (
          <span style={{ color: '#a16207', marginLeft: 6 }}>
            ⚠ Moins de 3 avis Google : la section affichera moins de cartes que prévu.
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {reviews.map((review) => {
          const sel = isSelected(review.name)
          const idx = selectionIndex(review.name)
          const sblockSelection = !sel && selection.length >= AVIS_LIMITS.MAX_COUNT
          return (
            <ReviewCard
              key={review.name}
              review={review}
              selected={sel}
              selectedItem={sel ? selection[idx] : null}
              disabled={sblockSelection}
              onToggle={() => toggleReview(review)}
              onUpdateText={(text) => updateText(idx, text)}
              onResetText={() => resetText(idx)}
            />
          )
        })}
      </div>
    </div>
  )
}

interface ReviewCardProps {
  review: GoogleReviewItem
  selected: boolean
  selectedItem: MaquetteAvisItem | null
  disabled: boolean
  onToggle: () => void
  onUpdateText: (text: string) => void
  onResetText: () => void
}

function ReviewCard({
  review,
  selected,
  selectedItem,
  disabled,
  onToggle,
  onUpdateText,
  onResetText,
}: ReviewCardProps) {
  const [editing, setEditing] = useState(false)
  const stars = '★'.repeat(Math.max(1, Math.min(5, review.rating)))
  const relative = formatRelativeTime(review.publish_time)

  return (
    <div
      style={{
        border: selected
          ? '1px solid var(--color-primary, #2f6f4f)'
          : '1px solid var(--color-border, #e5e1d8)',
        borderRadius: 6,
        padding: '12px 14px',
        background: selected ? 'var(--color-surface-soft, #f9f7f1)' : 'white',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <label style={{ display: 'flex', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <input
          type="checkbox"
          checked={selected}
          disabled={disabled}
          onChange={onToggle}
          style={{ marginTop: 4 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-muted, #7a6e60)', marginBottom: 4 }}>
            <strong style={{ color: 'var(--color-ink, #1e1e1e)' }}>{review.author_name}</strong>
            {' · '}
            <span style={{ color: 'var(--color-accent, #B8893E)' }}>{stars}</span>
            {relative && <span> · {relative}</span>}
            {selectedItem?.edited && (
              <span
                style={{
                  marginLeft: 8,
                  padding: '1px 6px',
                  borderRadius: 3,
                  background: '#fef3c7',
                  color: '#92400e',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                }}
              >
                ÉDITÉ
              </span>
            )}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.85rem',
              color: 'var(--color-text, #2f3a34)',
              lineHeight: 1.5,
            }}
          >
            {selectedItem ? selectedItem.text : review.text}
          </p>
        </div>
      </label>

      {selected && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--color-border, #e5e1d8)' }}>
          {editing ? (
            <>
              <textarea
                value={selectedItem?.text ?? review.text}
                onChange={(e) => onUpdateText(e.target.value)}
                rows={4}
                maxLength={2000}
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
              <div style={{ marginTop: 6, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {selectedItem?.edited && (
                  <button
                    type="button"
                    onClick={onResetText}
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
                    Restaurer l&apos;original Google
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  style={{
                    padding: '4px 10px',
                    border: '1px solid var(--color-border, #e5e1d8)',
                    borderRadius: 4,
                    background: 'white',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  Terminé
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{
                padding: '4px 10px',
                border: '1px solid var(--color-border, #e5e1d8)',
                borderRadius: 4,
                background: 'white',
                fontSize: '0.72rem',
                cursor: 'pointer',
                color: 'var(--color-text, #2f3a34)',
              }}
            >
              Éditer le texte
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function googleReviewToAvis(review: GoogleReviewItem): MaquetteAvisItem {
  const author = review.author_name || 'Avis Google'
  return {
    source_id: review.name,
    author,
    author_initial: review.author_initial ?? getAuthorInitial(author) ?? undefined,
    rating: review.rating,
    text: review.text,
    date: review.publish_time,
    edited: false,
  }
}

function defaultSelection(reviews: GoogleReviewItem[]): MaquetteAvisItem[] {
  return reviews.slice(0, AVIS_LIMITS.MAX_COUNT).map(googleReviewToAvis)
}
