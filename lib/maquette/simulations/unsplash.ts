import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getUnsplashKeyword } from './unsplashKeywords'
import type { Prng } from './prng'
import type { ProspectCategorie } from '@/types'

/**
 * Module Unsplash + upload Supabase Storage pour le générateur de
 * simulations publiques (Phase 5).
 *
 * Pipeline pour une simulation donnée :
 *   1. `searchUnsplash(keyword)` → l'API Unsplash retourne ~10 photos
 *   2. On en sélectionne 7 (hero + histoire + 5 univers) en variant les
 *      mots-clés pour avoir de la diversité visuelle
 *   3. Pour chaque photo : `fetch(urls.regular)` puis `upload` dans le
 *      bucket Supabase `project-images` au chemin
 *      `simulations/{slug}/{hero,gallery-N}.jpg`
 *   4. On stocke aussi un `credits.json` avec la liste des photographes
 *      + liens Unsplash, pour traçabilité légale
 *   5. Retourne les URLs publiques Supabase ordonnées (hero d'abord, puis
 *      gallery-1..6, prêtes à alimenter `available_photos` côté
 *      `generateInitialMaquette`)
 *
 * `server-only` : ce module utilise `UNSPLASH_ACCESS_KEY` qui ne doit
 * jamais être exposé côté client.
 */

const BUCKET = 'project-images'
const SUB_FOLDER = 'simulations'
const UNSPLASH_BASE = 'https://api.unsplash.com'

/** Nombre total de photos cible par simulation (hero + 6 galerie). */
const PHOTO_COUNT = 7

/** Largeur de resize côté Unsplash (max). */
const TARGET_WIDTH = 1600

export interface UnsplashPhotoCredit {
  /** Nom du photographe (depuis `user.name`). */
  name: string
  /** Lien profil Unsplash (depuis `user.links.html`). */
  link: string
  /** Slug du fichier dans le storage (`hero.jpg`, `gallery-1.jpg`, ...). */
  filename: string
}

export interface UnsplashFetchResult {
  /** URL publique Supabase du hero (slot `hero` du pool). */
  heroUrl: string
  /**
   * URLs publiques Supabase des photos secondaires, dans l'ordre exact où
   * elles seront affectées : index 0 → slot `histoire`, index 1..5 →
   * slots `univers_1..5` (cf. `generateInitialMaquette`).
   */
  galleryUrls: string[]
  /** Crédits photographes — sera persisté dans `simulations/{slug}/credits.json`. */
  credits: UnsplashPhotoCredit[]
}

interface UnsplashApiPhoto {
  urls: { regular: string }
  user: {
    name: string
    links: { html: string }
  }
}

/**
 * Appel à `/search/photos`. Renvoie au max `per_page` photos, paysage
 * uniquement (cohérence avec les compositions Hero / Histoire / Univers).
 */
