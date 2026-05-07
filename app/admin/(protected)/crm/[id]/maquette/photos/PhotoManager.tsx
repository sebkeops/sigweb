'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useRouter } from 'next/navigation'
import { resolvePhotoUrl } from '@/lib/maquette/render/resolvePhotoUrl'
import {
  deleteMaquettePhotoUpload,
  uploadMaquettePhoto,
} from '@/lib/actions/maquette'
import type {
  Maquette,
  MaquettePhotoAssignment,
  MaquettePhotoEntry,
  MaquettePhotoSlot,
  MaquetteUniversItem,
} from '@/types'
import { useEditor } from '../editor/EditorContext'
import styles from './PhotoManager.module.css'

interface Props {
  maquette: Maquette
  /** Items univers — utilisés pour afficher le `name` de chaque slot Univers. */
  universItems: MaquetteUniversItem[]
}

const SLOT_LABELS: Record<MaquettePhotoSlot, string> = {
  hero: 'Hero',
  histoire: 'Histoire',
  univers_1: 'Univers 1',
  univers_2: 'Univers 2',
  univers_3: 'Univers 3',
  univers_4: 'Univers 4',
  univers_5: 'Univers 5',
}

const SLOT_ORDER: MaquettePhotoSlot[] = [
  'hero', 'histoire',
  'univers_1', 'univers_2', 'univers_3', 'univers_4', 'univers_5',
]

const SLOT_DESCRIPTIONS: Record<MaquettePhotoSlot, string> = {
  hero: 'Photo immersive principale (façade, ambiance, produit signature).',
  histoire: 'Photo de l\'équipe, de l\'intérieur ou du savoir-faire.',
  univers_1: 'Photo du produit phare de la 1ère carte (mise en avant grande largeur).',
  univers_2: 'Photo du produit de la 2ème carte.',
  univers_3: 'Photo du produit de la 3ème carte.',
  univers_4: 'Photo du produit de la 4ème carte.',
  univers_5: 'Photo du produit de la 5ème carte.',
}

const GALLERY_ID = '__gallery__'

/**
 * Drag & drop des photos vers les 7 slots de la maquette.
 *
 * Convention DND :
 *   - draggable id   : `photo:<photoEntryId>:from:<source>` où source = slot
 *                      ou GALLERY_ID. Le préfixe `from:` permet de savoir
 *                      d'où vient le drag (pour les swaps slot→slot).
 *   - droppable id   : `slot:<slot>` ou GALLERY_ID
 *
 * Comportements :
 *   - galerie → slot          : assigne (remplace si occupé, photo sortante reste dans le pool)
 *   - slot → autre slot       : swap (échange les 2 photo_id)
 *   - slot → galerie          : désassigne
 *   - bouton ✕ sur un slot    : désassigne (sans drag)
 *
 * Sauvegarde : à chaque action, on appelle `updatePhotos` du contexte qui
 * fait un save immédiat sérialisé. Les drops successifs rapides ne posent
 * pas de race grâce au lock optimiste serveur + queue cliente.
 */
