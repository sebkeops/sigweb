/**
 * 🔁 SCRIPT — Régénération des simulations historiques (Phase 6).
 *
 * À exécuter une fois après merge de la PR Phase 5+6, pour repeupler
 * les 4 simulations historiques (`boulangerie`, `boucherie`, `pizzeria`,
 * `coiffure`) avec le nouveau format `MaquetteInitialData` produit par
 * `buildFictiveSimulation`. Ces lignes étaient passées à `published =
 * false` en fin de Phase 3 (cf. `unpublish_legacy_simulations_for_regen.sql`)
 * et reviennent à `published = true` ici.
 *
 * Bonus : supprime la simulation test `la-mie-authentique` créée par
 * le script one-shot Phase 5.
 *
 * Comportement :
 *   - Pour chaque slug historique, on UPDATE la ligne existante en
 *     conservant le slug pour préserver les URLs (`/simulations/boulangerie`
 *     reste valide).
 *   - Seed fixée au slug → résultat reproductible : si on relance le
 *     script (par exemple après un ajustement des keywords Unsplash),
 *     on retombe sur le même business fictif (même nom, même ville).
 *   - Délai 15s entre générations pour ménager le quota Unsplash
 *     Demo (50 req/h, 7 req par génération = on tient large).
 *
 * Usage :
 *   npm run sim:regenerate-historic
 *
 * Variables d'environnement requises dans `.env.local` :
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - UNSPLASH_ACCESS_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { buildFictiveSimulation } from '../lib/maquette/simulations/buildFictiveSimulation'
import type { ProspectCategorie } from '../types'

/**
 * Mapping `slug historique` → `categorie ProspectCategorie`.
 *
 * `coiffure` est cassé exprès : le slug historique vient de l'ancien
 * système simulation où `businessType: 'salon-coiffure'` ne mappait pas
 * sur `ProspectCategorie`. Côté Phase 5+, on génère pour la catégorie
 * `coiffeur` (un vrai variant) mais on garde le slug `coiffure` pour
 * préserver l'URL externe.
 */
const HISTORIC_SIMULATIONS: ReadonlyArray<{
  slug: string
  categoryId: ProspectCategorie
  family: string
}> = [
  { slug: 'boulangerie', categoryId: 'boulangerie', family: 'bouche' },
  { slug: 'boucherie',   categoryId: 'boucherie',   family: 'bouche' },
  { slug: 'pizzeria',    categoryId: 'pizzeria',    family: 'bouche' },
  { slug: 'coiffure',    categoryId: 'coiffeur',    family: 'services_personne' },
]

/** Délai en ms entre 2 générations consécutives — ménage quota Unsplash. */
const DELAY_BETWEEN_GENERATIONS_MS = 15_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquant')
  }
  if (!unsplashKey) {
    throw new Error('UNSPLASH_ACCESS_KEY manquant — voir .env.local')
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 1. Cleanup la simulation test 'la-mie-authentique' ──
  console.log('🧹 Suppression de la simulation test la-mie-authentique…')
  const { error: deleteErr, count: deletedCount } = await supabase
    .from('projects')
    .delete({ count: 'exact' })
    .eq('slug', 'la-mie-authentique')
    .eq('project_kind', 'simulation')
  if (deleteErr) {
    console.warn(`   ⚠️  Échec suppression : ${deleteErr.message}`)
  } else {
    console.log(`   → ${deletedCount ?? 0} ligne(s) supprimée(s)`)
  }
  console.log('')

  // ── 2. Régénère les 4 historiques ──
  console.log('🔁 Régénération des 4 simulations historiques…')
  console.log('')

  for (let i = 0; i < HISTORIC_SIMULATIONS.length; i++) {
    const { slug, categoryId, family } = HISTORIC_SIMULATIONS[i] as (typeof HISTORIC_SIMULATIONS)[number]

    console.log(`▶ [${i + 1}/${HISTORIC_SIMULATIONS.length}] slug='${slug}' categoryId='${categoryId}'`)

    // Génération — seed = slug pour stabilité dans le temps
    const { payload, business } = await buildFictiveSimulation({
      categoryId,
      supabase,
      options: { seed: slug },
    })
    console.log(`   business : ${business.nom_commerce} — ${business.ville}`)
    console.log(`   avis     : ${payload.maquette.avis_items?.length ?? 0} fictifs`)
    console.log(`   photos   : ${payload.maquette.available_photos.length} dans le pool`)

    // UPDATE — on conserve le slug historique pour préserver l'URL,
    // mais on met à jour tout le reste avec le nouveau payload.
    const { error: updateErr } = await supabase
      .from('projects')
      .update({
        title: business.nom_commerce,
        business_type: categoryId,
        short_description: payload.maquette.brand_tagline,
        cover_image_url: payload.maquette.hero_photo_url,
        published: true,
        category_family: family,
        simulation_data: payload,
      })
      .eq('slug', slug)
      .eq('project_kind', 'simulation')

    if (updateErr) {
      console.error(`   ❌ UPDATE échec : ${updateErr.message}`)
      throw new Error(`Régénération de '${slug}' interrompue.`)
    }
    console.log(`   ✅ UPDATE OK, published = true`)
    console.log('')

    // Délai avant la prochaine génération (sauf la dernière)
    if (i < HISTORIC_SIMULATIONS.length - 1) {
      console.log(`⏳ Pause ${DELAY_BETWEEN_GENERATIONS_MS / 1000}s pour ménager le quota Unsplash…`)
      console.log('')
      await sleep(DELAY_BETWEEN_GENERATIONS_MS)
    }
  }

  console.log('🎉 Régénération terminée.')
  console.log('')
  console.log('URLs publiques (preview ou prod selon où le SQL a tourné) :')
  for (const { slug } of HISTORIC_SIMULATIONS) {
    console.log(`   • /simulations/${slug}`)
  }
}

main().catch((err) => {
  console.error('❌ Échec :', err)
  process.exit(1)
})
