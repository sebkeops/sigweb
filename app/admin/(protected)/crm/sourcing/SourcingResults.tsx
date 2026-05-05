'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CATEGORIE_LABELS } from '@/lib/crm/constants'
import type { ProspectCategorie } from '@/types'
import type { SourcingResult } from '@/lib/sourcing/run'

interface Props {
  data: SourcingResult[]
  meta: {
    categories: ProspectCategorie[]
    radiusKm: number
    count: number
  }
  onReset: () => void
  onImport: (selectedPlaceIds: string[]) => void
  importPending?: boolean
  importError?: string | null
}

type SortCol = 'score' | 'name' | 'distance'
interface Sort {
  col: SortCol
  dir: 'asc' | 'desc'
}

function scoreColorClass(score: number): string {
  if (score >= 8) return 'text-primary-dark'
  if (score >= 5) return 'text-accent'
  return 'text-red-600'
}

function scoreBadgeClass(score: number): string {
  if (score >= 8) return 'bg-primary-soft text-primary-dark'
  if (score >= 5) return 'bg-accent-soft text-accent'
  return 'bg-red-100 text-red-700'
}

function statusLabel(s: string | null): { label: string; cls: string } {
  if (s === 'CLOSED_TEMPORARILY') return { label: 'Fermé temp.', cls: 'bg-accent-soft text-accent' }
  if (s === 'CLOSED_PERMANENTLY') return { label: 'Fermé déf.', cls: 'bg-red-100 text-red-700' }
  if (s === 'OPERATIONAL') return { label: 'Ouvert', cls: 'bg-primary-soft text-primary-dark' }
  return { label: '—', cls: 'bg-surface-strong text-muted' }
}

