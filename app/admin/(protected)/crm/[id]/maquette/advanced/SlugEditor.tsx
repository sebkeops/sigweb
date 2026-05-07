'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { updateMaquetteSlug } from '@/lib/actions/maquette'
import { generateSlugBase } from '@/lib/maquette'
import type { Maquette } from '@/types'
import { useEditor } from '../editor/EditorContext'

interface Props {
  maquette: Maquette
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sigweb.fr'

/**
 * Édition du slug de la maquette.
 *
 * ⚠️ Acte destructif : le slug pilote l'URL publique /demos/[slug] et les
 * QR codes imprimés. Toute modification CASSE les liens distribués.
 *
 * UX :
 *   1. Input texte avec normalisation live (preview du slug effectif via
 *      `generateSlugBase`) → ce que le user voit c'est ce qui partira au save
 *   2. Affichage de l'URL future complète
 *   3. Au clic "Modifier le slug" : modale de confirmation
 *      - Si publiée : double validation (taper l'ancien slug pour confirmer
 *        qu'on sait qu'on casse cet URL — pattern GitHub)
 *      - Si brouillon : confirmation simple
 */
export default function SlugEditor({ maquette }: Props) {
  const router = useRouter()
  const { getCurrentUpdatedAt, notifyExternalSave } = useEditor()
  const [rawInput, setRawInput] = useState(maquette.slug)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTyped, setConfirmTyped] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Normalisation live (le user voit ce qui sera envoyé)
  const normalizedSlug = generateSlugBase(rawInput)
  const isUnchanged = normalizedSlug === maquette.slug
  const isInvalid = normalizedSlug.length === 0
  const requiresStrongConfirm = maquette.published

  function openConfirm() {
    if (isUnchanged || isInvalid) return
    setError(null)
    setConfirmTyped('')
    setConfirmOpen(true)
  }

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const r = await updateMaquetteSlug(maquette.id, getCurrentUpdatedAt(), normalizedSlug)
      if (!r.success) {
        setError(r.error)
        return
      }
      notifyExternalSave(r.data.updatedAt)
      setConfirmOpen(false)
      // Le router refresh recharge la page éditeur avec le nouveau slug en BDD
      router.refresh()
    })
  }

  // Validation de la modale de confirmation forte (pattern GitHub) :
  // l'admin doit retaper l'ANCIEN slug pour confirmer qu'il sait quel URL
  // il casse.
  const strongConfirmValid = !requiresStrongConfirm || confirmTyped === maquette.slug

  return (
    <div>
      <div className="mb-2 font-body text-xs font-semibold uppercase tracking-wider text-muted">
        URL publique
      </div>
      <div className="mb-1">
        <code className="rounded bg-surface-strong px-2 py-1 font-body text-sm text-ink">
          /demos/{maquette.slug}
        </code>
      </div>

      <label className="mt-3 block">
        <span className="mb-1 block font-body text-xs font-semibold uppercase tracking-wider text-muted">
          Nouveau slug
        </span>
        <input
          type="text"
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          maxLength={120}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="le-loup-gourmand"
        />
        <span className="mt-1 block font-body text-xs text-muted">
          Format : minuscules, chiffres, tirets uniquement.
          {!isUnchanged && !isInvalid && (
            <>
              {' '}URL future :{' '}
              <code className="rounded bg-surface-strong px-1.5 py-0.5 text-ink">
                {SITE_URL}/demos/{normalizedSlug}
              </code>
            </>
          )}
        </span>
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={openConfirm}
          disabled={isUnchanged || isInvalid || pending}
          className="rounded-md border border-primary bg-primary px-4 py-2 font-body text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-50"
        >
          Modifier le slug
        </button>
        {!isUnchanged && (
          <button
            type="button"
            onClick={() => setRawInput(maquette.slug)}
            disabled={pending}
            className="font-body text-xs text-muted hover:text-ink disabled:opacity-50"
          >
            Annuler les modifications
          </button>
        )}
      </div>

      {requiresStrongConfirm && (
        <p className="mt-3 font-body text-xs text-amber-700">
          ⚠ Cette maquette est <strong>publiée</strong>. Modifier le slug cassera
          tous les liens distribués (QR codes d&apos;affiches, URLs partagées).
        </p>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => !pending && setConfirmOpen(false)}
        title="Modifier le slug de la maquette ?"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 font-body text-sm text-amber-900">
            <p className="font-semibold">Cette opération est destructive.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              <li>L&apos;URL <code className="rounded bg-amber-100 px-1">/demos/{maquette.slug}</code> renverra une 404</li>
              <li>Tous les <strong>QR codes imprimés</strong> pointant vers cet URL ne fonctionneront plus</li>
              <li>Tous les <strong>liens partagés</strong> à des prospects ne fonctionneront plus</li>
              <li>La nouvelle URL sera <code className="rounded bg-amber-100 px-1">/demos/{normalizedSlug}</code></li>
            </ul>
          </div>

          {requiresStrongConfirm && (
            <div>
              <label className="block">
                <span className="mb-1 block font-body text-xs font-semibold uppercase tracking-wider text-muted">
                  Pour confirmer, tape l&apos;ancien slug : <code>{maquette.slug}</code>
                </span>
                <input
                  type="text"
                  value={confirmTyped}
                  onChange={(e) => setConfirmTyped(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 font-body text-sm text-ink"
                  autoFocus
                />
              </label>
            </div>
          )}

          {error && <p className="font-body text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
              className="font-body text-sm text-muted hover:text-ink disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={pending || !strongConfirmValid}
              className="rounded-md bg-amber-700 px-4 py-2 font-body text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 disabled:opacity-50"
            >
              {pending ? 'Modification…' : 'Confirmer le changement de slug'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
