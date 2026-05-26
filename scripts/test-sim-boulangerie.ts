/**
 * 🧪 SCRIPT ONE-SHOT — Test du pipeline Phase 5 sur 1 simulation.
 *
 * Génère une simulation boulangerie fictive complète :
 *   1. Appelle `buildFictiveSimulation({ categoryId: 'boulangerie' })`
 *   2. Insère une ligne `projects` avec `published = true`
 *   3. Affiche le slug + l'URL preview à tester visuellement
 *
 * Usage :
 *   npm run sim:test-boulangerie
 *
 * Variables d'environnement requises dans `.env.local` :
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (bypass RLS pour l'INSERT)
 *   - UNSPLASH_ACCESS_KEY
 *
 * Le flag Node `--conditions=react-server` (cf. npm script) fait
 * résoudre le package `server-only` vers son `empty.js` (au lieu du
 * `index.js` qui throw), nécessaire pour importer
 * `buildFictiveSimulation` hors contexte Next.js.
 *
 * 🗑️ À SUPPRIMER une fois la validation visuelle OK + Phase 6 livrée.
 */

import { createClient } from '@supabase/supabase-js'
import { buildFictiveSimulation } from '../lib/maquette/simulations/buildFictiveSimulation'

const SLUG_FORCE: string | null = null // mettre 'boulangerie-test' pour forcer un slug

async function main() {
  // Sanity checks
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquant')
  }
  if (!unsplashKey) {
    throw new Error('UNSPLASH_ACCESS_KEY manquant — voir .env.local')
  }

  // Client admin (bypass RLS pour INSERT projects)
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('🍞 Génération simulation boulangerie fictive…')

  // 1. Pipeline complet (génère un nom commerce fictif, télécharge 7 photos
  //    Unsplash, upload Supabase Storage, valide Zod)
  //    Seed différente de "boulangerie" pour ne pas réserver ce slug-là à
  //    la régénération définitive de Phase 6.
  const { payload, slug, business } = await buildFictiveSimulation({
    categoryId: 'boulangerie',
    supabase,
    options: { seed: 'phase5-smoke-test' },
  })

  const finalSlug = SLUG_FORCE ?? slug
  console.log(`   business : ${business.nom_commerce} — ${business.ville}`)
  console.log(`   slug     : ${finalSlug}`)
  console.log(`   téléphone: ${business.telephone}`)
  console.log(`   avis     : ${payload.maquette.avis_items?.length ?? 0} fictifs`)
  console.log(`   photos   : ${payload.maquette.available_photos.length} dans le pool`)

  // 2. INSERT en BDD avec published=true pour qu'elle apparaisse sur /simulations
  console.log('💾 INSERT ligne projects…')
  const { error: insertErr, data: inserted } = await supabase
    .from('projects')
    .insert({
      title: business.nom_commerce,
      slug: finalSlug,
      business_type: 'boulangerie',
      short_description: payload.maquette.brand_tagline,
      content: null,
      cover_image_url: payload.maquette.hero_photo_url,
      external_url: null,
      project_kind: 'simulation',
      published: true,
      featured_home: false,
      category_family: 'bouche',
      simulation_data: payload,
    })
    .select('id, slug')
    .single()

  if (insertErr) {
    // En cas de collision de slug (déjà créé précédemment), on UPDATE
    // pour le test reste idempotent.
    if (insertErr.code === '23505') {
      console.log('   slug déjà présent → UPDATE')
      const { error: updateErr } = await supabase
        .from('projects')
        .update({
          title: business.nom_commerce,
          short_description: payload.maquette.brand_tagline,
          cover_image_url: payload.maquette.hero_photo_url,
          published: true,
          category_family: 'bouche',
          simulation_data: payload,
        })
        .eq('slug', finalSlug)
        .eq('project_kind', 'simulation')
      if (updateErr) throw new Error(`UPDATE échec : ${updateErr.message}`)
    } else {
      throw new Error(`INSERT échec : ${insertErr.message} (${insertErr.code})`)
    }
  } else {
    console.log(`   id BDD : ${inserted?.id}`)
  }

  console.log('')
  console.log('✅ Terminé. URLs à tester :')
  console.log(`   • Preview : https://sigweb-git-feat-simulations-bdd-driven-sebkeops.vercel.app/simulations/${finalSlug}`)
  console.log(`   • Grille  : https://sigweb-git-feat-simulations-bdd-driven-sebkeops.vercel.app/simulations`)
  console.log('')
  console.log('Pour retirer cette ligne plus tard :')
  console.log(`   DELETE FROM projects WHERE slug = '${finalSlug}' AND project_kind = 'simulation';`)
}

main().catch((err) => {
  console.error('❌ Échec :', err)
  process.exit(1)
})