export default function PhotoManager({ maquette, universItems }: Props) {
  // État local synchronisé avec la maquette ; on l'update optimistement
  // au drop puis on append vers le contexte qui persiste.
  const [pool, setPool] = useState<MaquettePhotoEntry[]>(maquette.available_photos ?? [])
  const [assignments, setAssignments] = useState<MaquettePhotoAssignment[]>(
    maquette.photo_assignments ?? SLOT_ORDER.map((slot) => ({ slot, photo_id: null }))
  )
  const { updatePhotos, getCurrentUpdatedAt, notifyExternalSave } = useEditor()
  const router = useRouter()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, startUpload] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  )

  // Map photo_id → slots où la photo est utilisée (pour le badge "Utilisée → X")
  const photoUsageBySlot = useMemo(() => {
    const m = new Map<string, MaquettePhotoSlot[]>()
    for (const a of assignments) {
      if (!a.photo_id) continue
      const arr = m.get(a.photo_id) ?? []
      arr.push(a.slot)
      m.set(a.photo_id, arr)
    }
    return m
  }, [assignments])

  function applyChange(
    nextPool: MaquettePhotoEntry[],
    nextAssignments: MaquettePhotoAssignment[]
  ) {
    setPool(nextPool)
    setAssignments(nextAssignments)
    updatePhotos(nextPool, nextAssignments)
  }

  function unassignSlot(slot: MaquettePhotoSlot) {
    const next = assignments.map((a) => (a.slot === slot ? { ...a, photo_id: null } : a))
    applyChange(pool, next)
  }

  function handleUpload(file: File) {
    setUploadError(null)
    const formData = new FormData()
    formData.append('file', file)
    startUpload(async () => {
      const r = await uploadMaquettePhoto(maquette.id, getCurrentUpdatedAt(), formData)
      if (!r.success) {
        setUploadError(r.error)
        return
      }
      // Append optimiste au pool local — le contexte est déjà notifié pour
      // l'updatedAt + iframe refresh via notifyExternalSave.
      const newEntry: MaquettePhotoEntry = {
        id: r.data.photoId,
        source: 'upload',
        reference: r.data.reference,
        uploaded_at: new Date().toISOString(),
      }
      setPool((p) => [...p, newEntry])
      notifyExternalSave(r.data.updatedAt)
      router.refresh()
    })
  }

  function handleDeleteUpload(photoId: string, photoLabel: string) {
    if (!confirm(`Supprimer la photo uploadée "${photoLabel}" ? Action irréversible.`)) return
    setUploadError(null)
    startUpload(async () => {
      const r = await deleteMaquettePhotoUpload(maquette.id, getCurrentUpdatedAt(), photoId)
      if (!r.success) {
        setUploadError(r.error)
        return
      }
      // Retire du pool local + désassigne tout slot pointant vers cette photo
      setPool((p) => p.filter((entry) => entry.id !== photoId))
      setAssignments((a) =>
        a.map((x) => (x.photo_id === photoId ? { ...x, photo_id: null } : x))
      )
      notifyExternalSave(r.updatedAt)
      router.refresh()
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const dragId = String(active.id)
    const dropId = String(over.id)
    const dragInfo = parseDragId(dragId)
    if (!dragInfo) return

    // Drop sur la galerie : si la source est un slot → désassigner ce slot.
    if (dropId === GALLERY_ID) {
      if (dragInfo.from !== GALLERY_ID) {
        unassignSlot(dragInfo.from as MaquettePhotoSlot)
      }
      return
    }

    // Drop sur un slot
    if (dropId.startsWith('slot:')) {
      const targetSlot = dropId.slice('slot:'.length) as MaquettePhotoSlot

      if (dragInfo.from === GALLERY_ID) {
        // Galerie → slot : assigne (remplace si occupé)
        const next = assignments.map((a) =>
          a.slot === targetSlot ? { ...a, photo_id: dragInfo.photoId } : a
        )
        applyChange(pool, next)
        return
      }

      // Slot → autre slot : swap (échange les 2 photo_id)
      const sourceSlot = dragInfo.from as MaquettePhotoSlot
      if (sourceSlot === targetSlot) return // no-op : même slot
      const sourcePhoto = assignments.find((a) => a.slot === sourceSlot)?.photo_id ?? null
      const targetPhoto = assignments.find((a) => a.slot === targetSlot)?.photo_id ?? null
      const next = assignments.map((a) => {
        if (a.slot === sourceSlot) return { ...a, photo_id: targetPhoto }
        if (a.slot === targetSlot) return { ...a, photo_id: sourcePhoto }
        return a
      })
      applyChange(pool, next)
    }
  }

  return (
    <div>
      <p className={styles.mobileNotice}>
        Édition photos optimisée pour ordinateur. Sur écran plus large vous pourrez
        glisser-déposer les vignettes vers les emplacements de la maquette.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className={styles.layout}>
          <Gallery
            pool={pool}
            usageBySlot={photoUsageBySlot}
            onUpload={handleUpload}
            onDeleteUpload={handleDeleteUpload}
            uploading={uploading}
            uploadError={uploadError}
          />
          <SlotsList
            slotOrder={SLOT_ORDER}
            assignments={assignments}
            pool={pool}
            universItems={universItems}
            onUnassign={unassignSlot}
          />
        </div>
      </DndContext>

      {pool.length === 0 && (
        <p className={styles.emptyPool}>
          Aucune photo dans le pool. Uploade une photo manuellement via le bouton
          <strong> « + Uploader une photo »</strong> à gauche, ou lance
          <strong> « Recharger photos Google »</strong> dans le header CRM si le prospect
          a un identifiant Google Places.
        </p>
      )}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

interface DragInfo {
  photoId: string
  from: MaquettePhotoSlot | typeof GALLERY_ID
}

function buildDragId(photoId: string, from: MaquettePhotoSlot | typeof GALLERY_ID): string {
  return `photo:${photoId}:from:${from}`
}

function parseDragId(id: string): DragInfo | null {
  const m = id.match(/^photo:([^:]+):from:(.+)$/)
  if (!m) return null
  return { photoId: m[1], from: m[2] as DragInfo['from'] }
}

function formatUsageBadge(slots: MaquettePhotoSlot[]): string {
  if (slots.length === 0) return ''
  if (slots.length === 1) return `Utilisée → ${SLOT_LABELS[slots[0]]}`
  if (slots.length === 2) return `Utilisée → ${slots.map((s) => SLOT_LABELS[s]).join(', ')}`
  return `Utilisée → ${slots.length} emplacements`
}

// ─── Galerie ────────────────────────────────────────────────────────────────

function Gallery({
  pool,
  usageBySlot,
  onUpload,
  onDeleteUpload,
  uploading,
  uploadError,
}: {
  pool: MaquettePhotoEntry[]
  usageBySlot: Map<string, MaquettePhotoSlot[]>
  onUpload: (file: File) => void
  onDeleteUpload: (photoId: string, label: string) => void
  uploading: boolean
  uploadError: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: GALLERY_ID })
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div
      ref={setNodeRef}
      className={`${styles.gallery} ${isOver ? styles.dropTarget : ''}`}
      aria-label="Photos disponibles"
    >
      <div className={styles.galleryHeader}>
        <h3 className={styles.columnTitle}>Photos disponibles</h3>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={styles.uploadButton}
        >
          {uploading ? 'Upload en cours…' : '+ Uploader une photo'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUpload(f)
            e.target.value = ''
          }}
        />
      </div>
      <p className={styles.columnHint}>
        {pool.length} photo{pool.length > 1 ? 's' : ''} dans le pool. Glisse une vignette
        vers un emplacement à droite, ou ramène une photo assignée ici pour la libérer.
        JPEG / PNG / WebP, 5 Mo max, 400×400 minimum.
      </p>
      {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
      <div className={styles.galleryGrid}>
        {pool.map((photo) => (
          <GalleryThumb
            key={photo.id}
            photo={photo}
            usedIn={usageBySlot.get(photo.id) ?? []}
            onDeleteUpload={onDeleteUpload}
          />
        ))}
      </div>
    </div>
  )
}

function GalleryThumb({
  photo,
  usedIn,
  onDeleteUpload,
}: {
  photo: MaquettePhotoEntry
  usedIn: MaquettePhotoSlot[]
  onDeleteUpload: (photoId: string, label: string) => void
}) {
  const dragId = buildDragId(photo.id, GALLERY_ID)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dragId })
  const url = resolvePhotoUrl(photo.reference, { width: 300 })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`${styles.thumb} ${isDragging ? styles.thumbDragging : ''}`}
    >
      {/* Le drag se fait via le grip pour ne pas piéger le clic sur le bouton supprimer */}
      <div className={styles.thumbDragArea} {...listeners}>
        {url
          ? <img src={url} alt="" className={styles.thumbImg} />
          : <div className={styles.thumbFallback} />
        }
      </div>
      <span className={`${styles.sourceBadge} ${photo.source === 'upload' ? styles.sourceUpload : styles.sourceGoogle}`}>
        {photo.source === 'upload' ? 'Upload' : 'Google'}
      </span>
      {photo.source === 'upload' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDeleteUpload(photo.id, photo.reference.split('/').pop() ?? 'photo')
          }}
          aria-label="Supprimer cette photo uploadée"
          className={styles.deleteUploadBtn}
        >
          ✕
        </button>
      )}
      {usedIn.length > 0 && (
        <span className={styles.usageBadge}>{formatUsageBadge(usedIn)}</span>
      )}
    </div>
  )
}

