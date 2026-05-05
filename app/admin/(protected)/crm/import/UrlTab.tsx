'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import type { EnrichedPlaceData } from '@/lib/google-places'
import { Button } from '@/components/ui/Button'
import { searchProspectByUrlAction } from '@/lib/actions/google-import'
import EnrichedPreview from './EnrichedPreview'
import PreviewActions from './PreviewActions'

const fieldClass =
  'w-full rounded-sm border border-border bg-white px-4 py-3 font-body text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
const labelClass = 'mb-1.5 block font-body text-sm font-semibold text-ink'

export default function UrlTab() {
  const params = useSearchParams()
  const bindParam = params.get('bind') ?? undefined
  const bindToProspectId = bindParam && /^[0-9a-f-]{36}$/i.test(bindParam) ? bindParam : undefined

  const [pending, startTransition] = useTransition()
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<EnrichedPlaceData | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setResult(null)
    startTransition(async () => {
      const r = await searchProspectByUrlAction(url)
      if (r.success) {
        setResult(r.data)
      } else {
        setError(r.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-md border border-border bg-surface p-6 shadow-sm">
        <div>
          <label htmlFor="url-input" className={labelClass}>
            URL Google Maps <span className="text-cta">*</span>
          </label>
          <input
            id="url-input"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/... ou https://www.google.com/maps/place/..."
            className={fieldClass}
            maxLength={2048}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <Button type="submit" variant="primary" size="md" loading={pending}>
            Récupérer les infos
          </Button>
        </div>
        <div className="mt-4 rounded-sm bg-surface-soft p-3 font-body text-xs text-muted">
          💡 <strong>Sur mobile :</strong> tapez sur le commerce dans Google Maps puis « Partager »
          → « Copier le lien ». L&apos;URL ressemble à <code className="rounded bg-white px-1">maps.app.goo.gl/xxxxx</code>.
          <br />
          <strong>Sur ordinateur :</strong> ouvrez le commerce dans Google Maps, copiez l&apos;URL de
          la barre d&apos;adresse (commence par <code className="rounded bg-white px-1">google.com/maps/place/...</code>).
        </div>
      </form>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-extrabold text-ink">Aperçu enrichi</h2>
          <EnrichedPreview data={result} />
          <PreviewActions
            placeId={result.placeId}
            placeName={result.name}
            bindToProspectId={bindToProspectId}
          />
        </div>
      )}
    </div>
  )
}
