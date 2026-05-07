import { describe, expect, it } from 'vitest'
import {
  assertAssignmentsPointToPool,
  availablePhotosSchema,
  photoAssignmentsSchema,
  photoEntrySchema,
} from './schema'

const VALID_UUID = '00000000-0000-4000-8000-000000000001'

describe('photoEntrySchema', () => {
  it('valide une entrée Google minimale', () => {
    const r = photoEntrySchema.safeParse({
      id: VALID_UUID,
      source: 'google',
      reference: 'places/X/photos/Y',
    })
    expect(r.success).toBe(true)
  })

  it('valide une entrée upload avec uploaded_at', () => {
    const r = photoEntrySchema.safeParse({
      id: VALID_UUID,
      source: 'upload',
      reference: 'https://abc.supabase.co/file.webp',
      uploaded_at: '2026-05-06T12:00:00Z',
    })
    expect(r.success).toBe(true)
  })

  it('rejette un id non-UUID', () => {
    const r = photoEntrySchema.safeParse({
      id: 'not-a-uuid',
      source: 'google',
      reference: 'places/X/photos/Y',
    })
    expect(r.success).toBe(false)
  })

  it('rejette une source inconnue', () => {
    const r = photoEntrySchema.safeParse({
      id: VALID_UUID,
      source: 'whatever',
      reference: 'places/X/photos/Y',
    })
    expect(r.success).toBe(false)
  })

  it('rejette une reference vide', () => {
    const r = photoEntrySchema.safeParse({
      id: VALID_UUID,
      source: 'google',
      reference: '',
    })
    expect(r.success).toBe(false)
  })
})

describe('photoAssignmentsSchema', () => {
  function makeFull(): unknown[] {
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

  it('valide les 7 slots requis', () => {
    expect(photoAssignmentsSchema.safeParse(makeFull()).success).toBe(true)
  })

  it('rejette si un slot manque', () => {
    const arr = makeFull()
    arr.pop()
    expect(photoAssignmentsSchema.safeParse(arr).success).toBe(false)
  })

  it('rejette les slots dupliqués', () => {
    const arr = makeFull()
    arr[6] = { slot: 'hero', photo_id: null } // 2x hero
    const r = photoAssignmentsSchema.safeParse(arr)
    expect(r.success).toBe(false)
  })

  it('photo_id non-UUID rejeté', () => {
    const arr = makeFull()
    arr[0] = { slot: 'hero', photo_id: 'not-uuid' }
    expect(photoAssignmentsSchema.safeParse(arr).success).toBe(false)
  })
})

describe('availablePhotosSchema', () => {
  it('accepte un tableau vide', () => {
    expect(availablePhotosSchema.safeParse([]).success).toBe(true)
  })
  it('rejette si une entrée est invalide', () => {
    const r = availablePhotosSchema.safeParse([
      { id: VALID_UUID, source: 'google', reference: 'places/X/photos/Y' },
      { id: 'oops' },
    ])
    expect(r.success).toBe(false)
  })
})

describe('assertAssignmentsPointToPool', () => {
  it('passe si toutes les photo_id sont dans le pool ou null', () => {
    expect(() =>
      assertAssignmentsPointToPool(
        [{ id: 'a' }, { id: 'b' }],
        [{ photo_id: 'a' }, { photo_id: null }, { photo_id: 'b' }]
      )
    ).not.toThrow()
  })

  it('throw si une photo_id pointe vers un id absent', () => {
    expect(() =>
      assertAssignmentsPointToPool(
        [{ id: 'a' }],
        [{ photo_id: 'a' }, { photo_id: 'ghost' }]
      )
    ).toThrow(/orpheline/)
  })
})
