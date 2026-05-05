'use client'

import type { EnrichedPlaceData } from '@/lib/google-places'
import { Badge } from '@/components/ui/Badge'
import { CATEGORIE_LABELS } from '@/lib/crm/constants'

function displayCategorieFromEnriched(d: { suggestedCategorie: string; primaryTypeDisplay: string | null }): string {
  if (d.suggestedCategorie === 'autre' && d.primaryTypeDisplay) return d.primaryTypeDisplay
  return CATEGORIE_LABELS[d.suggestedCategorie as keyof typeof CATEGORIE_LABELS] ?? 'Autre'
}

interface Props {
  data: EnrichedPlaceData
}

const sectionTitleClass = 'mb-3 font-heading text-sm font-bold uppercase tracking-wider text-muted'
const labelClass = 'font-body text-xs font-semibold uppercase tracking-wider text-muted'
const valueClass = 'font-body text-sm text-ink'

const STATUS_LABELS: Record<string, string> = {
  OPERATIONAL: 'Ouvert',
  CLOSED_TEMPORARILY: 'Fermé temporairement',
  CLOSED_PERMANENTLY: 'Fermé définitivement',
}

const STATUS_BADGE: Record<string, 'green' | 'orange' | 'red'> = {
  OPERATIONAL: 'green',
  CLOSED_TEMPORARILY: 'orange',
  CLOSED_PERMANENTLY: 'red',
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span aria-label={`${rating} sur 5`}>
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(empty)}
    </span>
  )
}

export default function EnrichedPreview({ data }: Props) {
  return (
    <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-xl font-extrabold text-ink">{data.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="gray">{displayCategorieFromEnriched(data)}</Badge>
            {data.businessStatus && (
              <Badge variant={STATUS_BADGE[data.businessStatus] ?? 'gray'}>
                {STATUS_LABELS[data.businessStatus] ?? data.businessStatus}
              </Badge>
            )}
          </div>
        </div>
        {data.rating != null && (
          <div className="text-right">
            <p className="font-heading text-2xl font-extrabold text-accent">
              <Stars rating={data.rating} />{' '}
              <span className="font-body text-base text-ink">{data.rating.toFixed(1)}</span>
            </p>
            <p className="font-body text-xs text-muted">
              {data.userRatingCount ?? 0} avis Google
            </p>
          </div>
        )}
      </div>

      {/* Localisation */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className={labelClass}>Adresse</p>
          <p className={`${valueClass} mt-1`}>{data.formattedAddress ?? '—'}</p>
        </div>
        <div>
          <p className={labelClass}>Distance</p>
          <p className={`${valueClass} mt-1`}>
            {data.distanceKm != null ? `${data.distanceKm} km` : '—'}
          </p>
        </div>
      </div>

      {/* Contact */}
      {(data.phoneNumber || data.website) && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {data.phoneNumber && (
            <div>
              <p className={labelClass}>Téléphone</p>
              <p className={`${valueClass} mt-1`}>{data.phoneNumber}</p>
            </div>
          )}
          {data.website && (
            <div>
              <p className={labelClass}>Site web</p>
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block break-all font-body text-sm text-primary hover:underline"
              >
                {data.website} ↗
              </a>
            </div>
          )}
        </div>
      )}

      {/* Horaires */}
      {data.openingHours?.weekdayDescriptions && data.openingHours.weekdayDescriptions.length > 0 && (
        <div className="mb-6">
          <h4 className={sectionTitleClass}>Horaires</h4>
          <ul className="space-y-1">
            {data.openingHours.weekdayDescriptions.map((line, i) => (
              <li key={i} className={valueClass}>
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Photos */}
      {data.photoRefs.length > 0 && (
        <div className="mb-6">
          <h4 className={sectionTitleClass}>Photos ({data.photoRefs.length})</h4>
          <div className="flex flex-wrap gap-3">
            {data.photoRefs.map((ref) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={ref}
                src={`/api/admin/places-photo?ref=${encodeURIComponent(ref)}&w=400`}
                alt="Aperçu Google"
                loading="lazy"
                className="h-28 w-40 rounded-sm border border-border object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {/* Liens externes */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4">
        {data.googleMapsUrl && (
          <a
            href={data.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm text-primary hover:underline"
          >
            Voir sur Google Maps ↗
          </a>
        )}
        <span className="font-body text-xs text-muted">
          Place ID : <code className="rounded bg-surface-soft px-1 py-0.5 font-mono">{data.placeId}</code>
        </span>
      </div>
    </div>
  )
}
