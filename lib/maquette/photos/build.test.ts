import { describe, expect, it } from 'vitest'
import { buildInitialPhotoData, migrateLegacyPhotos, type PhotoData } from './build'

// IDs déterministes pour les snapshots de test
function makeIdGen() {
  let i = 0
  return () => `id-${++i}`
}

describe('buildInitialPhotoData', () => {
  it('mappe les 7 premières photos aux 7 slots', () => {
    const refs = Array.from({ length: 8 }, (_, i) => `places/X/photos/${i + 1}`)
    const r = buildInitialPhotoData(refs, makeIdGen())

    expect(r.available_photos).toHaveLength(8) // toutes les photos vont au pool
    expect(r.photo_assignments).toHaveLength(7) // 7 slots fixes
    expect(r.photo_assignments[0]).toEqual({ slot: 'hero',      photo_id: 'id-1' })
    expect(r.photo_assignments[1]).toEqual({ slot: 'histoire',  photo_id: 'id-2' })
    expect(r.photo_assignments[2]).toEqual({ slot: 'univers_1', photo_id: 'id-3' })
    expect(r.photo_assignments[6]).toEqual({ slot: 'univers_5', photo_id: 'id-7' })
  })

  it('laisse les slots restants à null si moins de 7 photos', () => {
    const refs = ['places/A/photos/1', 'places/A/photos/2']
    const r = buildInitialPhotoData(refs, makeIdGen())

    expect(r.available_photos).toHaveLength(2)
    expect(r.photo_assignments[0].photo_id).toBe('id-1') // hero
    expect(r.photo_assignments[1].photo_id).toBe('id-2') // histoire
    expect(r.photo_assignments[2].photo_id).toBeNull()   // univers_1
    expect(r.photo_assignments[6].photo_id).toBeNull()   // univers_5
  })

  it('liste vide → 7 slots tous null, pool vide', () => {
    const r = buildInitialPhotoData([], makeIdGen())
    expect(r.available_photos).toHaveLength(0)
    expect(r.photo_assignments).toHaveLength(7)
    for (const a of r.photo_assignments) expect(a.photo_id).toBeNull()
  })

  it('déduplique les références identiques', () => {
    const refs = ['places/A/photos/1', 'places/A/photos/1', 'places/B/photos/2']
    const r = buildInitialPhotoData(refs, makeIdGen())
    expect(r.available_photos).toHaveLength(2)
    expect(r.available_photos[0].reference).toBe('places/A/photos/1')
    expect(r.available_photos[1].reference).toBe('places/B/photos/2')
  })

  it('marque les refs Google (préfixe places/) avec source = google', () => {
    const r = buildInitialPhotoData(['places/A/photos/1'], makeIdGen())
    expect(r.available_photos[0].source).toBe('google')
  })

  it('marque les URLs https comme upload (cas seeding simulation)', () => {
    // Cf. `buildFictiveSimulation` qui passe les URLs Supabase Storage des
    // photos Unsplash via le paramètre `googlePhotoRefs`. Sans détection
    // automatique, ces URLs étaient à tort taguées `google` et polluaient
    // ensuite tous les fallbacks Sirene.
    const r = buildInitialPhotoData(
      ['https://abc.supabase.co/storage/v1/object/public/project-images/sim/hero.jpg'],
      makeIdGen()
    )
    expect(r.available_photos[0].source).toBe('upload')
  })

  it('détection mixte si refs Google et URLs https sont mélangées', () => {
    const r = buildInitialPhotoData(
      ['places/A/photos/1', 'https://abc.supabase.co/storage/sim.jpg'],
      makeIdGen()
    )
    expect(r.available_photos[0].source).toBe('google')
    expect(r.available_photos[1].source).toBe('upload')
  })
})

