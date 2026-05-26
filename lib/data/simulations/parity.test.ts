/**
 * ⚠️  TEST TEMPORAIRE — GARDE-FOU DE MIGRATION (Phase 2)
 *
 * Ce fichier vérifie que `simulation_data` stocké en BDD est strictement
 * identique au JSON local correspondant (`lib/data/simulations/*.json`).
 *
 * À SUPPRIMER en même temps que les JSON locaux, dans la PR qui retire
 * `lib/data/simulations/{*.json,index.ts}` (planifiée après validation
 * de la lecture BDD en production — cf. brief « Système de simulations
 * publiques génératif », Étape 2).
 *
 * Tant que les JSON existent, ce test garantit que la BDD reste la
 * source unique de vérité pour le rendu et que la migration ne dérive
 * pas silencieusement (modification accidentelle d'une simulation côté
 * admin avant la suppression des fichiers de référence).
 *
 * --- Exécution ---
 *
 * Tourne uniquement en local, contre la vraie BDD Supabase, en lecture
 * seule (4 SELECT, durée < 1s).
 *
 * Skip automatique si les variables d'environnement Supabase manquent
 * (cas CI sans secrets : aucune action n'a été configurée sur le repo,
 * cf. validation user Phase 2). Pour le lancer :
 *
 *   node --env-file=.env.local node_modules/vitest/vitest.mjs run \
 *     lib/data/simulations/parity.test.ts
 *
 * Ou plus simplement, ajouter un script npm si on veut le rejouer
 * régulièrement (pas indispensable vu son caractère one-shot).
 */

import { describe, it, expect } from 'vitest'
import boulangerie from './boulangerie.json'
import boucherie from './boucherie.json'
import pizzeria from './pizzeria.json'
import coiffure from './coiffure.json'
import { getSimulationFromDb } from './db'

const HAS_CREDS = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const FIXTURES: Array<{ slug: string; json: unknown }> = [
  { slug: 'boulangerie', json: boulangerie },
  { slug: 'boucherie', json: boucherie },
  { slug: 'pizzeria', json: pizzeria },
  { slug: 'coiffure', json: coiffure },
]

describe.skipIf(!HAS_CREDS)('simulations — parité JSON ↔ BDD', () => {
  for (const { slug, json } of FIXTURES) {
    it(`${slug} : la simulation_data en BDD est strictement identique au JSON local`, async () => {
      const fromDb = await getSimulationFromDb(slug)
      expect(fromDb, `getSimulationFromDb("${slug}") doit retourner un objet (la simulation doit être publiée et hydratée en BDD)`).not.toBeNull()
      // Deep structural equality — détecte tout écart de valeur, ordre
      // de clés non pertinent, distingue undefined vs absent.
      expect(fromDb).toEqual(json)
    })
  }
})
