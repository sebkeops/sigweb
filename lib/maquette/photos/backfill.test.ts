import { describe, expect, it } from 'vitest'
import type { MaquettePhotoAssignment, MaquettePhotoEntry } from '@/types'
import { backfillGooglePhotos } from './backfill'

function makeIdGen() {
  let i = 0
  return () => `new-${++i}`
}

function emptyAssignments(): MaquettePhotoAssignment[] {
  return [
    { slot: 'hero',      photo_id: null },
    { slot: 'histoire',  photo_id: null },
    { slot: 'univers_1', photo_id: null },
    { slot: 'univers_2', photo_id: null },
    { slot: 'univers_3', photo_id: null },
    { slot: 'univers_4', photo_id: null },
    { slot: 'univers_5', photo_id: null },
  ]
}

describe('backfillGooglePhotos — 7 cas du brief', () => {
  it('1. pool vide initial → toutes les photos Google sont ajoutées', () => {
    const r = backfillGooglePhotos(
      {
        currentPool: [],
        currentAssignments: emptyAssignments(),
        freshGoogleRefs: ['places/A/photos/1', 'places/A/photos/2', 'places/A/photos/3'],
      },
      makeIdGen()
    )
    expect(r.available_photos).toHaveLength(3)
    expect(r.stats.photos_added).toBe(3)
    expect(r.stats.photos_removed).toBe(0)
  })

  it('2. photos identiques → aucun changement (idempotence)', () => {
    const pool: MaquettePhotoEntry[] = [
      { id: 'p1', source: 'google', reference: 'places/A/photos/1' },
      { id: 'p2', source: 'google', reference: 'places/A/photos/2' },
    ]
    const r = backfillGooglePhotos(
      {
        currentPool: pool,
        currentAssignments: emptyAssignments(),
        freshGoogleRefs: ['places/A/photos/1', 'places/A/photos/2'],
      },
      makeIdGen()
    )
    expect(r.stats.photos_added).toBe(0)
    expect(r.stats.photos_removed).toBe(0)
    // Les IDs des photos préservées doivent être identiques (stabilité du pool)
    expect(r.available_photos.map((p) => p.id).sort()).toEqual(['p1', 'p2'])
  })

  it('3. photo Google supprimée mais ASSIGNÉE → photo gardée', () => {
    const pool: MaquettePhotoEntry[] = [
      { id: 'p1', source: 'google', reference: 'places/A/photos/old' },
    ]
    const assignments: MaquettePhotoAssignment[] = [
      { slot: 'hero',      photo_id: 'p1' },
      { slot: 'histoire',  photo_id: null },
      { slot: 'univers_1', photo_id: null },
      { slot: 'univers_2', photo_id: null },
      { slot: 'univers_3', photo_id: null },
      { slot: 'univers_4', photo_id: null },
      { slot: 'univers_5', photo_id: null },
    ]
    const r = backfillGooglePhotos(
      {
        currentPool: pool,
        currentAssignments: assignments,
        freshGoogleRefs: ['places/A/photos/new'], // 'old' n'est plus là
      },
      makeIdGen()
    )
    expect(r.available_photos.map((p) => p.id)).toContain('p1') // gardée car assignée
    expect(r.stats.photos_removed).toBe(0)
    expect(r.stats.photos_added).toBe(1)
    // L'assignation reste vers p1
    expect(r.photo_assignments.find((a) => a.slot === 'hero')!.photo_id).toBe('p1')
  })

  it('4. photo Google supprimée ET non assignée → photo retirée', () => {
    const pool: MaquettePhotoEntry[] = [
      { id: 'p1', source: 'google', reference: 'places/A/photos/old' },
      { id: 'p2', source: 'google', reference: 'places/A/photos/keep' },
    ]
    const r = backfillGooglePhotos(
      {
        currentPool: pool,
        currentAssignments: emptyAssignments(),
        freshGoogleRefs: ['places/A/photos/keep'], // 'old' disparu
      },
      makeIdGen()
    )
    expect(r.available_photos.map((p) => p.id)).not.toContain('p1')
    expect(r.available_photos.map((p) => p.id)).toContain('p2')
    expect(r.stats.photos_removed).toBe(1)
    expect(r.stats.photos_added).toBe(0)
  })

  it('5. nouvelles photos Google → ajoutées au pool (non assignées)', () => {
    const pool: MaquettePhotoEntry[] = [
      { id: 'p1', source: 'google', reference: 'places/A/photos/1' },
    ]
    const r = backfillGooglePhotos(
      {
        currentPool: pool,
        currentAssignments: emptyAssignments(),
        freshGoogleRefs: ['places/A/photos/1', 'places/A/photos/2', 'places/A/photos/3'],
      },
      makeIdGen()
    )
    expect(r.available_photos).toHaveLength(3)
    expect(r.stats.photos_added).toBe(2)
    // Les nouvelles ne sont pas assignées (pas dans assignments existants)
    const assignedIds = new Set(r.photo_assignments.map((a) => a.photo_id).filter(Boolean))
    expect(assignedIds.size).toBe(0)
  })

  it('6. uploads jamais touchés', () => {
    const pool: MaquettePhotoEntry[] = [
      { id: 'u1', source: 'upload', reference: 'https://abc.supabase.co/file1.webp', uploaded_at: '2026-05-01T10:00:00Z' },
      { id: 'u2', source: 'upload', reference: 'https://abc.supabase.co/file2.webp' },
      { id: 'g1', source: 'google', reference: 'places/A/photos/1' },
    ]
    const r = backfillGooglePhotos(
      {
        currentPool: pool,
        currentAssignments: emptyAssignments(),
        freshGoogleRefs: [], // Google ne renvoie plus rien
      },
      makeIdGen()
    )
    // Les uploads sont intacts (id, source, reference, uploaded_at)
    expect(r.available_photos.find((p) => p.id === 'u1')).toEqual({
      id: 'u1', source: 'upload', reference: 'https://abc.supabase.co/file1.webp', uploaded_at: '2026-05-01T10:00:00Z',
    })
    expect(r.available_photos.find((p) => p.id === 'u2')).toBeDefined()
    // La photo Google non assignée est retirée
    expect(r.available_photos.find((p) => p.id === 'g1')).toBeUndefined()
  })

  it('7. assignation orpheline → la sécurité Step 4 nettoie', () => {
    // Cas pathologique : assignation pointe vers un id absent du pool
    const pool: MaquettePhotoEntry[] = [
      { id: 'p1', source: 'google', reference: 'places/A/photos/1' },
    ]
    const assignments: MaquettePhotoAssignment[] = [
      { slot: 'hero',      photo_id: 'ghost' }, // n'existe pas dans le pool
      { slot: 'histoire',  photo_id: 'p1' },
      { slot: 'univers_1', photo_id: null },
      { slot: 'univers_2', photo_id: null },
      { slot: 'univers_3', photo_id: null },
      { slot: 'univers_4', photo_id: null },
      { slot: 'univers_5', photo_id: null },
    ]
    const r = backfillGooglePhotos(
      {
        currentPool: pool,
        currentAssignments: assignments,
        freshGoogleRefs: ['places/A/photos/1'],
      },
      makeIdGen()
    )
    // hero pointait vers 'ghost' → désassigné
    expect(r.photo_assignments.find((a) => a.slot === 'hero')!.photo_id).toBeNull()
    // histoire pointait vers p1 (toujours présent) → conservé
    expect(r.photo_assignments.find((a) => a.slot === 'histoire')!.photo_id).toBe('p1')
  })
})

describe('backfillGooglePhotos — ordre du pool reconstruit', () => {
  it('uploads en tête, puis Google gardés, puis nouveaux Google', () => {
    const pool: MaquettePhotoEntry[] = [
      { id: 'g_old', source: 'google', reference: 'places/A/photos/old' },
      { id: 'u1',    source: 'upload', reference: 'https://x.com/u1.webp' },
      { id: 'g1',    source: 'google', reference: 'places/A/photos/1' },
    ]
    const r = backfillGooglePhotos(
      {
        currentPool: pool,
        currentAssignments: emptyAssignments(),
        freshGoogleRefs: ['places/A/photos/1', 'places/A/photos/new'],
      },
      makeIdGen()
    )
    // Ordre : [u1] (uploads) + [g1] (kept) + [new] (added)
    expect(r.available_photos[0].id).toBe('u1')
    expect(r.available_photos[1].id).toBe('g1')
    expect(r.available_photos[2].source).toBe('google')
    expect(r.available_photos[2].reference).toBe('places/A/photos/new')
  })
})
