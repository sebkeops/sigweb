'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateMaquettePalette } from '@/lib/actions/maquette'
import { getTemplate } from '@/lib/maquette'
import type { Maquette, MaquettePaletteMode } from '@/types'
import styles from './identity.module.css'

interface Props {
  maquette: Maquette
  getUpdatedAt: () => string
  onSaved: (newUpdatedAt: string) => void
}

/**
 * Sélecteur de palette : 3 modes (catégorie / logo / personnalisée).
 *
 * Mode 'extracted' désactivé si la maquette n'a pas de logo (le mode est
 * impossible à appliquer sans extraction préalable). En 'custom', on
 * affiche 2 color pickers natifs.
 *
 * Sauvegarde immédiate (pas de debounce) — un changement de palette est un
 * acte délibéré, pas un keystroke. Le contexte d'édition gère le lock
 * optimiste via `expectedUpdatedAt`.
 */
export default function PaletteSelector({ maquette, getUpdatedAt, onSaved }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const template = getTemplate(maquette.template_variant)
  const categoryPrimary = template.palette.primary
  const categoryAccent = template.palette.accent

  const hasLogo = !!maquette.logo_url
  const hasExtracted = !!(maquette.palette_primary && maquette.palette_accent)

  // Couleurs effectivement appliquées au render (cohérent avec lib/maquette/render/palette)
  const effectivePrimary = maquette.palette_mode === 'category'
    ? categoryPrimary
    : (maquette.palette_primary ?? categoryPrimary)
  const effectiveAccent = maquette.palette_mode === 'category'
    ? categoryAccent
    : (maquette.palette_accent ?? categoryAccent)

  function applyMode(mode: MaquettePaletteMode) {
    setError(null)
    startTransition(async () => {
      const payload: Record<string, unknown> = { palette_mode: mode }
      // En custom, on initialise primary/accent depuis l'effectif courant
      // si pas encore définis (sinon le mode custom afficherait du noir).
      if (mode === 'custom') {
        if (!maquette.palette_primary) payload.palette_primary = effectivePrimary
        if (!maquette.palette_accent) payload.palette_accent = effectiveAccent
      }
      const r = await updateMaquettePalette(maquette.id, getUpdatedAt(), payload)
      if (!r.success) {
        setError(r.error)
        return
      }
      onSaved(r.updatedAt)
      router.refresh()
    })
  }

  function applyColor(field: 'palette_primary' | 'palette_accent', hex: string) {
    setError(null)
    startTransition(async () => {
      const r = await updateMaquettePalette(maquette.id, getUpdatedAt(), { [field]: hex })
      if (!r.success) {
        setError(r.error)
        return
      }
      onSaved(r.updatedAt)
      router.refresh()
    })
  }

  return (
    <div className={styles.paletteSelector}>
      <fieldset className={styles.modesFieldset} disabled={pending}>
        <legend className={styles.modesLegend}>Palette</legend>

        <label className={styles.modeOption}>
          <input
            type="radio"
            name="palette_mode"
            value="category"
            checked={maquette.palette_mode === 'category'}
            onChange={() => applyMode('category')}
          />
          <span className={styles.modeLabel}>Couleurs de la catégorie</span>
          <span className={styles.modeSwatches}>
            <span className={styles.swatch} style={{ background: categoryPrimary }} />
            <span className={styles.swatch} style={{ background: categoryAccent }} />
          </span>
        </label>

        <label className={`${styles.modeOption} ${!hasLogo || !hasExtracted ? styles.modeDisabled : ''}`}>
          <input
            type="radio"
            name="palette_mode"
            value="extracted"
            checked={maquette.palette_mode === 'extracted'}
            onChange={() => applyMode('extracted')}
            disabled={!hasLogo || !hasExtracted}
          />
          <span className={styles.modeLabel}>
            Couleurs extraites du logo
            {!hasLogo && <span className={styles.modeHint}> (uploade un logo)</span>}
            {hasLogo && !hasExtracted && <span className={styles.modeHint}> (extraction non concluante)</span>}
          </span>
          {hasExtracted && (
            <span className={styles.modeSwatches}>
              <span className={styles.swatch} style={{ background: maquette.palette_primary! }} />
              <span className={styles.swatch} style={{ background: maquette.palette_accent! }} />
            </span>
          )}
        </label>

        <label className={styles.modeOption}>
          <input
            type="radio"
            name="palette_mode"
            value="custom"
            checked={maquette.palette_mode === 'custom'}
            onChange={() => applyMode('custom')}
          />
          <span className={styles.modeLabel}>Personnalisée</span>
        </label>
      </fieldset>

      {maquette.palette_mode === 'custom' && (
        <div className={styles.customPickers}>
          <label className={styles.colorPicker}>
            <span>Couleur principale</span>
            <input
              type="color"
              defaultValue={maquette.palette_primary ?? effectivePrimary}
              onBlur={(e) => applyColor('palette_primary', e.target.value.toUpperCase())}
              disabled={pending}
            />
          </label>
          <label className={styles.colorPicker}>
            <span>Couleur d&apos;accent</span>
            <input
              type="color"
              defaultValue={maquette.palette_accent ?? effectiveAccent}
              onBlur={(e) => applyColor('palette_accent', e.target.value.toUpperCase())}
              disabled={pending}
            />
          </label>
        </div>
      )}

      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  )
}
