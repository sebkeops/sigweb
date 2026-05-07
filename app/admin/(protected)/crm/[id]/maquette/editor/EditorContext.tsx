'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { updateMaquetteContent, updateMaquettePhotos } from '@/lib/actions/maquette'
import type { EditableField } from '@/lib/maquette/content-schema'
import type { MaquettePhotoAssignment, MaquettePhotoEntry } from '@/types'

/**
 * Context d'édition partagé par toutes les sections + l'EditorHeader.
 *
 * Responsabilités :
 *   - Collecter les changements via `update(field, value)`
 *   - Batch + debounce 500 ms → 1 seul UPDATE BDD
 *   - Retry automatique 2× avec backoff (1s, 3s) sur erreurs transitoires
 *   - Stale detection (multi-onglet) via comparaison `updated_at`
 *   - `beforeunload` guard si changements non sauvegardés
 *   - `contentVersion` incrémenté à chaque save réussi → force iframe remount
 */

const DEBOUNCE_MS = 500
const RETRY_DELAYS_MS = [1000, 3000] as const // 2 retries

export type EditorStatus = 'idle' | 'saving' | 'saved' | 'error' | 'stale'

export interface EditorContextValue {
  status: EditorStatus
  /** Last successful save (ISO timestamp), null si jamais sauvegardé. */
  lastSavedAt: string | null
  /** Message d'erreur affichable (null si pas d'erreur). */
  error: string | null
  /** Incrément à chaque save réussi — passé à <iframe key={...}> pour remount. */
  contentVersion: number
  /** Mise à jour d'un champ texte. Schedule un save debouncé (500 ms). */
  update: (field: EditableField, value: unknown) => void
  /** Mise à jour des photos. Save immédiat (sérialisé via la queue interne). */
  updatePhotos: (pool: MaquettePhotoEntry[], assignments: MaquettePhotoAssignment[]) => void
  /**
   * Notifie le contexte qu'une server action a sauvegardé en externe (logo,
   * palette, upload photo, etc.) — synchronise `expectedUpdatedAt` et
   * trigger un remount d'iframe via `contentVersion`. À appeler après
   * chaque save réussi qui n'est pas géré par le contexte (debounce
   * contenu / queue photos).
   */
  notifyExternalSave: (newUpdatedAt: string) => void
  /**
   * Renvoie l'`updated_at` courant connu du contexte (frais à la frappe).
   * À utiliser AVANT tout appel server action externe pour éviter de partir
   * avec un updatedAt périmé par un drag-drop ou un autre save concurrent.
   */
  getCurrentUpdatedAt: () => string
  /** Force un save immédiat (utilisé par le bouton "Réessayer"). */
  retry: () => void
  /** Recharge la page (utilisé par le bouton "Recharger" en mode stale). */
  reload: () => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor must be used inside <EditorProvider>')
  return ctx
}

interface ProviderProps {
  maquetteId: string
  initialUpdatedAt: string
  children: ReactNode
}

