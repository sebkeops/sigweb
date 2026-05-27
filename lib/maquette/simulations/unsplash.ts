import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  UNSPLASH_KEYWORDS_BY_CATEGORIE,
  type CategoryUnsplashKeywords,
} from './unsplashKeywords'
import type { Prng } from './prng'
import type { ProspectCategorie } from '@/types'

/**
 * Module Unsplash + upload Supabase Storage pour le générateur de
 * simulations publiques (Phase 5).
 *
 * Pipeline pour une simulation donnée — **un appel Unsplash par bloc**
 * (cf. UNSPLASH_KEYWORDS_BY_CATEGORIE structuré par destination) :
 *   1. Pour chacun des 7 slots (hero, histoire, univers_1..5), on prend
 *      un mot-clé aléatoire (PRNG) dans le pool dédié au slot
 *   2. `searchUnsplash(keyword)` → l'API Unsplash retourne ~5 photos
 *   3. On en prend 1 (la 1ère du résultat aléatoirement parmi 5) pour
 *      le slot ciblé
 *   4. `fetch(urls.regular)` puis upload dans le bucket Supabase
 *      `project-images` au chemin `simulations/{slug}/{hero,gallery-N}.jpg`
 *   5. On stocke aussi un `credits.json` avec la liste des photographes
 *      + liens Unsplash, pour traçabilité légale
 *   6. Retourne les URLs publiques Supabase ordonnées (hero d'abord, puis
 *      gallery-1..6, prêtes à alimenter `available_photos` côté
 *      `generateInitialMaquette`)
 *
 * Coût en quota Unsplash : **7 requêtes /search/photos par simulation**
 * (1 par slot). À 50 req/h pour le plan Demo, cela autorise ~7 simulations
 * uniques par heure en mode unitaire. Pour batcher les 34 catégories en
 * Phase 6, prévoir un délai de 15-20s entre générations (~30 min pour
 * tout générer).
 *
 * `server-only` : ce module utilise `UNSPLASH_ACCESS_KEY` qui ne doit
 * jamais être exposé côté client.
 */

const BUCKET = 'project-images'
const SUB_FOLDER = 'simulations'
const UNSPLASH_BASE = 'https://api.unsplash.com'

/** Largeur de resize côté Unsplash (max). */
const TARGET_WIDTH = 1600

/** Slots de rendu, ordonnés pour matcher l'attribution `available_photos`. */
const SLOTS = ['hero', 'histoire', 'univers_1', 'univers_2', 'univers_3', 'univers_4', 'univers_5'] as const
type Slot = (typeof SLOTS)[number]

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
 * Retourne le pool de mots-clés à utiliser pour un slot donné.
 * Centralisé pour qu'un éventuel fallback (slot inconnu) soit géré ici.
 */
function poolForSlot(cat: CategoryUnsplashKeywords, slot: Slot): readonly string[] {
  if (slot === 'hero') return cat.hero
  if (slot === 'histoire') return cat.histoire
  // univers_N → cat.univers[N-1]
  const idx = parseInt(slot.split('_')[1] as string, 10) - 1
  return cat.univers[idx] ?? cat.histoire
}

/**
 * Détermine le nom du fichier dans le bucket en fonction du slot.
 * Convention validée user :
 *   - slot 'hero'        → 'hero.jpg'
 *   - slot 'histoire'    → 'gallery-1.jpg'
 *   - slot 'univers_N'   → 'gallery-{N+1}.jpg'
 */
function filenameForSlot(slot: Slot): string {
  if (slot === 'hero') return 'hero.jpg'
  if (slot === 'histoire') return 'gallery-1.jpg'
  const idx = parseInt(slot.split('_')[1] as string, 10)
  return `gallery-${idx + 1}.jpg`
}