// ─── Slots ──────────────────────────────────────────────────────────────────

function SlotsList({
  slotOrder,
  assignments,
  pool,
  universItems,
  onUnassign,
}: {
  slotOrder: MaquettePhotoSlot[]
  assignments: MaquettePhotoAssignment[]
  pool: MaquettePhotoEntry[]
  universItems: MaquetteUniversItem[]
  onUnassign: (slot: MaquettePhotoSlot) => void
}) {
  return (
    <div className={styles.slots}>
      <h3 className={styles.columnTitle}>Emplacements de la maquette</h3>
      <p className={styles.columnHint}>
        Dépose une photo dans chaque emplacement. Tu peux aussi échanger 2 emplacements
        en glissant l&apos;un vers l&apos;autre.
      </p>
      {slotOrder.map((slot) => {
        const assignment = assignments.find((a) => a.slot === slot)
        const photo = assignment?.photo_id
          ? pool.find((p) => p.id === assignment.photo_id) ?? null
          : null
        const universIndex = slot.startsWith('univers_') ? Number(slot.slice('univers_'.length)) - 1 : -1
        const universName = universIndex >= 0 ? universItems[universIndex]?.name ?? null : null
        return (
          <SlotCard
            key={slot}
            slot={slot}
            label={SLOT_LABELS[slot]}
            description={SLOT_DESCRIPTIONS[slot]}
            universName={universName}
            photo={photo}
            onUnassign={() => onUnassign(slot)}
          />
        )
      })}
    </div>
  )
}