export default function SourcingResults({
  data,
  meta,
  onReset,
  onImport,
  importPending = false,
  importError = null,
}: Props) {
  // ── Filtres locaux ─────────────────────────────────────────────────
  const [scoreMin, setScoreMin] = useState(0)
  const [categorieFilter, setCategorieFilter] = useState<ProspectCategorie | ''>('')
  const [sort, setSort] = useState<Sort>({ col: 'score', dir: 'desc' })
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Catégories réellement présentes dans les résultats
  const presentCategories = useMemo(() => {
    const s = new Set<ProspectCategorie>()
    for (const r of data) s.add(r.data.suggestedCategorie)
    return [...s].sort((a, b) => CATEGORIE_LABELS[a].localeCompare(CATEGORIE_LABELS[b]))
  }, [data])

  const visible = useMemo(() => {
    let list = data
    if (scoreMin > 0) list = list.filter((r) => r.score.total >= scoreMin)
    if (categorieFilter) list = list.filter((r) => r.data.suggestedCategorie === categorieFilter)

    const dir = sort.dir === 'asc' ? 1 : -1
    list = [...list].sort((a, b) => {
      let cmp = 0
      switch (sort.col) {
        case 'score':
          cmp = a.score.total - b.score.total
          break
        case 'name':
          cmp = a.data.name.localeCompare(b.data.name)
          break
        case 'distance':
          cmp = (a.data.distanceKm ?? Infinity) - (b.data.distanceKm ?? Infinity)
          break
      }
      return cmp * dir
    })
    return list
  }, [data, scoreMin, categorieFilter, sort])

  function toggleSort(col: SortCol) {
    setSort((s) => {
      if (s.col === col) return { col, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      // Par défaut au changement de colonne : desc pour score, asc pour le reste
      return { col, dir: col === 'score' ? 'desc' : 'asc' }
    })
  }

  function sortIndicator(col: SortCol) {
    if (sort.col !== col) return '↕'
    return sort.dir === 'asc' ? '↑' : '↓'
  }

  function toggleOne(placeId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(placeId)) next.delete(placeId)
      else next.add(placeId)
      return next
    })
  }

  const allVisibleIds = visible.map((r) => r.placeId)
  const allChecked = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id))
  const someChecked = allVisibleIds.some((id) => selected.has(id))

  function toggleAll() {
    setSelected((prev) => {
      if (allChecked) {
        // Décocher tout ce qui est visible (garde les autres)
        const next = new Set(prev)
        for (const id of allVisibleIds) next.delete(id)
        return next
      }
      // Cocher tout ce qui est visible
      const next = new Set(prev)
      for (const id of allVisibleIds) next.add(id)
      return next
    })
  }

  function buildScoreTitle(r: SourcingResult): string {
    return [
      `Score : ${r.score.total}/10`,
      `Proximité : ${r.score.proximite}/4`,
      `Besoin web : ${r.score.besoinWeb}/4`,
      `Activité : ${r.score.activite}/2`,
      r.score.malus !== 0 ? `Malus : ${r.score.malus}` : null,
      '',
      ...r.score.explanations.map((e) => `• ${e}`),
    ]
      .filter((s) => s !== null)
      .join('\n')
  }

  function handleImport() {
    if (selected.size === 0 || importPending) return
    onImport([...selected])
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-ink">Résultats du sourcing</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            Nouvelle recherche
          </Button>
        </div>
        <p className="mt-2 font-body text-sm text-muted">
          Rayon {meta.radiusKm} km · {meta.categories.length} catégorie
          {meta.categories.length > 1 ? 's' : ''} · <strong>{meta.count}</strong> résultat
          {meta.count > 1 ? 's' : ''} trouvé{meta.count > 1 ? 's' : ''}
        </p>
      </div>

      {data.length === 0 ? (
        <div className="rounded-md border border-border bg-surface py-12 text-center shadow-sm">
          <p className="font-body text-base text-muted">
            Aucun résultat. Élargissez le rayon ou ajoutez d&apos;autres catégories.
          </p>
        </div>
      ) : (
        <>
          {/* Filtres locaux */}
          <div className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-surface p-4">
            {presentCategories.length > 1 && (
              <label className="flex items-center gap-2 font-body text-sm">
                <span className="text-muted">Catégorie :</span>
                <select
                  value={categorieFilter}
                  onChange={(e) => setCategorieFilter(e.target.value as ProspectCategorie | '')}
                  className="rounded-sm border border-border bg-white px-3 py-1.5 text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Toutes ({data.length})</option>
                  {presentCategories.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORIE_LABELS[c]} ({data.filter((r) => r.data.suggestedCategorie === c).length})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex flex-1 items-center gap-3 font-body text-sm">
              <span className="text-muted">Score min :</span>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={scoreMin}
                onChange={(e) => setScoreMin(parseInt(e.target.value, 10))}
                className="flex-1 accent-primary"
              />
              <span className="font-heading font-bold text-primary">{scoreMin}/10</span>
            </label>
          </div>

          {/* Sélection counter + import */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface p-4">
            <p className="font-body text-sm text-ink">
              <strong>{selected.size}</strong> prospect{selected.size > 1 ? 's' : ''} sélectionné
              {selected.size > 1 ? 's' : ''}{' '}
              <span className="text-muted">sur {visible.length} affiché{visible.length > 1 ? 's' : ''}</span>
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleImport}
              disabled={selected.size === 0 || importPending}
              loading={importPending}
            >
              Importer la sélection ({selected.size})
            </Button>
          </div>

          {importError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
              {importError}
            </div>
          )}

          {/* Tableau */}
          <div className="overflow-x-auto rounded-md border border-border bg-surface shadow-sm">
            <table className="w-full text-left">
              <thead className="border-b border-border bg-surface-soft">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = !allChecked && someChecked
                      }}
                      onChange={toggleAll}
                      aria-label="Tout cocher"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-muted hover:text-primary"
                    onClick={() => toggleSort('name')}
                  >
                    Nom {sortIndicator('name')}
                  </th>
                  <th className="hidden px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-muted sm:table-cell">
                    Catégorie
                  </th>
                  <th
                    className="hidden cursor-pointer select-none px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-muted hover:text-primary md:table-cell"
                    onClick={() => toggleSort('distance')}
                  >
                    Distance {sortIndicator('distance')}
                  </th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-muted hover:text-primary"
                    onClick={() => toggleSort('score')}
                  >
                    Score {sortIndicator('score')}
                  </th>
                  <th className="hidden px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-muted lg:table-cell">
                    Statut
                  </th>
                  <th className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-muted">
                    Voir
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((r) => {
                  const checked = selected.has(r.placeId)
                  const status = statusLabel(r.data.businessStatus)
                  return (
                    <tr
                      key={r.placeId}
                      className={`hover:bg-surface-soft ${checked ? 'bg-primary-soft/20' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleOne(r.placeId)}
                          aria-label={`Sélectionner ${r.data.name}`}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-body text-sm font-semibold text-ink">{r.data.name}</p>
                        {r.alreadyInCrm && (
                          <p className="font-body text-xs text-muted">Déjà dans le CRM</p>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <Badge variant="gray">
                          {r.data.suggestedCategorie === 'autre' && r.data.primaryTypeDisplay
                            ? r.data.primaryTypeDisplay
                            : CATEGORIE_LABELS[r.data.suggestedCategorie]}
                        </Badge>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <span className="font-body text-sm text-muted">
                          {r.data.distanceKm != null ? `${r.data.distanceKm} km` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          title={buildScoreTitle(r)}
                          className={`inline-flex items-baseline rounded-full px-2.5 py-1 font-body text-sm font-bold ${scoreBadgeClass(r.score.total)}`}
                        >
                          <span className={scoreColorClass(r.score.total)}>{r.score.total}</span>
                          <span className="ml-1 text-xs opacity-70">/10</span>
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-body text-xs font-semibold ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.data.googleMapsUrl ? (
                          <a
                            href={r.data.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-body text-sm text-primary hover:underline"
                          >
                            Maps ↗
                          </a>
                        ) : (
                          <span className="font-body text-sm text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center font-body text-sm text-muted">
                      Aucun résultat ne correspond aux filtres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