/**
 * Pipeline complet : pour chacun des 7 slots de la maquette (hero,
 * histoire, univers_1..5), interroge Unsplash avec un mot-clé ciblé
 * sur le slot, sélectionne 1 photo, l'upload dans Supabase Storage.
 * Écrit aussi un `credits.json` à côté pour traçabilité légale.
 *
 * @param supabase Client Supabase authentifié (admin ou service role).
 * @param categoryId Catégorie — pilote le pool de mots-clés par slot.
 * @param slug Slug de la simulation, utilisé comme sous-dossier Storage.
 * @param prng PRNG seedable pour reproductibilité (choix du mot-clé
 *             dans le pool + sélection de la photo dans le résultat API).
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

  const cat = UNSPLASH_KEYWORDS_BY_CATEGORIE[categoryId]

  // 1. Plan déterministe par slot : on précalcule l'ordre seedé du pool
  //    + un sélecteur de photo (valeur [0, 1)) APPELÉS SYNCHRONIQUEMENT
  //    dans l'ordre des SLOTS pour que le PRNG reste reproductible
  //    indépendamment de l'ordre de résolution des Promesses parallèles
  //    qui suivent.
  const slotsPlans = SLOTS.map((slot) => {
    const pool = poolForSlot(cat, slot)
    // Tout le pool, mélangé de manière seedée. On itère dans cet ordre
    // jusqu'à trouver un keyword qui retourne ≥ 1 résultat Unsplash —
    // fallback naturel sur les autres keywords sans changer de slot.
    const shuffled = prng.pickN(pool, pool.length)
    // Sélecteur de photo dans le tableau de résultats du keyword retenu
    // — calculé maintenant pour rester déterministe.
    const photoSelector = prng.next()
    return { slot, shuffled, photoSelector }
  })

  // 2. Pour chaque slot, on itère sur le pool seedé jusqu'à obtenir un
  //    résultat non vide. Throw uniquement si TOUS les keywords du pool
  //    retournent 0 (cas pathologique — devrait être prévenu par l'audit
  //    régulier des pools dans UNSPLASH_KEYWORDS_BY_CATEGORIE).
  //    Les 7 slots tournent en parallèle, chacun avec son propre fallback.
  const slotResults = await Promise.all(
    slotsPlans.map(async (plan) => {
      for (const keyword of plan.shuffled) {
        const results = await searchUnsplash(accessKey, keyword, 5)
        if (results.length > 0) {
          const idx = Math.floor(plan.photoSelector * results.length)
          return {
            slot: plan.slot,
            keyword,
            photo: results[idx] as UnsplashApiPhoto,
          }
        }
        console.warn(
          `[unsplash] slot=${plan.slot} keyword="${keyword}" 0 résultat, fallback sur le keyword suivant…`
        )
      }
      throw new Error(
        `[unsplash] tous les keywords du pool sont vides pour slot=${plan.slot} cat=${categoryId}. ` +
          'Cas pathologique — élargir/réviser le pool correspondant dans UNSPLASH_KEYWORDS_BY_CATEGORIE.'
      )
    })
  )

  // 3. Download + upload séquentiel (limite la pression sur Supabase Storage)
  const credits: UnsplashPhotoCredit[] = []
  const heroUrlContainer: { url?: string } = {}
  const galleryUrls: string[] = new Array(6)

  for (const s of slotResults) {
    const filename = filenameForSlot(s.slot)
    const buffer = await downloadPhoto(s.photo.urls.regular)
    const publicUrl = await uploadToStorage(supabase, slug, filename, buffer, 'image/jpeg')

    credits.push({
      name: s.photo.user.name,
      link: s.photo.user.links.html,
      filename,
    })

    if (s.slot === 'hero') {
      heroUrlContainer.url = publicUrl
    } else {
      // gallery-1..6 → galleryUrls[0..5]
      const idx = parseInt(filename.match(/gallery-(\d+)\.jpg/)?.[1] ?? '1', 10) - 1
      galleryUrls[idx] = publicUrl
    }
  }

  if (!heroUrlContainer.url) {
    throw new Error('[unsplash] hero URL absente après pipeline — incohérence interne')
  }

  // 3. credits.json — pour traçabilité légale (chaque photo a son photographe
  //    crédité). Stocké à côté des images, accessible publiquement.
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
    heroUrl: heroUrlContainer.url,
    galleryUrls,
    credits,
  }
}
