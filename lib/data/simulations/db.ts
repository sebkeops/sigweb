import { createClient } from '@supabase/supabase-js'
import { SimulationDataSchema } from '@/lib/validations/simulation'

/**
 * Helpers de lecture des simulations publiques depuis Supabase.
 *
 * Sont utilisés par `app/simulations/[slug]/page.tsx` (ISR 1h) à la
 * place des JSON locaux historiques. À terme (PR ultérieure), les
 * fichiers `lib/data/simulations/*.json` + leur barrel `index.ts`
 * seront supprimés ; ce module restera la seule source.
 *
 * Choix du client : `@supabase/supabase-js` direct (clé anon publique),
 * pas `lib/supabase/server.ts` (SSR client basé sur les cookies).
 * Raison : `generateStaticParams()` est invoqué AU BUILD, hors contexte
 * requête — `cookies()` y est indisponible et ferait planter le build.
 * La clé anon suffit puisque la requête est en lecture publique sur des
 * lignes `published = true` (autorisées par RLS comme pour la page liste
 * `/simulations`).
 */

type ReadClient = ReturnType<typeof createClient>

let cachedClient: ReadClient | null = null

function getReadClient(): ReadClient {
  if (cachedClient) return cachedClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      '[simulations/db] NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquant'
    )
  }
  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedClient
}

/**
 * Slugs des simulations publiées — utilisé par `generateStaticParams()`.
 *
 * Retourne uniquement les slugs avec `published = true`. Une simulation
 * dépubliée ne sera pas pré-générée au build : son route servira un 404
 * via `notFound()` côté page (cf. `getSimulationFromDb()` qui filtre
 * aussi sur `published`).
 */
export async function getAllPublishedSimulationSlugs(): Promise<string[]> {
  const supabase = getReadClient()
  // Cast manuel : pas de types BDD generes, le client renvoie `never` par
  // defaut. Le shape est garanti par la requete `.select('slug')`.
  const { data, error } = await supabase
    .from('projects')
    .select('slug')
    .eq('project_kind', 'simulation')
    .eq('published', true)
    .returns<{ slug: string }[]>()

  if (error) {
    console.error('[simulations/db] getAllPublishedSimulationSlugs', error)
    return []
  }
  return (data ?? []).map((row) => row.slug).filter(Boolean)
}

/**
 * Charge le `simulation_data` (JSONB) pour un slug publié, validé Zod.
 *
 * Retourne `null` si :
 *   - le slug n'existe pas,
 *   - la simulation est dépubliée,
 *   - la colonne `simulation_data` est null (cas anormal : ligne créée
 *     sans payload — la PR Phase 1 garantit qu'elle est remplie pour
 *     les 4 simulations historiques),
 *   - le payload ne valide pas le schéma Zod (cas anormal : payload
 *     altéré manuellement en BDD).
 *
 * Le caller (`page.tsx`) appelle `notFound()` quand on reçoit `null`.
 */
export async function getSimulationFromDb(slug: string) {
  const supabase = getReadClient()
  const { data, error } = await supabase
    .from('projects')
    .select('simulation_data')
    .eq('slug', slug)
    .eq('project_kind', 'simulation')
    .eq('published', true)
    .returns<{ simulation_data: unknown }[]>()
    .maybeSingle()

  if (error) {
    console.error('[simulations/db] getSimulationFromDb', slug, error)
    return null
  }
  if (!data?.simulation_data) return null

  const parsed = SimulationDataSchema.safeParse(data.simulation_data)
  if (!parsed.success) {
    console.error(
      '[simulations/db] simulation_data invalide pour',
      slug,
      parsed.error.flatten()
    )
    return null
  }
  return parsed.data
}
