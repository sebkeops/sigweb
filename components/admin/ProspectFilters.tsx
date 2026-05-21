'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CANAL_OPTIONS, getExposedCategoriesByFamily, SOURCE_OPTIONS, STATUT_OPTIONS } from '@/lib/crm/constants'
import { useIsMobile } from '@/hooks/useIsMobile'
import FiltersDrawer from '@/components/admin/FiltersDrawer'

const fieldClass =
  'rounded-sm border border-border bg-white px-3 py-2 font-body text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

// Selects : pleine largeur empiles dans le drawer mobile, largeur auto en
// ligne sur desktop.
const selectClass = `${fieldClass} w-full lg:w-auto`

export default function ProspectFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const canal = searchParams.get('canal') ?? ''
  const statut = searchParams.get('statut') ?? ''
  const categorie = searchParams.get('categorie') ?? ''
  const source = searchParams.get('source') ?? ''
  const sort = searchParams.get('sort') ?? ''
  const initialQ = searchParams.get('q') ?? ''

  const [q, setQ] = useState(initialQ)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    setQ(initialQ)
  }, [initialQ])

  // Repli auto du drawer si on repasse en desktop.
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false)
  }, [isMobile])

  function pushParams(next: {
    canal?: string
    statut?: string
    categorie?: string
    source?: string
    sort?: string
    q?: string
  }) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    router.push(`/admin/crm${params.toString() ? `?${params.toString()}` : ''}`)
  }

  function onSelectChange(
    name: 'canal' | 'statut' | 'categorie' | 'source' | 'sort',
    value: string
  ) {
    pushParams({ [name]: value })
  }

  function onSearchChange(value: string) {
    setQ(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushParams({ q: value.trim() })
    }, 300)
  }

  // Filtres du drawer actifs (la recherche, toujours visible, est comptee a part).
  const activeCount = [canal, statut, categorie, source, sort].filter(Boolean).length
  const hasFilters = activeCount > 0 || !!q

  function reset() {
    setQ('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.push('/admin/crm')
  }

  // Les 5 selects — rendus en ligne sur desktop ET dans le drawer mobile.
  const selects = (
    <>
      <select
        value={canal}
        onChange={(e) => onSelectChange('canal', e.target.value)}
        className={selectClass}
        aria-label="Filtrer par canal"
      >
        <option value="">Tous canaux</option>
        {CANAL_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={statut}
        onChange={(e) => onSelectChange('statut', e.target.value)}
        className={selectClass}
        aria-label="Filtrer par statut"
      >
        <option value="">Tous statuts</option>
        {STATUT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={categorie}
        onChange={(e) => onSelectChange('categorie', e.target.value)}
        className={selectClass}
        aria-label="Filtrer par catégorie"
      >
        <option value="">Toutes catégories</option>
        {getExposedCategoriesByFamily().map((g) => (
          <optgroup key={g.family} label={g.label}>
            {g.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <select
        value={source}
        onChange={(e) => onSelectChange('source', e.target.value)}
        className={selectClass}
        aria-label="Filtrer par source"
      >
        <option value="">Toutes sources</option>
        {SOURCE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(e) => onSelectChange('sort', e.target.value)}
        className={selectClass}
        aria-label="Trier"
      >
        <option value="">Récents en premier</option>
        <option value="score_desc">Score : meilleur en premier</option>
        <option value="score_asc">Score : plus faible en premier</option>
      </select>
    </>
  )

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface p-4">
      <input
        type="search"
        placeholder="Rechercher (nom, ville)…"
        value={q}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`${fieldClass} flex-1 lg:min-w-[220px]`}
      />

      {/* Desktop : selects en ligne. `lg:contents` -> les selects redeviennent
          des enfants directs du flex, wrapping identique a l'avant-refonte. */}
      <div className="hidden lg:contents">
        {selects}
        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="font-body text-sm font-medium text-muted hover:text-primary"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Mobile : bouton ouvrant le drawer de filtres. */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="flex min-h-[44px] items-center gap-2 rounded-sm border border-border bg-white px-4 font-body text-sm font-medium text-ink lg:hidden"
      >
        Filtres
        {activeCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cta px-1.5 font-body text-xs font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      <FiltersDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        hasFilters={hasFilters}
        onReset={reset}
      >
        {selects}
      </FiltersDrawer>
    </div>
  )
}
