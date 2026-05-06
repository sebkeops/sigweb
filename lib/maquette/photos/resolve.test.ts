import { describe, expect, it } from 'vitest'
import type { MaquettePhotoAssignment, MaquettePhotoEntry } from '@/types'
import { resolvePhotoForSlot } from './resolve'

const pool: MaquettePhotoEntry[] = [
  { id: 'p1', source: 'google', reference: 'places/A/photos/1' },
  { id: 'p2', source: 'upload', reference: 'https://abc.supabase.co/u.webp' },
]

const assignments: MaquettePhotoAssignment[] = [
  { slot: 'hero',      photo_id: 'p1' },
  { slot: 'histoire',  photo_id: 'p2' },
  { slot: 'univers_1', photo_id: null },
  { slot: 'univers_2', photo_id: 'ghost' }, // photo orpheline
  { slot: 'univers_3', photo_id: null },
  { slot: 'univers_4', photo_id: null },
  { slot: 'univers_5', photo_id: null },
]

describe('resolvePhotoForSlot', () => {
  it('résout une photo Google assignée', () => {
    const r = resolvePhotoForSlot('hero', pool, assignments)
    expect(r?.id).toBe('p1')
    expect(r?.source).toBe('google')
  })

  it('résout une photo upload assignée', () => {
    const r = resolvePhotoForSlot('histoire', pool, assignments)
    expect(r?.id).toBe('p2')
    expect(r?.source).toBe('upload')
  })

  it('null si slot non assigné', () => {
    expect(resolvePhotoForSlot('univers_1', pool, assignments)).toBeNull()
  })

  it('null si photo_id orphelin (sécurité)', () => {
    expect(resolvePhotoForSlot('univers_2', pool, assignments)).toBeNull()
  })

  it('null si pool null', () => {
    expect(resolvePhotoForSlot('hero', null, assignments)).toBeNull()
  })

  it('null si assignments null', () => {
    expect(resolvePhotoForSlot('hero', pool, null)).toBeNull()
  })

  it('null si slot absent dans assignments (cas dégradé pré-migration)', () => {
    const partial: MaquettePhotoAssignment[] = [
      { slot: 'hero', photo_id: 'p1' },
    ]
    expect(resolvePhotoForSlot('univers_3', pool, partial)).toBeNull()
  })
})
