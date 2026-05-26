/**
 * Script de migration Phase 1 — Système simulations BDD-driven.
 *
 * Lit les 4 fichiers `lib/data/simulations/*.json`, les valide via
 * `SimulationDataSchema`, et hydrate les lignes `projects` correspondantes
 * en BDD avec :
 *   - `simulation_data` (jsonb)  : contenu complet du JSON
 *   - `category_family` (text)   : famille éditoriale dérivée du slug
 *
 * Idempotent — exécutable plusieurs fois sans effet de bord :
 *   - Si la ligne existe (slug match) → UPDATE
 *   - Si elle n'existe pas              → INSERT (published=false)
 *
 * Préreq :
 *   - Migration SQL `extend_projects_simulation_data.sql` déjà appliquée
 *   - .env.local rempli (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *
 * Usage :
 *   npm run migrate:simulations
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { SimulationDataSchema } from '../lib/validations/simulation'

// On NE PAS importer lib/supabase/admin.ts ici : il porte `import
// 'server-only'` (guard de securite runtime pour l'app Next), ce qui
// fait crasher tout script Node lance hors du contexte Next. On
// reconstruit un client admin minimal directement avec
// @supabase/supabase-js + SUPABASE_SERVICE_ROLE_KEY.
//
// On utilise le type infere du schema Zod (et non `SimulationData` de
// `types/index.ts`) car le schema porte des `.default([])` qui rendent
// certaines proprietes optionnelles en sortie de parse — incompatible
// avec l'interface qui les declare requises. La validation Zod garantit
// la presence des valeurs au runtime, le typage TS suit la sortie reelle
// du parse.

/**
 * Client Supabase admin dedie au script (hors contexte Next).
 *
 * Utilise SUPABASE_SERVICE_ROLE_KEY pour bypass RLS — ne JAMAIS reutiliser
 * cette factory dans le code applicatif (`lib/supabase/admin.ts` est la
 * pour ca, avec son guard server-only).
 */
function createMigrationClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'createMigrationClient: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ' +
        'manquant. Verifier .env.local et que la commande est lancee avec ' +
        '--env-file=.env.local (cf. npm run migrate:simulations).'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Mapping slug simulation → famille éditoriale.
 *
 * Hardcodé pour les 4 simulations historiques car le champ
 * `business_type` peut être non-aligné avec ProspectCategorie
 * (cf. coiffure.json qui porte `salon-coiffure` au lieu de
 * `coiffeur`). Les générations futures (Phase 4/5) utiliseront
 * directement `CATEGORIE_FAMILIES` de lib/crm/constants.ts.
 */
const SLUG_TO_FAMILY: Record<string, string> = {
  boulangerie: 'bouche',
  boucherie: 'bouche',
  pizzeria: 'bouche',
  coiffure: 'services_personne',
}

const SIMULATIONS_DIR = resolve(process.cwd(), 'lib/data/simulations')

type Outcome = { slug: string; action: 'updated' | 'inserted' | 'skipped'; reason?: string }

async function main(): Promise<void> {
  const supabase = createMigrationClient()
  const results: Outcome[] = []

  for (const slug of Object.keys(SLUG_TO_FAMILY)) {
    const family = SLUG_TO_FAMILY[slug]
    const jsonPath = resolve(SIMULATIONS_DIR, `${slug}.json`)

    // 1. Lecture + validation du JSON local
    let raw: unknown
    try {
      raw = JSON.parse(readFileSync(jsonPath, 'utf8'))
    } catch (err) {
      results.push({ slug, action: 'skipped', reason: `Lecture impossible : ${(err as Error).message}` })
      continue
    }

    const parsed = SimulationDataSchema.safeParse(raw)
    if (!parsed.success) {
      results.push({
        slug,
        action: 'skipped',
        reason: `JSON invalide : ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
      })
      continue
    }
    const data = parsed.data

    // 2. Recherche de la ligne existante par slug
    const { data: existing, error: selectErr } = await supabase
      .from('projects')
      .select('id, slug, project_kind')
      .eq('slug', slug)
      .maybeSingle()

    if (selectErr) {
      results.push({ slug, action: 'skipped', reason: `SELECT erreur : ${selectErr.message}` })
      continue
    }

    if (existing) {
      // 2a. UPDATE — la ligne existe : on remplit les 2 nouvelles colonnes.
      // On NE touche PAS au reste (title, published, etc.) pour ne rien
      // casser côté admin.
      const { error: updateErr } = await supabase
        .from('projects')
        .update({
          simulation_data: data,
          category_family: family,
        })
        .eq('id', existing.id)

      if (updateErr) {
        results.push({ slug, action: 'skipped', reason: `UPDATE erreur : ${updateErr.message}` })
      } else {
        results.push({ slug, action: 'updated' })
      }
    } else {
      // 2b. INSERT — la ligne n'existe pas. On la crée en brouillon
      // (published=false) pour que l'admin valide avant exposition.
      const { error: insertErr } = await supabase.from('projects').insert({
        title: data.name,
        slug,
        business_type: data.businessType,
        short_description: data.tagline,
        content: data.description,
        cover_image_url: data.heroImage,
        external_url: null,
        project_kind: 'simulation',
        published: false,
        featured_home: false,
        simulation_data: data,
        category_family: family,
      })

      if (insertErr) {
        results.push({ slug, action: 'skipped', reason: `INSERT erreur : ${insertErr.message}` })
      } else {
        results.push({ slug, action: 'inserted' })
      }
    }
  }

  // 3. Récap
  console.log('\n=== Migration simulations → BDD ===')
  for (const r of results) {
    const icon = r.action === 'updated' ? '✅' : r.action === 'inserted' ? '🆕' : '⚠️ '
    console.log(`${icon} ${r.slug.padEnd(15)} ${r.action}${r.reason ? ` — ${r.reason}` : ''}`)
  }
  const ok = results.filter((r) => r.action !== 'skipped').length
  const ko = results.filter((r) => r.action === 'skipped').length
  console.log(`\nBilan : ${ok}/${results.length} migrées${ko > 0 ? ` — ${ko} échec(s)` : ''}`)

  if (ko > 0) process.exit(1)
}

main().catch((err) => {
  console.error('[migrate-simulations] Erreur fatale :', err)
  process.exit(1)
})
