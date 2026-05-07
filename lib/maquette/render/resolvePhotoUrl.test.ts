import { describe, expect, it } from 'vitest'
import { resolvePhotoUrl } from './resolvePhotoUrl'

describe('resolvePhotoUrl', () => {
  it('ref Google → proxy /api/demos/photo avec encodage', () => {
    const url = resolvePhotoUrl('places/ChIJ123/photos/AbCd-_xyz')
    expect(url).toBe('/api/demos/photo?ref=places%2FChIJ123%2Fphotos%2FAbCd-_xyz&w=1200')
  })

  it('URL Supabase Storage absolue → pass-through', () => {
    const u = 'https://abc.supabase.co/storage/v1/object/public/maquettes-assets/logo.png'
    expect(resolvePhotoUrl(u)).toBe(u)
  })

  it('URL relative → pass-through', () => {
    expect(resolvePhotoUrl('/uploads/photo.jpg')).toBe('/uploads/photo.jpg')
  })

  it('largeur custom', () => {
    expect(resolvePhotoUrl('places/A/photos/B', { width: 400 }))
      .toBe('/api/demos/photo?ref=places%2FA%2Fphotos%2FB&w=400')
  })

  it('largeur clampée [40, 1600]', () => {
    expect(resolvePhotoUrl('places/A/photos/B', { width: 10 }))
      .toContain('w=40')
    expect(resolvePhotoUrl('places/A/photos/B', { width: 9999 }))
      .toContain('w=1600')
  })

  it('largeur fractionnaire arrondie vers le bas', () => {
    expect(resolvePhotoUrl('places/A/photos/B', { width: 800.7 }))
      .toContain('w=800')
  })

  it('null/undefined/empty → null', () => {
    expect(resolvePhotoUrl(null)).toBeNull()
    expect(resolvePhotoUrl(undefined)).toBeNull()
    expect(resolvePhotoUrl('')).toBeNull()
    expect(resolvePhotoUrl('   ')).toBeNull()
  })

  it('whitespace conservé absolument PAS — trim systématique', () => {
    expect(resolvePhotoUrl('  places/A/photos/B  '))
      .toBe('/api/demos/photo?ref=places%2FA%2Fphotos%2FB&w=1200')
  })
})
