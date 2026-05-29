import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type {
  Prospect,
  ProspectCanal,
  ProspectCategorie,
  ProspectSource,
  ProspectStatut,
} from '@/types'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LinkButton } from '@/components/ui/Button'
import ProspectFilters from '@/components/admin/ProspectFilters'
import ProspectCard from '@/components/admin/ProspectCard'
import BackfillGooglePhotosButton from './BackfillGooglePhotosButton'
import BackfillGoogleReviewsButton from './BackfillGoogleReviewsButton'
import MigrateMaquettesPhotosButton from './MigrateMaquettesPhotosButton'
import RecomputeAllScoresButton from './RecomputeAllScoresButton'
import {
  CANAL_BADGE,
  CANAL_LABELS,
  CATEGORIE_BADGE,
  displayCategorie,
  SOURCE_ICONS,
  SOURCE_LABELS,
} from '@/lib/crm/constants'

export const metadata: Metadata = { title: 'CRM | Admin Sigweb' }

type SortKey = 'score_desc' | 'score_asc'

interface Props {
  searchParams: Promise<{
    canal?: string
    statut?: string
    categorie?: string
    source?: string
    q?: string
    sort?: string
  }>
}

const CANAL_VALUES: ProspectCanal[] = ['a_definir', 'terrain', 'email', 'reseaux', 'telephone', 'ecarte']
const STATUT_VALUES: ProspectStatut[] = [
  'a_qualifier', 'qualifie', 'maquette_prete', 'contacte', 'relance_1', 'relance_2', 'relance_3',
  'repondu', 'rdv_pris', 'devis_envoye', 'signe', 'perdu', 'ecarte',
]
const CATEGORIE_VALUES: ProspectCategorie[] = [
  'boulangerie', 'boucherie', 'restaurant', 'pizzeria', 'primeur', 'fromager',
  'caviste', 'coiffeur', 'esthetique', 'kine', 'cabinet', 'menuisier',
  'plombier', 'electricien', 'peintre', 'paysagiste', 'photographe', 'autre',
]
const SOURCE_VALUES: ProspectSource[] = ['manuel', 'enrichissement', 'sourcing']

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function buildScoreTooltip(p: Prospect): string {
  if (p.score_override_manuel != null) {
    const d = p.score_override_at ? formatDate(p.score_override_at) : '—'
    const auto = p.score_calcule != null ? `${p.score_calcule}/10` : '—'
    return `Score modifié manuellement le ${d}. Score auto : ${auto}.`
  }
  const d = p.score_calcule_at ? formatDate(p.score_calcule_at) : '—'
  return `Score calculé automatiquement le ${d}.`
}

async function countEligibleForBackfill(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('prospects')
    .select('id', { count: 'exact', head: true })
    .not('google_place_id', 'is', null)
  if (error) {
    console.error('[crm/page] countEligibleForBackfill', error)
    return 0
  }
  return count ?? 0
}

async function countMaquettesToMigrate(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('maquettes')
    .select('id', { count: 'exact', head: true })
    .is('available_photos', null)
  if (error) {
    console.error('[crm/page] countMaquettesToMigrate', error)
    return 0
  }
  return count ?? 0
}