function SlotCard({
  slot,
  label,
  description,
  universName,
  photo,
  onUnassign,
}: {
  slot: MaquettePhotoSlot
  label: string
  description: string
  universName: string | null
  photo: MaquettePhotoEntry | null
  onUnassign: () => void
}) {
  const dropId = `slot:${slot}`
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: dropId })

  // La photo dans le slot est elle-même draggable (pour swap slot→slot ou slot→galerie)
  const dragId = photo ? buildDragId(photo.id, slot) : null
  const draggable = useDraggable({ id: dragId ?? `noop:${slot}`, disabled: !dragId })
  const dragStyle = draggable.transform
    ? { transform: `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)` }
    : undefined
  const url = photo ? resolvePhotoUrl(photo.reference, { width: 600 }) : null

  return (
    <div
      ref={setDropRef}
      className={`${styles.slotCard} ${isOver ? styles.dropTarget : ''}`}
    >
      <div className={styles.slotHeader}>
        <div>
          <div className={styles.slotLabel}>
            {label}
            {universName && <span className={styles.slotUniversName}> — {universName}</span>}
          </div>
          <div className={styles.slotDescription}>{description}</div>
        </div>
        {photo && (
          <button
            type="button"
            onClick={onUnassign}
            aria-label={`Retirer la photo de ${label}`}
            className={styles.removeButton}
          >
            ✕
          </button>
        )}
      </div>
      <div className={styles.slotBody}>
        {photo ? (
          <div
            ref={draggable.setNodeRef}
            style={dragStyle}
            {...draggable.listeners}
            {...draggable.attributes}
            className={`${styles.slotPhoto} ${draggable.isDragging ? styles.thumbDragging : ''}`}
          >
            {url
              ? <img src={url} alt="" className={styles.slotPhotoImg} />
              : <div className={styles.thumbFallback} />
            }
          </div>
        ) : (
          <div className={styles.slotEmpty}>
            Glisser une photo ici
          </div>
        )}
      </div>
    </div>
  )
}
