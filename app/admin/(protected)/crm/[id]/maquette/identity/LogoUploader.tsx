'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteMaquetteLogo, uploadMaquetteLogo } from '@/lib/actions/maquette'
import type { Maquette } from '@/types'
import styles from './identity.module.css'

interface Props {
  maquette: Maquette
  /** Renvoie l'updatedAt courant du contexte (toujours frais). */
  getUpdatedAt: () => string
  /** Callback appelé après save réussi pour mettre à jour expectedUpdatedAt côté contexte. */
  onSaved: (newUpdatedAt: string) => void
}

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp'

export default function LogoUploader({ maquette, getUpdatedAt, onSaved }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [stale, setStale] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setError(null)
    setStale(false)
    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      const r = await uploadMaquetteLogo(maquette.id, getUpdatedAt(), formData)
      if (!r.success) {
        if (r.code === 'stale') {
          setStale(true)
          setError(r.error)
        } else {
          setError(r.error)
        }
        return
      }
      onSaved(r.data.updatedAt)
      router.refresh()
    })
  }

  function handleDelete() {
    setError(null)
    setStale(false)
    startTransition(async () => {
      const r = await deleteMaquetteLogo(maquette.id, getUpdatedAt())
      if (!r.success) {
        if (r.code === 'stale') {
          setStale(true)
          setError(r.error)
        } else {
          setError(r.error)
        }
        return
      }
      onSaved(r.updatedAt)
      router.refresh()
    })
  }

  return (
    <div className={styles.logoUploader}>
      <div className={styles.logoPreview}>
        {maquette.logo_url ? (
          <img src={maquette.logo_url} alt="Logo de la maquette" />
        ) : (
          <div className={styles.logoFallback} aria-label="Pas de logo uploadé">
            {maquette.logo_initial ?? '?'}
          </div>
        )}
      </div>

      <div className={styles.logoActions}>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = '' // permet de re-uploader le même fichier après suppression
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className={styles.btnPrimary}
        >
          {pending ? '…' : (maquette.logo_url ? 'Remplacer le logo' : 'Uploader un logo')}
        </button>
        {maquette.logo_url && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className={styles.btnGhost}
          >
            Retirer
          </button>
        )}
      </div>

      <p className={styles.logoHint}>
        JPEG, PNG ou WebP. 5 Mo max. 64×64 minimum, 4000×4000 maximum.
        Le logo est redimensionné en WebP 512 px max et les couleurs dominantes
        sont automatiquement extraites pour proposer une palette personnalisée.
      </p>

      {stale && (
        <div className={styles.errorBanner}>
          {error}
          <button
            type="button"
            onClick={() => router.refresh()}
            className={styles.errorAction}
          >
            Recharger
          </button>
        </div>
      )}
      {error && !stale && <p className={styles.errorMessage}>{error}</p>}
    </div>
  )
}