async function getProspects(filters: {
  canal?: ProspectCanal
  statut?: ProspectStatut
  categorie?: ProspectCategorie
  source?: ProspectSource
  q?: string
  sort?: SortKey
}): Promise<Prospect[]> {
  const supabase = await createClient()
  let query = supabase.from('prospects').select('*')

  // Tri principal selon le sort demandé. `nullsFirst: false` sur les
  // tris score garantit que les prospects sans score (NULL) finissent
  // en bas, qu'on tri ascendant ou descendant.
  if (filters.sort === 'score_desc') {
    query = query
      .order('score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
  } else if (filters.sort === 'score_asc') {
    query = query
      .order('score', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (filters.canal) query = query.eq('canal', filters.canal)
  if (filters.statut) query = query.eq('statut', filters.statut)
  if (filters.categorie) query = query.eq('categorie', filters.categorie)
  if (filters.source) query = query.eq('source', filters.source)

  if (filters.q) {
    // PostgREST `.or()` filter : escape commas, parens, % et _ (wildcards ilike)
    const safe = filters.q.replace(/[%_,()]/g, ' ').trim()
    if (safe) {
      query = query.or(`nom_commerce.ilike.%${safe}%,ville.ilike.%${safe}%`)
    }
  }

  const { data, error } = await query
  if (error) {
    console.error('[getProspects]', error)
    return []
  }
  return (data ?? []) as Prospect[]
}

export default async function AdminCrmPage({ searchParams }: Props) {
  const sp = await searchParams

  const canal = CANAL_VALUES.includes(sp.canal as ProspectCanal) ? (sp.canal as ProspectCanal) : undefined
  const statut = STATUT_VALUES.includes(sp.statut as ProspectStatut) ? (sp.statut as ProspectStatut) : undefined
  const categorie = CATEGORIE_VALUES.includes(sp.categorie as ProspectCategorie) ? (sp.categorie as ProspectCategorie) : undefined
  const source = SOURCE_VALUES.includes(sp.source as ProspectSource) ? (sp.source as ProspectSource) : undefined
  const q = sp.q?.trim() || undefined
  const sort: SortKey | undefined =
    sp.sort === 'score_desc' || sp.sort === 'score_asc' ? sp.sort : undefined

  const prospects = await getProspects({ canal, statut, categorie, source, q, sort })
  const hasFilters = !!(canal || statut || categorie || source || q || sort)
  const eligibleForBackfill = await countEligibleForBackfill()
  const maquettesToMigrate = await countMaquettesToMigrate()

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-extrabold text-ink">Prospects</h1>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={(() => {
              const params = new URLSearchParams()
              if (canal) params.set('canal', canal)
              if (statut) params.set('statut', statut)
              if (categorie) params.set('categorie', categorie)
              if (source) params.set('source', source)
              if (q) params.set('q', q)
              if (sort) params.set('sort', sort)
              const qs = params.toString()
              return `/api/admin/prospects/export${qs ? `?${qs}` : ''}`
            })()}
            className="inline-flex items-center justify-center rounded-sm border border-border bg-transparent px-5 py-2.5 font-heading text-sm font-bold text-text transition-opacity hover:bg-surface-strong"
          >
            Exporter en CSV{hasFilters ? ' (filtré)' : ''}
          </a>
          <LinkButton href="/admin/crm/sourcing" variant="secondary" size="md">
            Sourcing
          </LinkButton>
          <LinkButton href="/admin/crm/import" variant="secondary" size="md">
            Importer depuis Google
          </LinkButton>
          <LinkButton href="/admin/crm/nouveau" variant="primary" size="md">
            + Nouveau prospect
          </LinkButton>
        </div>
      </div>

      <div className="mb-2 flex justify-end gap-6">
        <MigrateMaquettesPhotosButton pendingCount={maquettesToMigrate} />
        <BackfillGoogleReviewsButton eligibleCount={eligibleForBackfill} />
        <BackfillGooglePhotosButton eligibleCount={eligibleForBackfill} />
        <RecomputeAllScoresButton />
      </div>

      <ProspectFilters />

      {prospects.length === 0 ? (
        <div className="rounded-md border border-border bg-surface py-16 text-center">
          {hasFilters ? (
            <p className="font-body text-base text-muted">
              Aucun prospect ne correspond à ces filtres.
            </p>
          ) : (
            <>
              <p className="font-body text-base text-muted">
                Aucun prospect pour l&apos;instant.
              </p>
              <div className="mt-4">
                <LinkButton href="/admin/crm/nouveau" variant="primary" size="md">
                  Créer mon premier prospect
                </LinkButton>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
        {/* Tableau — desktop uniquement */}
        <div className="hidden overflow-x-auto rounded-md border border-border bg-surface shadow-sm lg:block">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-surface-soft">
              <tr>
                <th className="px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted">Commerce</th>
                <th className="hidden px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted sm:table-cell">Catégorie</th>
                <th className="hidden px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">Ville</th>
                <th className="hidden px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted lg:table-cell">Distance</th>
                <th className="hidden px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted lg:table-cell">Score</th>
                <th className="hidden px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">Canal</th>
                <th className="px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted">Statut</th>
                <th className="hidden px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted xl:table-cell">Dernier contact</th>
                <th className="px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {prospects.map((p) => (
                <tr key={p.id} className="hover:bg-surface-soft">
                  <td className="px-5 py-4">
                    <span
                      className="mr-2 inline-block text-sm"
                      title={`${SOURCE_LABELS[p.source]} — créé le ${formatDate(p.created_at)}`}
                      aria-label={SOURCE_LABELS[p.source]}
                    >
                      {SOURCE_ICONS[p.source]}
                    </span>
                    <Link
                      href={`/admin/crm/${p.id}`}
                      className="font-body text-sm font-semibold text-ink hover:text-primary hover:underline"
                    >
                      {p.nom_commerce}
                    </Link>
                  </td>
                  <td className="hidden px-5 py-4 sm:table-cell">
                    <Badge variant={CATEGORIE_BADGE}>{displayCategorie(p)}</Badge>
                  </td>
                  <td className="hidden px-5 py-4 md:table-cell">
                    <span className="font-body text-sm text-muted">{p.ville ?? '—'}</span>
                  </td>
                  <td className="hidden px-5 py-4 lg:table-cell">
                    <span className="font-body text-sm text-muted">
                      {p.distance_km != null ? `${p.distance_km} km` : '—'}
                    </span>
                  </td>
                  <td className="hidden px-5 py-4 lg:table-cell">
                    {p.score != null ? (
                      <span
                        className="inline-flex items-baseline gap-1 font-body text-sm font-semibold text-ink"
                        title={buildScoreTooltip(p)}
                      >
                        {p.score}/10
                        <span
                          aria-label={p.score_override_manuel != null ? 'Score manuel' : 'Score auto'}
                          className="text-xs"
                        >
                          {p.score_override_manuel != null ? '✋' : '🤖'}
                        </span>
                      </span>
                    ) : (
                      <span className="font-body text-sm text-muted">—</span>
                    )}
                  </td>
                  <td className="hidden px-5 py-4 md:table-cell">
                    <Badge variant={CANAL_BADGE[p.canal]}>{CANAL_LABELS[p.canal]}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge statut={p.statut} />
                  </td>
                  <td className="hidden px-5 py-4 xl:table-cell">
                    <span className="font-body text-sm text-muted">{formatDate(p.date_dernier_contact)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/crm/${p.id}`}
                        className="font-body text-sm font-medium text-primary hover:underline"
                      >
                        Voir
                      </Link>
                      <span className="text-muted">·</span>
                      <Link
                        href={`/admin/crm/${p.id}/modifier`}
                        className="font-body text-sm font-medium text-primary hover:underline"
                      >
                        Modifier
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cartes — mobile uniquement */}
        <div className="flex flex-col gap-3 lg:hidden">
          {prospects.map((p) => (
            <ProspectCard key={p.id} prospect={p} />
          ))}
        </div>
        </>
      )}
    </div>
  )
}
