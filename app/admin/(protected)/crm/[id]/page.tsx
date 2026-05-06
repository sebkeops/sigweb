import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Prospect } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { LinkButton } from '@/components/ui/Button'
import {
  CANAL_BADGE,
  CANAL_LABELS,
  CATEGORIE_BADGE,
  displayCategorie,
  STATUT_BADGE,
  STATUT_LABELS,
} from '@/lib/crm/constants'
import DeleteProspectButton from './DeleteProspectButton'
import GenerateMaquetteButton from './GenerateMaquetteButton'
import RefreshFromGoogleButton from './RefreshFromGoogleButton'
import ScoreBreakdown from './ScoreBreakdown'

export const metadata: Metadata = { title: 'Fiche prospect | Admin Sigweb' }

interface Props {
  params: Promise<{ id: string }>
}

async function getProspect(id: string): Promise<Prospect | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('prospects').select('*').eq('id', id).single()
  return (data as Prospect | null) ?? null
}

interface ExistingMaquette {
  id: string
  slug: string
  published: boolean
}

async function getExistingMaquette(prospectId: string): Promise<ExistingMaquette | null> {
  const supabase = await createClient()
  // Lookup par prospect_id (et pas via prospects.maquette_id) : reste cohérent
  // même si la liaison prospect.maquette_id a échoué après l'insert maquette.
  const { data } = await supabase
    .from('maquettes')
    .select('id, slug, published')
    .eq('prospect_id', prospectId)
    .maybeSingle()
  return (data as ExistingMaquette | null) ?? null
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const GOOGLE_STATUS_LABELS: Record<string, string> = {
  OPERATIONAL: 'Ouvert',
  CLOSED_TEMPORARILY: 'Fermé temporairement',
  CLOSED_PERMANENTLY: 'Fermé définitivement',
}

const GOOGLE_STATUS_BADGE: Record<string, 'green' | 'orange' | 'red'> = {
  OPERATIONAL: 'green',
  CLOSED_TEMPORARILY: 'orange',
  CLOSED_PERMANENTLY: 'red',
}

function buildMapsUrl(p: Prospect): string | null {
  const parts = [p.adresse, p.code_postal, p.ville].filter(Boolean)
  if (parts.length === 0) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
}

const sectionTitleClass = 'mb-4 font-heading text-base font-bold text-ink'
const sectionClass = 'rounded-md border border-border bg-surface p-6 shadow-sm'
const labelClass = 'font-body text-xs font-semibold uppercase tracking-wider text-muted'
const valueClass = 'font-body text-sm text-ink'

export default async function ProspectDetailPage({ params }: Props) {
  const { id } = await params
  const [p, existingMaquette] = await Promise.all([
    getProspect(id),
    getExistingMaquette(id),
  ])
  if (!p) notFound()

  const mapsUrl = buildMapsUrl(p)
  const hasContact = !!(p.telephone || p.email || p.site_existant_url || p.instagram_url || p.facebook_url)
  const hasLocalisation = !!(p.adresse || p.ville || p.code_postal || p.distance_km != null)

  return (
    <div className="space-y-6">
      {/* Breadcrumb + actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/crm" className="font-body text-sm text-muted hover:text-primary">
            ← Prospects
          </Link>
          <span className="text-muted">/</span>
          <h1 className="font-heading text-2xl font-extrabold text-ink">{p.nom_commerce}</h1>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <RefreshFromGoogleButton prospectId={p.id} hasPlaceId={!!p.google_place_id} />
          <GenerateMaquetteButton
            prospectId={p.id}
            categorie={p.categorie}
            existingMaquette={existingMaquette}
          />
          <LinkButton href={`/admin/crm/${p.id}/modifier`} variant="primary" size="sm">
            Modifier
          </LinkButton>
          <DeleteProspectButton id={p.id} nom={p.nom_commerce} />
        </div>
      </div>

      {/* Bandeau méta — le score est désormais traité dans son propre encadré ci-dessous */}
      <div className="rounded-md border border-border bg-surface p-6 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className={labelClass}>Catégorie</p>
            <p className="mt-2">
              <Badge variant={CATEGORIE_BADGE}>{displayCategorie(p)}</Badge>
            </p>
          </div>
          <div>
            <p className={labelClass}>Canal</p>
            <p className="mt-2">
              <Badge variant={CANAL_BADGE[p.canal]}>{CANAL_LABELS[p.canal]}</Badge>
            </p>
          </div>
          <div>
            <p className={labelClass}>Statut</p>
            <p className="mt-2">
              <Badge variant={STATUT_BADGE[p.statut]}>{STATUT_LABELS[p.statut]}</Badge>
            </p>
          </div>
        </div>
      </div>

      {/* Détail du score */}
      <ScoreBreakdown prospect={p} />

      {/* Localisation */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Localisation</h2>
        {hasLocalisation ? (
          <div className="space-y-3">
            {(p.adresse || p.ville || p.code_postal) && (
              <div>
                <p className={labelClass}>Adresse</p>
                <p className={`${valueClass} mt-1`}>
                  {[p.adresse, [p.code_postal, p.ville].filter(Boolean).join(' ')]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block font-body text-sm text-primary hover:underline"
                  >
                    Voir sur Google Maps ↗
                  </a>
                )}
              </div>
            )}
            {p.distance_km != null && (
              <div>
                <p className={labelClass}>Distance</p>
                <p className={`${valueClass} mt-1`}>{p.distance_km} km depuis L&apos;Isle-Jourdain</p>
              </div>
            )}
          </div>
        ) : (
          <p className="font-body text-sm text-muted">Aucune information de localisation.</p>
        )}
      </div>

      {/* Contact */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Contact</h2>
        {hasContact ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {p.telephone && (
              <div>
                <p className={labelClass}>Téléphone</p>
                <a
                  href={`tel:${p.telephone}`}
                  className="mt-1 block font-body text-sm text-primary hover:underline"
                >
                  {p.telephone}
                </a>
              </div>
            )}
            {p.email && (
              <div>
                <p className={labelClass}>Email</p>
                <a
                  href={`mailto:${p.email}`}
                  className="mt-1 block font-body text-sm text-primary hover:underline"
                >
                  {p.email}
                </a>
              </div>
            )}
            {p.site_existant_url && (
              <div>
                <p className={labelClass}>Site existant</p>
                <a
                  href={p.site_existant_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all font-body text-sm text-primary hover:underline"
                >
                  {p.site_existant_url} ↗
                </a>
              </div>
            )}
            {p.instagram_url && (
              <div>
                <p className={labelClass}>Instagram</p>
                <a
                  href={p.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all font-body text-sm text-primary hover:underline"
                >
                  {p.instagram_url} ↗
                </a>
              </div>
            )}
            {p.facebook_url && (
              <div>
                <p className={labelClass}>Facebook</p>
                <a
                  href={p.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all font-body text-sm text-primary hover:underline"
                >
                  {p.facebook_url} ↗
                </a>
              </div>
            )}
          </div>
        ) : (
          <p className="font-body text-sm text-muted">Aucun contact renseigné.</p>
        )}
      </div>

      {/* Suivi */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Suivi</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={labelClass}>Date du dernier contact</p>
            <p className={`${valueClass} mt-1`}>{formatDate(p.date_dernier_contact)}</p>
          </div>
          <div>
            <p className={labelClass}>Date de relance prévue</p>
            <p className={`${valueClass} mt-1`}>{formatDate(p.date_relance_prevue)}</p>
          </div>
        </div>
      </div>

      {/* Données Google — visible uniquement si la fiche est liée */}
      {p.google_place_id && (
        <div className={sectionClass}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-base font-bold text-ink">Données Google</h2>
            <span className="font-body text-xs text-muted">
              Dernier enrichissement : {formatDateTime(p.last_enriched_at)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <p className={labelClass}>Note</p>
              <p className={`${valueClass} mt-1`}>
                {p.google_rating != null ? (
                  <>
                    <span className="font-heading text-lg font-bold text-accent">{p.google_rating.toFixed(1)}</span>
                    <span className="ml-1 text-muted">/5</span>
                  </>
                ) : '—'}
              </p>
            </div>
            <div>
              <p className={labelClass}>Avis</p>
              <p className={`${valueClass} mt-1`}>
                {p.google_reviews_count != null ? p.google_reviews_count : '—'}
              </p>
            </div>
            <div>
              <p className={labelClass}>Statut</p>
              <p className="mt-2">
                {p.google_business_status ? (
                  <Badge variant={GOOGLE_STATUS_BADGE[p.google_business_status] ?? 'gray'}>
                    {GOOGLE_STATUS_LABELS[p.google_business_status] ?? p.google_business_status}
                  </Badge>
                ) : (
                  <span className="font-body text-sm text-muted">—</span>
                )}
              </p>
            </div>
            <div>
              <p className={labelClass}>Lien</p>
              {p.google_maps_url ? (
                <a
                  href={p.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block font-body text-sm text-primary hover:underline"
                >
                  Voir sur Google Maps ↗
                </a>
              ) : (
                <span className="font-body text-sm text-muted">—</span>
              )}
            </div>
          </div>

          {p.google_opening_hours?.weekdayDescriptions && p.google_opening_hours.weekdayDescriptions.length > 0 && (
            <div className="mt-6">
              <p className={labelClass}>Horaires</p>
              <ul className="mt-2 space-y-1">
                {p.google_opening_hours.weekdayDescriptions.map((line, i) => (
                  <li key={i} className={valueClass}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {p.google_photo_refs && p.google_photo_refs.length > 0 && (
            <div className="mt-6">
              <p className={labelClass}>Photos ({p.google_photo_refs.length})</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {p.google_photo_refs.map((ref) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={ref}
                    src={`/api/admin/places-photo?ref=${encodeURIComponent(ref)}&w=400`}
                    alt="Photo Google"
                    loading="lazy"
                    className="h-28 w-40 rounded-sm border border-border object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Notes</h2>
        {p.notes ? (
          <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-text">
            {p.notes}
          </p>
        ) : (
          <p className="font-body text-sm text-muted">Aucune note.</p>
        )}
      </div>
    </div>
  )
}
