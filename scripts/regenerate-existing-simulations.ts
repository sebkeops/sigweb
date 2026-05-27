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

/**
 * Parse l'argument optionnel `--only=slug1,slug2` du script.
 * Si fourni, on ne régénère que les slugs listés (utile après un fix
 * de keyword pour ne pas re-générer les catégories qui marchaient déjà).
 * Si absent : on régénère les 4 historiques.
 */
function parseOnlyFilter(): Set<string> | null {
  const arg = process.argv.find((a) => a.startsWith('--only='))
  if (!arg) return null
  const slugs = arg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean)
  return slugs.length > 0 ? new Set(slugs) : null
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

  const onlyFilter = parseOnlyFilter()
  const todoList = onlyFilter
    ? HISTORIC_SIMULATIONS.filter((s) => onlyFilter.has(s.slug))
    : HISTORIC_SIMULATIONS

  if (onlyFilter && todoList.length === 0) {
    throw new Error(
      `--only=${[...onlyFilter].join(',')} ne matche aucun slug historique. ` +
        `Slugs disponibles : ${HISTORIC_SIMULATIONS.map((s) => s.slug).join(', ')}`
    )
  }

  // ── 1. Cleanup la simulation test 'la-mie-authentique' ──
  //     Skip si --only est passé (filtre chirurgical, l'utilisateur sait
  //     ce qu'il veut régénérer et on ne touche pas au reste).
  if (!onlyFilter) {
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
  }

  // ── 2. Régénère les simulations cibles ──
  // Resilient : une erreur sur 1 catégorie ne stoppe pas les suivantes,
  // on accumule les résultats et on affiche un récap final clair.
  const scope = onlyFilter ? `${todoList.length} slug(s) ciblé(s) via --only` : '4 historiques'
  console.log(`🔁 Régénération (${scope})…`)
  console.log('')

  type Outcome =
    | { slug: string; status: 'ok'; nomCommerce: string; ville: string; durationMs: number }
    | { slug: string; status: 'fail'; error: string }
  const outcomes: Outcome[] = []

  for (let i = 0; i < todoList.length; i++) {
    const { slug, categoryId, family } = todoList[i] as (typeof todoList)[number]
    const startedAt = Date.now()

    console.log(`▶ [${i + 1}/${todoList.length}] slug='${slug}' categoryId='${categoryId}'`)

    try {
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

      if (updateErr) throw new Error(`UPDATE BDD échec : ${updateErr.message}`)

      const durationMs = Date.now() - startedAt
      console.log(`   ✅ UPDATE OK, published = true (${(durationMs / 1000).toFixed(1)}s)`)
      outcomes.push({
        slug,
        status: 'ok',
        nomCommerce: business.nom_commerce,
        ville: business.ville,
        durationMs,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`   ❌ Échec : ${msg}`)
      outcomes.push({ slug, status: 'fail', error: msg })
    }

    console.log('')

    // Délai avant la prochaine génération (sauf la dernière)
    if (i < todoList.length - 1) {
      console.log(`⏳ Pause ${DELAY_BETWEEN_GENERATIONS_MS / 1000}s pour ménager le quota Unsplash…`)
      console.log('')
      await sleep(DELAY_BETWEEN_GENERATIONS_MS)
    }
  }

  // ── 3. Récap final ──
  const ok = outcomes.filter((o) => o.status === 'ok')
  const failed = outcomes.filter((o) => o.status === 'fail')

  console.log('═══════════════════════════════════════════════════════════')
  console.log(`🎯 Récapitulatif final : ${ok.length}/${outcomes.length} succès`)
  console.log('═══════════════════════════════════════════════════════════')
  for (const o of outcomes) {
    if (o.status === 'ok') {
      const sec = (o.durationMs / 1000).toFixed(1)
      console.log(`   ✅ ${o.slug.padEnd(13)} → ${o.nomCommerce} (${o.ville}) — ${sec}s`)
    } else {
      console.log(`   ❌ ${o.slug.padEnd(13)} → ${o.error}`)
    }
  }
  console.log('')

  if (failed.length === 0) {
    console.log('🎉 Régénération complète. URLs publiques actives :')
    for (const o of ok) {
      console.log(`   • /simulations/${o.slug}`)
    }
  } else {
    console.log(`⚠️  ${failed.length} catégorie(s) en échec — relancer le script ou corriger les pools.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('❌ Échec :', err)
  process.exit(1)
})
