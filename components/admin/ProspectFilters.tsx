'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CANAL_OPTIONS, getExposedCategoriesByFamily, SOURCE_OPTIONS, STATUT_OPTIONS } from '@/lib/crm/constants'

const fieldClass =
  'rounded-sm border border-border bg-white px-3 py-2 font-body text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setQ(initialQ)
  }, [initialQ])

  function pushParams(next: { canal?: string; statut?: string; categorie?: string; q?: string }) {
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

  const hasFilters = !!(canal || statut || categorie || source || q || sort)

  function reset() {
    setQ('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    router.push('/admin/crm')
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface p-4">
      <input
        type="search"
        placeholder="Rechercher (nom, ville)…"
        value={q}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`${fieldClass} min-w-[220px] flex-1`}
      />

      <select
        value={canal}
        onChange={(e) => onSelectChange('canal', e.target.value)}
        className={fieldClass}
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
        className={fieldClass}
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
        className={fieldClass}
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
        className={fieldClass}
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
        className={fieldClass}
        aria-label="Trier"
      >
        <option value="">Récents en premier</option>
        <option value="score_desc">Score : meilleur en premier</option>
        <option value="score_asc">Score : plus faible en premier</option>
      </select>

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
  )
}
