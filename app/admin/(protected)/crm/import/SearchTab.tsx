'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import type { EnrichedPlaceData } from '@/lib/google-places'
import { Button } from '@/components/ui/Button'
import { searchProspectsAction } from '@/lib/actions/google-import'
import { CATEGORIE_LABELS } from '@/lib/crm/constants'
import { Badge } from '@/components/ui/Badge'
import EnrichedPreview from './EnrichedPreview'
import PreviewActions from './PreviewActions'

const fieldClass =
  'w-full rounded-sm border border-border bg-white px-4 py-3 font-body text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
const labelClass = 'mb-1.5 block font-body text-sm font-semibold text-ink'

export default function SearchTab() {
  const params = useSearchParams()
  const initialName = params.get('name')?.slice(0, 200) ?? ''
  const initialCity = params.get('city')?.slice(0, 120) ?? ''
  const bindParam = params.get('bind') ?? undefined
  const bindToProspectId = bindParam && /^[0-9a-f-]{36}$/i.test(bindParam) ? bindParam : undefined

  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(initialName)
  const [city, setCity] = useState(initialCity)
  const [results, setResults] = useState<EnrichedPlaceData[] | null>(null)
  const [selected, setSelected] = useState<EnrichedPlaceData | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setResults(null)
    setSelected(null)
    startTransition(async () => {
      const r = await searchProspectsAction(name, city)
      if (r.success) {
        setResults(r.data)
        if (r.data.length === 1) setSelected(r.data[0])
      } else {
        setError(r.error)
      }
    })
  }

  function reset() {
    setSelected(null)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-md border border-border bg-surface p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="search-name" className={labelClass}>
              Nom du commerce <span className="text-cta">*</span>
            </label>
            <input
              id="search-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Boulangerie Martin"
              className={fieldClass}
              maxLength={200}
            />
          </div>
          <div>
            <label htmlFor="search-city" className={labelClass}>Ville</label>
            <input
              id="search-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="L'Isle-Jourdain"
              className={fieldClass}
              maxLength={120}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" variant="primary" size="md" loading={pending}>
            Rechercher sur Google
          </Button>
        </div>
      </form>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Liste des résultats */}
      {results && !selected && (
        <div className="space-y-3">
          <p className="font-body text-sm text-muted">
            {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}. Cliquez sur celui qui correspond.
          </p>
          {results.map((r) => (
            <button
              key={r.placeId}
              type="button"
              onClick={() => setSelected(r)}
              className="block w-full rounded-md border border-border bg-surface p-4 text-left shadow-sm transition-colors hover:border-primary hover:bg-surface-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-base font-bold text-ink">{r.name}</p>
                  <p className="mt-1 font-body text-sm text-muted">{r.formattedAddress ?? '—'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="gray">
                      {r.suggestedCategorie === 'autre' && r.primaryTypeDisplay
                        ? r.primaryTypeDisplay
                        : CATEGORIE_LABELS[r.suggestedCategorie]}
                    </Badge>
                    {r.distanceKm != null && (
                      <span className="font-body text-xs text-muted">{r.distanceKm} km</span>
                    )}
                    {r.rating != null && (
                      <span className="font-body text-xs text-muted">
                        ★ {r.rating.toFixed(1)} ({r.userRatingCount ?? 0})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Aperçu du résultat sélectionné */}
      {selected && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-extrabold text-ink">Aperçu enrichi</h2>
            {results && results.length > 1 && (
              <button
                type="button"
                onClick={reset}
                className="font-body text-sm text-muted hover:text-primary"
              >
                ← Choisir un autre résultat
              </button>
            )}
          </div>
          <EnrichedPreview data={selected} />
          <PreviewActions
            placeId={selected.placeId}
            placeName={selected.name}
            bindToProspectId={bindToProspectId}
          />
        </div>
      )}
    </div>
  )
}