async function searchUnsplash(
  accessKey: string,
  query: string,
  perPage: number
): Promise<UnsplashApiPhoto[]> {
  const url = `${UNSPLASH_BASE}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      'Accept-Version': 'v1',
    },
    // L'API a son cache CDN, mais on évite le cache fetch Next pour ne pas
    // recevoir les mêmes 10 photos sur 3 simulations consécutives. La
    // reproductibilité provient du PRNG, pas du cache.
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(
      `[unsplash] /search/photos a renvoyé ${res.status} pour "${query}" — ${body.slice(0, 200)}`
    )
  }

  const json = (await res.json()) as { results?: UnsplashApiPhoto[] }
  return json.results ?? []
}

/**
 * Télécharge le binaire d'une photo Unsplash, ajoutant l'option `&w=` pour
 * limiter la taille — réduit la bande passante et l'occupation Storage.
 */
async function downloadPhoto(url: string): Promise<Buffer> {
  const sized = url.includes('?')
    ? `${url}&w=${TARGET_WIDTH}&fit=max`
    : `${url}?w=${TARGET_WIDTH}&fit=max`

  const res = await fetch(sized, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`[unsplash] téléchargement échec ${res.status} pour ${url}`)
  }
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

/**
 * Upload un buffer dans `project-images/simulations/{slug}/{filename}`
 * avec `upsert: true` (en cas de régénération d'une simulation, l'admin
 * doit pouvoir écraser ses propres fichiers — la clé écrasante est le
 * slug, pas un timestamp).
 */
async function uploadToStorage(
  supabase: SupabaseClient,
  slug: string,
  filename: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const path = `${SUB_FOLDER}/${slug}/${filename}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType, upsert: true })

  if (error) {
    throw new Error(`[unsplash] upload Supabase a échoué pour ${path} : ${error.message}`)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Pipeline complet : récupère N photos Unsplash, les upload dans le
 * bucket `project-images/simulations/{slug}/`, écrit `credits.json` à
 * côté, et retourne les URLs publiques.
 *
 * @param supabase Client Supabase authentifié (admin ou service role) —
 *                 requis pour les uploads dans le bucket.
 * @param categoryId Catégorie pour piocher dans `UNSPLASH_KEYWORDS_BY_CATEGORIE`.
 * @param slug Slug de la simulation, utilisé comme sous-dossier Storage.
 * @param prng PRNG seedable pour reproductibilité — sert à choisir
 *             quels mots-clés on enchaîne et quelles photos on retient
 *             dans le set retourné par l'API.
 */
export async function fetchAndStoreUnsplashPhotos(
  supabase: SupabaseClient,
  categoryId: ProspectCategorie,
  slug: string,
  prng: Prng
): Promise<UnsplashFetchResult> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    throw new Error('[unsplash] UNSPLASH_ACCESS_KEY manquant dans l\'environnement')
  }

  // Stratégie de keywords : on choisit 2 mots-clés distincts dans le pool
  // (le pool en a 4 à 6 par catégorie). 1ʳᵉ requête → 5 photos, 2ᵉ requête
  // → 5 photos, on prend 7 sur les 10 mélangés. Réduit la monotonie
  // visuelle d'avoir 7 photos sur le même keyword.
  const keyword1 = getUnsplashKeyword(categoryId, prng.intBetween(0, 5))
  const keyword2 = getUnsplashKeyword(categoryId, prng.intBetween(0, 5))

  const [batch1, batch2] = await Promise.all([
    searchUnsplash(accessKey, keyword1, 5),
    searchUnsplash(accessKey, keyword2, 5),
  ])

  const pool = [...batch1, ...batch2]
  if (pool.length < PHOTO_COUNT) {
    // Fallback : ressayer avec un mot-clé plus générique du pool.
    const keyword3 = getUnsplashKeyword(categoryId, prng.intBetween(0, 5))
    const batch3 = await searchUnsplash(accessKey, keyword3, PHOTO_COUNT)
    pool.push(...batch3)
  }
  if (pool.length < PHOTO_COUNT) {
    throw new Error(
      `[unsplash] résultats insuffisants pour ${categoryId} (${pool.length}/${PHOTO_COUNT}). Keywords : "${keyword1}", "${keyword2}"`
    )
  }

  // Mélange déterministe + selection des 7 premières
  const shuffled = prng.pickN(pool, PHOTO_COUNT)

  // Téléchargement parallèle + upload séquentiel (parallèle aussi possible
  // mais le séquentiel limite le risque de rate-limit Storage)
  const credits: UnsplashPhotoCredit[] = []
  const urls: string[] = []

  for (let i = 0; i < shuffled.length; i++) {
    const photo = shuffled[i] as UnsplashApiPhoto
    const filename = i === 0 ? 'hero.jpg' : `gallery-${i}.jpg`
    const buffer = await downloadPhoto(photo.urls.regular)
    const publicUrl = await uploadToStorage(supabase, slug, filename, buffer, 'image/jpeg')

    urls.push(publicUrl)
    credits.push({
      name: photo.user.name,
      link: photo.user.links.html,
      filename,
    })
  }

  // credits.json — pour traçabilité légale (chaque photo a son photographe
  // crédité). Stocké à côté des images, accessible publiquement (donnée
  // non-sensible, c'est même mieux que ce soit publique).
  const creditsJson = JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      source: 'unsplash',
      photos: credits,
    },
    null,
    2
  )
  await uploadToStorage(
    supabase,
    slug,
    'credits.json',
    Buffer.from(creditsJson, 'utf8'),
    'application/json'
  )

  return {
    heroUrl: urls[0] as string,
    galleryUrls: urls.slice(1),
    credits,
  }
}