export function EditorProvider({ maquetteId, initialUpdatedAt, children }: ProviderProps) {
  const [status, setStatus] = useState<EditorStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [contentVersion, setContentVersion] = useState(0)

  // Refs pour les valeurs "live" qui ne doivent pas re-trigger les effets.
  // Deux types de pending : contenu textuel (mergeable) et photos (snapshot
  // complet). On les sérialise via le même verrou `isSavingRef`.
  const pendingRef = useRef<Record<string, unknown>>({})
  const pendingPhotosRef = useRef<{
    pool: MaquettePhotoEntry[]
    assignments: MaquettePhotoAssignment[]
  } | null>(null)
  const expectedUpdatedAtRef = useRef<string>(initialUpdatedAt)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)
  const queueAfterCurrentSaveRef = useRef(false)

  const hasPending = useCallback(
    () => Object.keys(pendingRef.current).length > 0 || pendingPhotosRef.current !== null,
    []
  )

  /**
   * Save unifié sérialisé. Traite ce qui est en pending (contenu d'abord,
   * puis photos). Empêche tout save parallèle via `isSavingRef`.
   *
   * Retry automatique 2× avec backoff (1s, 3s) sur erreurs 'other'.
   * Pas de retry sur 'stale' (l'admin doit recharger) ni 'validation'.
   */
  const executeSave = useCallback(async (attempt = 0): Promise<void> => {
    const hasContent = Object.keys(pendingRef.current).length > 0
    const hasPhotos = pendingPhotosRef.current !== null
    if (!hasContent && !hasPhotos) return

    if (isSavingRef.current) {
      queueAfterCurrentSaveRef.current = true
      return
    }
    isSavingRef.current = true
    setStatus('saving')
    setError(null)

    // 1) Save contenu textuel si pending
    if (hasContent) {
      const snapshot = { ...pendingRef.current }
      pendingRef.current = {}

      const result = await updateMaquetteContent(
        maquetteId,
        expectedUpdatedAtRef.current,
        snapshot
      )

      if (!result.success) {
        // Réinjecter le snapshot pour ne pas perdre les édits
        pendingRef.current = { ...snapshot, ...pendingRef.current }
        isSavingRef.current = false

        if (result.code === 'stale') {
          setStatus('stale')
          setError(result.error)
          return
        }
        if (result.code === 'validation') {
          setStatus('error')
          setError(result.error)
          return
        }
        if (attempt < RETRY_DELAYS_MS.length) {
          retryTimerRef.current = setTimeout(() => {
            void executeSave(attempt + 1)
          }, RETRY_DELAYS_MS[attempt])
          setStatus('saving')
          return
        }
        setStatus('error')
        setError(result.error)
        return
      }
      expectedUpdatedAtRef.current = result.updatedAt
      setLastSavedAt(result.updatedAt)
    }

    // 2) Save photos si pending
    if (pendingPhotosRef.current) {
      const snapshot = pendingPhotosRef.current
      pendingPhotosRef.current = null

      const result = await updateMaquettePhotos(
        maquetteId,
        expectedUpdatedAtRef.current,
        { available_photos: snapshot.pool, photo_assignments: snapshot.assignments }
      )

      if (!result.success) {
        // Réinjecter le snapshot s'il n'y a pas eu d'écrasement par un nouveau drop
        if (pendingPhotosRef.current === null) {
          pendingPhotosRef.current = snapshot
        }
        isSavingRef.current = false

        if (result.code === 'stale') {
          setStatus('stale')
          setError(result.error)
          return
        }
        if (result.code === 'validation') {
          setStatus('error')
          setError(result.error)
          return
        }
        if (attempt < RETRY_DELAYS_MS.length) {
          retryTimerRef.current = setTimeout(() => {
            void executeSave(attempt + 1)
          }, RETRY_DELAYS_MS[attempt])
          setStatus('saving')
          return
        }
        setStatus('error')
        setError(result.error)
        return
      }
      expectedUpdatedAtRef.current = result.updatedAt
      setLastSavedAt(result.updatedAt)
    }

    isSavingRef.current = false
    setContentVersion((v) => v + 1)

    // Si du nouveau pending est arrivé pendant le save, on enchaîne.
    const stillHasContent = Object.keys(pendingRef.current).length > 0
    const stillHasPhotos = pendingPhotosRef.current !== null
    if (queueAfterCurrentSaveRef.current || stillHasContent || stillHasPhotos) {
      queueAfterCurrentSaveRef.current = false
      setTimeout(() => void executeSave(0), 0)
    } else {
      setStatus('saved')
    }
  }, [maquetteId])

  const update = useCallback((field: EditableField, value: unknown) => {
    pendingRef.current = { ...pendingRef.current, [field]: value }
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      void executeSave(0)
    }, DEBOUNCE_MS)
  }, [executeSave])

  /**
   * Mise à jour des photos : on remplace TOUJOURS le snapshot complet (pas
   * de merge à granularité fine). Save immédiat (pas de debounce) — c'est
   * cohérent avec un drag&drop où chaque drop = un état final.
   *
   * Sérialisation : si un save est en cours, on remplace simplement
   * `pendingPhotosRef.current` ; le save courant verra le nouveau snapshot
   * via la queue post-save (cf. `queueAfterCurrentSaveRef`).
   */
  const updatePhotos = useCallback((
    pool: MaquettePhotoEntry[],
    assignments: MaquettePhotoAssignment[]
  ) => {
    pendingPhotosRef.current = { pool, assignments }
    void executeSave(0)
  }, [executeSave])

  const retry = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    void executeSave(0)
  }, [executeSave])

  const reload = useCallback(() => {
    window.location.reload()
  }, [])

  const notifyExternalSave = useCallback((newUpdatedAt: string) => {
    expectedUpdatedAtRef.current = newUpdatedAt
    setLastSavedAt(newUpdatedAt)
    setContentVersion((v) => v + 1)
    setStatus('saved')
    setError(null)
  }, [])

  const getCurrentUpdatedAt = useCallback(() => expectedUpdatedAtRef.current, [])

  // Guard window.beforeunload : avertit si pending non vide ou save en cours.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (hasPending() || isSavingRef.current) {
        e.preventDefault()
        // Texte ignoré par les browsers modernes mais requis pour déclencher le prompt.
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasPending])

  // Cleanup timers à l'unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [])

  const value = useMemo<EditorContextValue>(() => ({
    status,
    lastSavedAt,
    error,
    contentVersion,
    update,
    updatePhotos,
    notifyExternalSave,
    getCurrentUpdatedAt,
    retry,
    reload,
  }), [status, lastSavedAt, error, contentVersion, update, updatePhotos, notifyExternalSave, getCurrentUpdatedAt, retry, reload])

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}