describe('buildInitialPhotoData — fallback simulation (prospects Sirene)', () => {
  const fallback: PhotoData = {
    available_photos: [
      { id: 'sim-1', source: 'upload', reference: 'https://sigweb.fr/sim/hero.jpg' },
      { id: 'sim-2', source: 'upload', reference: 'https://sigweb.fr/sim/hist.jpg' },
      { id: 'sim-3', source: 'upload', reference: 'https://sigweb.fr/sim/u1.jpg' },
    ],
    photo_assignments: [
      { slot: 'hero', photo_id: 'sim-1' },
      { slot: 'histoire', photo_id: 'sim-2' },
      { slot: 'univers_1', photo_id: 'sim-3' },
      { slot: 'univers_2', photo_id: null },
      { slot: 'univers_3', photo_id: null },
      { slot: 'univers_4', photo_id: null },
      { slot: 'univers_5', photo_id: null },
    ],
  }

  it('utilise le fallback simulation si pas de photos Google', () => {
    const r = buildInitialPhotoData([], makeIdGen(), fallback)
    // Mêmes photos aux mêmes emplacements
    expect(r.available_photos).toEqual(fallback.available_photos)
    expect(r.photo_assignments).toEqual(fallback.photo_assignments)
  })

  it('ignore le fallback si photos Google présentes (priorité Google)', () => {
    const r = buildInitialPhotoData(['places/A/photos/1'], makeIdGen(), fallback)
    expect(r.available_photos).toHaveLength(1)
    expect(r.available_photos[0].source).toBe('google')
    expect(r.available_photos[0].reference).toBe('places/A/photos/1')
  })

  it('fallback null + pas de Google → pool vide + tous les slots null', () => {
    const r = buildInitialPhotoData([], makeIdGen(), null)
    expect(r.available_photos).toHaveLength(0)
    expect(r.photo_assignments.every((a) => a.photo_id === null)).toBe(true)
  })

  it('fallback fourni mais sans photos → pool vide + slots null', () => {
    const emptyFallback: PhotoData = {
      available_photos: [],
      photo_assignments: [],
    }
    const r = buildInitialPhotoData([], makeIdGen(), emptyFallback)
    expect(r.available_photos).toHaveLength(0)
    expect(r.photo_assignments).toHaveLength(7)
    expect(r.photo_assignments.every((a) => a.photo_id === null)).toBe(true)
  })
})

describe('migrateLegacyPhotos', () => {
  it('reconstruit pool + assignments depuis les 3 anciens champs', () => {
    const r = migrateLegacyPhotos(
      {
        hero_photo_url: 'places/A/photos/hero',
        histoire_photo_url: 'places/A/photos/hist',
        univers_photos_urls: [
          'places/A/photos/u1',
          'places/A/photos/u2',
          'places/A/photos/u3',
          'places/A/photos/u4',
          'places/A/photos/u5',
        ],
      },
      makeIdGen()
    )

    expect(r.available_photos).toHaveLength(7)
    expect(r.photo_assignments).toHaveLength(7)
    expect(r.photo_assignments.map((a) => a.slot)).toEqual([
      'hero', 'histoire', 'univers_1', 'univers_2', 'univers_3', 'univers_4', 'univers_5',
    ])
    expect(r.photo_assignments.every((a) => a.photo_id !== null)).toBe(true)
  })

  it('désassigne les slots dont la photo legacy est en doublon (premier slot garde)', () => {
    // hero et univers_2 pointent vers la même URL legacy → seul hero garde,
    // univers_2 se vide.
    const r = migrateLegacyPhotos(
      {
        hero_photo_url: 'places/A/photos/signature',
        histoire_photo_url: 'places/A/photos/hist',
        univers_photos_urls: [
          'places/A/photos/u1',
          'places/A/photos/signature', // doublon avec hero
          null as unknown as string,
        ],
      },
      makeIdGen()
    )

    expect(r.available_photos).toHaveLength(3) // signature + hist + u1, sans doublon
    const heroAssign = r.photo_assignments.find((a) => a.slot === 'hero')!
    const u2Assign = r.photo_assignments.find((a) => a.slot === 'univers_2')!
    expect(heroAssign.photo_id).not.toBeNull()
    expect(u2Assign.photo_id).toBeNull() // désassigné car doublon
  })

  it('gère les champs legacy null sans crasher', () => {
    const r = migrateLegacyPhotos(
      {
        hero_photo_url: null,
        histoire_photo_url: null,
        univers_photos_urls: null,
      },
      makeIdGen()
    )
    expect(r.available_photos).toHaveLength(0)
    expect(r.photo_assignments.every((a) => a.photo_id === null)).toBe(true)
  })

  it('détecte les uploads legacy (URL non-Google)', () => {
    const r = migrateLegacyPhotos(
      {
        hero_photo_url: 'https://abc.supabase.co/storage/v1/object/public/maquettes-assets/logo.png',
        histoire_photo_url: 'places/A/photos/hist',
        univers_photos_urls: null,
      },
      makeIdGen()
    )
    const hero = r.available_photos[0]
    const hist = r.available_photos[1]
    expect(hero.source).toBe('upload')
    expect(hist.source).toBe('google')
  })

  it('univers_photos_urls plus court que 5 éléments', () => {
    const r = migrateLegacyPhotos(
      {
        hero_photo_url: 'places/A/photos/h',
        histoire_photo_url: null,
        univers_photos_urls: ['places/A/photos/u1', 'places/A/photos/u2'],
      },
      makeIdGen()
    )
    const u3 = r.photo_assignments.find((a) => a.slot === 'univers_3')!
    expect(u3.photo_id).toBeNull()
  })

  it('toujours 7 slots dans l\'ordre canonique', () => {
    const r = migrateLegacyPhotos(
      { hero_photo_url: null, histoire_photo_url: null, univers_photos_urls: null },
      makeIdGen()
    )
    expect(r.photo_assignments.map((a) => a.slot)).toEqual([
      'hero', 'histoire', 'univers_1', 'univers_2', 'univers_3', 'univers_4', 'univers_5',
    ])
  })
})
