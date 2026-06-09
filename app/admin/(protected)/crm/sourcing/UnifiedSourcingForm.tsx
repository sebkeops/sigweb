'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import {
  CATEGORIE_LABELS,
  CATEGORIE_OPTIONS,
  CATEGORIES_EXPOSED_IN_ADMIN,
} from '@/lib/crm/constants'
import { categorieFromNaf } from '@/lib/sirene/naf-mapping'
import type { ProspectCategorie } from '@/types'
import {
  importSourcingBatchAction,
  runSourcingAction,
  type ImportFailure,
} from '@/lib/actions/sourcing'
import {
  importSireneBatchAction,
  runSireneSourcingAction,
  type SireneImportFailure,
  type SireneSourcingRow,
} from '@/lib/actions/sirene-sourcing'
import type { SourcingResult } from '@/lib/sourcing/run'
import SourcingResults from './SourcingResults'

interface Props {
  baseCoords: { lat: number; lng: number } | null
}

type Source = 'google' | 'sirene'

/**
 * Formulaire de sourcing unifié Google + Sirene (chantier Sirene/PageSpeed,
 * suite à demande utilisateur de fusion UI).
 *
 * Un seul écran :
 *   - radio « Google » / « Sirene » en haut
 *   - sections communes : zone (centre + rayon) + catégories (multi-sélection)
 *   - filtres conditionnés selon la source choisie :
 *       Google : exclure fermés / exclure chaînes / limite résultats
 *       Sirene : créés depuis < N mois
 *       Commun : exclure prospects déjà en CRM
 *
 * Les vues `results` et `imported` restent distinctes (structures Google
 * vs Sirene différentes) — discriminant `kind` dans le state.
 */

const SOURCEABLE = CATEGORIE_OPTIONS.filter(
  (o) => o.value !== 'autre' && CATEGORIES_EXPOSED_IN_ADMIN.has(o.value)
)

const fieldClass =
  'rounded-sm border border-border bg-white px-4 py-2.5 font-body text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

interface GoogleMeta {
  categories: ProspectCategorie[]
  radiusKm: number
  count: number
}

interface SireneMeta {
  zone: string
  count: number
  communesCount: number
  codesPostauxCount: number
}

type ViewState =
  | { phase: 'form' }
  | { phase: 'loading'; source: Source; longRun: boolean }
  | {
      phase: 'results'
      kind: 'google'
      data: SourcingResult[]
      meta: GoogleMeta
      importPending: boolean
      importError: string | null
    }
  | {
      phase: 'results'
      kind: 'sirene'
      data: SireneSourcingRow[]
      meta: SireneMeta
      searchCats: ProspectCategorie[]
      selected: Set<string>
      importPending: boolean
      importError: string | null
    }
  | {
      phase: 'imported'
      kind: 'google'
      imported: number
      skipped: number
      failures: ImportFailure[]
    }
  | {
      phase: 'imported'
      kind: 'sirene'
      imported: number
      merged: number
      dedupWarnings: number
      skipped: number
      failures: SireneImportFailure[]
    }
  | { phase: 'error'; message: string }

export default function UnifiedSourcingForm({ baseCoords }: Props) {
  const [state, setState] = useState<ViewState>({ phase: 'form' })

  // Source choisie
  const [source, setSource] = useState<Source>('google')

  // États communs
  const [radiusKm, setRadiusKm] = useState(15)
  const [selectedCats, setSelectedCats] = useState<Set<ProspectCategorie>>(new Set())
  const [excludeAlreadyInCrm, setExcludeAlreadyInCrm] = useState(true)

  // États Google
  const [maxResults, setMaxResults] = useState(20)
  const [excludeClosed, setExcludeClosed] = useState(true)
  const [excludeChains, setExcludeChains] = useState(true)

  // États Sirene
  const [recentMonths, setRecentMonths] = useState(0)

  function toggleCategory(c: ProspectCategorie) {
    setSelectedCats((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedCats.size === 0) {
      setState({ phase: 'error', message: 'Sélectionne au moins une catégorie.' })
      return
    }
    if (!baseCoords) {
      setState({
        phase: 'error',
        message: 'Coordonnées du centre manquantes (SIGWEB_BASE_LATITUDE / LONGITUDE).',
      })
      return
    }

    const cats = [...selectedCats]

    if (source === 'google') {
      const longRun = maxResults >= 30
      setState({ phase: 'loading', source: 'google', longRun })
      const r = await runSourcingAction({
        categories: cats,
        radiusKm,
        maxResults,
        excludeAlreadyInCrm,
        excludeClosed,
        excludeChains,
      })
      if (r.success) {
        setState({
          phase: 'results',
          kind: 'google',
          data: r.data,
          meta: { categories: cats, radiusKm, count: r.data.length },
          importPending: false,
          importError: null,
        })
      } else {
        setState({ phase: 'error', message: r.error })
      }
      return
    }

    // Sirene
    setState({ phase: 'loading', source: 'sirene', longRun: cats.length > 2 })
    const r = await runSireneSourcingAction({
      centerLat: baseCoords.lat,
      centerLng: baseCoords.lng,
      radiusKm,
      categories: cats,
      recentMonths,
      excludeAlreadyInCrm,
    })
    if (r.success) {
      setState({
        phase: 'results',
        kind: 'sirene',
        data: r.data,
        meta: {
          zone: `${radiusKm} km autour du domicile`,
          count: r.data.length,
          communesCount: r.meta?.communesCount ?? 0,
          codesPostauxCount: r.meta?.codesPostauxCount ?? 0,
        },
        searchCats: cats,
        selected: new Set<string>(),
        importPending: false,
        importError: null,
      })
    } else {
      setState({ phase: 'error', message: r.error })
    }
  }

  function backToForm() {
    setState({ phase: 'form' })
  }

  // Import Google (depuis SourcingResults qui passe les placeIds)
  async function handleGoogleImport(selectedPlaceIds: string[]) {
    if (state.phase !== 'results' || state.kind !== 'google') return
    const items = state.data.filter((r) => selectedPlaceIds.includes(r.placeId))
    if (items.length === 0) return
    setState({ ...state, importPending: true, importError: null })
    const r = await importSourcingBatchAction(items)
    if (!r.success) {
      setState({ ...state, importPending: false, importError: r.error })
      return
    }
    setState({
      phase: 'imported',
      kind: 'google',
      imported: r.imported,
      skipped: r.skipped,
      failures: r.failures,
    })
  }

  // Import Sirene
  async function handleSireneImport() {
    if (state.phase !== 'results' || state.kind !== 'sirene') return
    const selected = state.data.filter((r) => state.selected.has(r.siret))
    if (selected.length === 0) return
    setState({ ...state, importPending: true, importError: null })
    const fallbackCat: ProspectCategorie | null =
      state.searchCats.length === 1 ? state.searchCats[0] : null
    const items = selected.map((r) => ({
      siret: r.siret,
      nom_commerce: r.nom_commerce,
      code_naf: r.code_naf,
      libelle_naf: r.libelle_naf,
      date_creation: r.date_creation,
      tranche_effectif: r.tranche_effectif,
      etat_administratif: r.etat_administratif,
      adresse: r.adresse,
      code_postal: r.code_postal,
      ville: r.ville,
      raw: r.raw,
      suggestedCategorie: categorieFromNaf(r.code_naf) ?? fallbackCat,
      // Lot 2 : propagés depuis SireneEstablishment vers SireneImportItem
      dirigeant_nom: r.dirigeant_nom,
      dirigeant_prenom: r.dirigeant_prenom,
      dirigeant_nom_diffusible: r.dirigeant_nom_diffusible,
      date_creation_entreprise: r.date_creation_entreprise,
      forme_juridique_code: r.forme_juridique_code,
      forme_juridique_label: r.forme_juridique_label,
    }))
    const r = await importSireneBatchAction(items)
    if (!r.success) {
      setState({ ...state, importPending: false, importError: r.error })
      return
    }
    setState({
      phase: 'imported',
      kind: 'sirene',
      imported: r.imported,
      merged: r.merged,
      dedupWarnings: r.dedupWarnings,
      skipped: r.skipped,
      failures: r.failures,
    })
  }

  function toggleSireneSelection(siret: string) {
    if (state.phase !== 'results' || state.kind !== 'sirene') return
    const next = new Set(state.selected)
    if (next.has(siret)) next.delete(siret)
    else next.add(siret)
    setState({ ...state, selected: next })
  }

  // ─── Rendu ─────────────────────────────────────────────────────

  if (state.phase === 'loading') {
    return <SourcingLoader source={state.source} longRun={state.longRun} />
  }

  if (state.phase === 'results' && state.kind === 'google') {
    return (
      <SourcingResults
        data={state.data}
        meta={state.meta}
        onReset={backToForm}
        onImport={handleGoogleImport}
        importPending={state.importPending}
        importError={state.importError}
      />
    )
  }

  if (state.phase === 'results' && state.kind === 'sirene') {
    return (
      <SireneResultsTable
        data={state.data}
        meta={state.meta}
        searchCats={state.searchCats}
        selected={state.selected}
        importPending={state.importPending}
        importError={state.importError}
        onToggle={toggleSireneSelection}
        onImport={handleSireneImport}
        onReset={backToForm}
      />
    )
  }

  if (state.phase === 'imported' && state.kind === 'google') {
    return <GoogleImportSuccess result={state} onReset={backToForm} />
  }

  if (state.phase === 'imported' && state.kind === 'sirene') {
    return <SireneImportSuccess result={state} onReset={backToForm} />
  }

  // Form (avec ou sans erreur affichée en haut)
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {state.phase === 'error' && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Section 0 — Choix de la source (radio) */}
      <section className="rounded-md border border-border bg-surface-soft p-6">
        <h2 className="mb-4 font-heading text-base font-bold text-ink">
          Source de sourcing
        </h2>
        <div role="radiogroup" aria-label="Source de sourcing" className="grid gap-3 sm:grid-cols-2">
          <SourceRadio
            value="google"
            current={source}
            onChange={setSource}
            label="Google"
            subtitle="Commerces présents sur Maps. Bon pour les chiffres clés (avis, photos)."
          />
          <SourceRadio
            value="sirene"
            current={source}
            onChange={setSource}
            label="Sirene"
            subtitle="Registre légal officiel. Bon pour capter les commerces récents."
          />
        </div>
      </section>

      {/* Section 1 — Zone géographique */}
      <section className="rounded-md border border-border bg-surface-soft p-6">
        <h2 className="mb-4 font-heading text-base font-bold text-ink">Zone géographique</h2>

        <div className="mb-6">
          <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted">
            Centre de recherche
          </p>
          <p className="mt-1 font-body text-sm text-ink">
            {baseCoords
              ? `Domicile (${baseCoords.lat.toFixed(4)}, ${baseCoords.lng.toFixed(4)})`
              : '⚠️ Coordonnées manquantes'}
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="radius" className="font-body text-sm font-semibold text-ink">
              Rayon de recherche
            </label>
            <span className="font-heading text-lg font-bold text-primary">{radiusKm} km</span>
          </div>
          <input
            id="radius"
            type="range"
            min={1}
            max={50}
            step={1}
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
            className="w-full accent-primary"
          />
          <div className="mt-1 flex justify-between font-body text-xs text-muted">
            <span>1 km — quartier</span>
            <span className="hidden sm:inline">15 km — agglo proche</span>
            <span>50 km — département</span>
          </div>
        </div>
      </section>

      {/* Section 2 — Catégories */}
      <section className="rounded-md border border-border bg-surface-soft p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-base font-bold text-ink">Catégories à cibler</h2>
          <span className="font-body text-xs text-muted">
            {selectedCats.size} sélectionnée{selectedCats.size > 1 ? 's' : ''}
            {selectedCats.size === 0 && ' — au moins une obligatoire'}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {SOURCEABLE.map((opt) => {
            const checked = selectedCats.has(opt.value)
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2 font-body text-sm transition-colors max-lg:min-h-[44px] ${
                  checked
                    ? 'border-primary bg-primary-soft text-primary-dark'
                    : 'border-border bg-surface text-ink hover:border-primary/40'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(opt.value)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                {opt.label}
              </label>
            )
          })}
        </div>
      </section>

      {/* Section 3 — Filtres (conditionnés selon source) */}
      <section className="rounded-md border border-border bg-surface-soft p-6">
        <h2 className="mb-4 font-heading text-base font-bold text-ink">Filtres</h2>
        <div className="space-y-3">
          {/* Commun */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={excludeAlreadyInCrm}
              onChange={(e) => setExcludeAlreadyInCrm(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-body text-sm text-ink">
              Exclure les commerces déjà dans mon CRM
              <span className="block font-body text-xs text-muted">
                Évite de re-traiter des prospects existants
                {source === 'sirene' ? ' (clé : SIRET).' : ' (clé : place_id Google).'}
              </span>
            </span>
          </label>

          {/* Google only */}
          {source === 'google' && (
            <>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={excludeClosed}
                  onChange={(e) => setExcludeClosed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="font-body text-sm text-ink">
                  Exclure les commerces fermés
                  <span className="block font-body text-xs text-muted">
                    Statut Google CLOSED_TEMPORARILY ou CLOSED_PERMANENTLY.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={excludeChains}
                  onChange={(e) => setExcludeChains(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="font-body text-sm text-ink">
                  Exclure les chaînes nationales
                  <span className="block font-body text-xs text-muted">
                    Carrefour, Marie Blachère, McDonald&apos;s, Saint Algue, etc.
                    Recommandé pour rester sur des commerces indépendants.
                  </span>
                </span>
              </label>
              <div>
                <label htmlFor="maxResults" className="mb-1 block font-body text-sm font-semibold text-ink">
                  Limite de résultats
                </label>
                <input
                  id="maxResults"
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  value={maxResults}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    setMaxResults(Number.isFinite(v) ? Math.min(Math.max(v, 1), 50) : 20)
                  }}
                  className={`${fieldClass} w-32`}
                />
                <p className="mt-1 font-body text-xs text-muted">Entre 1 et 50.</p>
              </div>
            </>
          )}

          {/* Sirene only */}
          {source === 'sirene' && (
            <div>
              <label htmlFor="recentMonths" className="mb-1 block font-body text-sm font-semibold text-ink">
                Créés depuis moins de
              </label>
              <select
                id="recentMonths"
                value={recentMonths}
                onChange={(e) => setRecentMonths(parseInt(e.target.value, 10))}
                className={`${fieldClass} w-full sm:max-w-xs`}
              >
                <option value={0}>Toutes les dates</option>
                <option value={3}>3 mois</option>
                <option value={6}>6 mois</option>
                <option value={12}>12 mois</option>
                <option value={24}>24 mois</option>
              </select>
              <p className="mt-1 font-body text-xs text-muted">
                Cible les commerces récents, souvent absents de Google.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6 max-lg:flex-col max-lg:items-stretch">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={selectedCats.size === 0 || !baseCoords}
          className="max-lg:min-h-[44px] max-lg:w-full"
        >
          Lancer le sourcing
        </Button>
      </div>
    </form>
  )
}

// ─── Radio source ─────────────────────────────────────────────────

function SourceRadio({
  value,
  current,
  onChange,
  label,
  subtitle,
}: {
  value: Source
  current: Source
  onChange: (v: Source) => void
  label: string
  subtitle: string
}) {
  const checked = current === value
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors max-lg:min-h-[44px] ${
        checked
          ? 'border-primary bg-primary-soft text-primary-dark'
          : 'border-border bg-surface text-ink hover:border-primary/40'
      }`}
    >
      <input
        type="radio"
        name="source"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="mt-1 h-4 w-4 shrink-0 border-border text-primary focus:ring-primary"
      />
      <span className="flex-1">
        <span className="block font-heading text-sm font-bold">{label}</span>
        <span className="mt-0.5 block font-body text-xs text-muted">{subtitle}</span>
      </span>
    </label>
  )
}

// ─── Loader ─────────────────────────────────────────────────────────

const GOOGLE_LOADER_STEPS = [
  'Recherche des commerces dans la zone…',
  'Enrichissement des fiches Google…',
  'Calcul des scores et filtrage…',
]
const SIRENE_LOADER_STEPS = [
  'Résolution des codes postaux…',
  'Interrogation des registres Sirene…',
  'Filtrage et dédoublonnage…',
]

function SourcingLoader({ source, longRun }: { source: Source; longRun: boolean }) {
  const [step, setStep] = useState(0)
  const steps = source === 'google' ? GOOGLE_LOADER_STEPS : SIRENE_LOADER_STEPS

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [steps.length])

  return (
    <div className="rounded-md border border-border bg-surface p-12 text-center shadow-sm">
      <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="font-heading text-lg font-bold text-ink">
        Sourcing {source === 'google' ? 'Google' : 'Sirene'} en cours…
      </p>
      <p className="mt-2 font-body text-sm text-muted">{steps[step]}</p>
      {longRun && (
        <p className="mt-4 font-body text-xs text-accent">
          ⏱️ Recherche élargie : peut prendre jusqu&apos;à 15 secondes.
        </p>
      )}
    </div>
  )
}

// ─── Google : succès import ────────────────────────────────────────

function GoogleImportSuccess({
  result,
  onReset,
}: {
  result: { imported: number; skipped: number; failures: ImportFailure[] }
  onReset: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/30 bg-primary-soft/40 p-6">
        <p className="font-heading text-2xl font-extrabold text-primary-dark">
          ✓ {result.imported} prospect{result.imported > 1 ? 's' : ''} importé{result.imported > 1 ? 's' : ''} dans votre CRM
        </p>
        {(result.skipped > 0 || result.failures.length > 0) && (
          <ul className="mt-3 space-y-1 font-body text-sm text-ink">
            {result.skipped > 0 && (
              <li>
                {result.skipped} ignoré{result.skipped > 1 ? 's' : ''} (déjà présents en BDD ou
                données invalides).
              </li>
            )}
            {result.failures.length > 0 && (
              <li>
                {result.failures.length} échec{result.failures.length > 1 ? 's' : ''} :
                <ul className="mt-1 list-disc pl-6 text-xs text-muted">
                  {result.failures.map((f, i) => (
                    <li key={i}>
                      {f.name} — {f.reason}
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-3 max-lg:flex-col">
        <Link
          href="/admin/crm?source=sourcing"
          className="inline-flex items-center justify-center rounded-sm bg-primary px-5 py-2.5 font-heading text-sm font-bold text-white transition-opacity hover:opacity-90 max-lg:min-h-[44px] max-lg:w-full"
        >
          Voir mes prospects
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onReset}
          className="max-lg:min-h-[44px] max-lg:w-full"
        >
          Nouvelle session de sourcing
        </Button>
      </div>
    </div>
  )
}

// ─── Sirene : table résultats ────────────────────────────────────

function SireneResultsTable({
  data,
  meta,
  searchCats,
  selected,
  importPending,
  importError,
  onToggle,
  onImport,
  onReset,
}: {
  data: SireneSourcingRow[]
  meta: SireneMeta
  searchCats: ProspectCategorie[]
  selected: Set<string>
  importPending: boolean
  importError: string | null
  onToggle: (siret: string) => void
  onImport: () => void
  onReset: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold text-ink">
            {meta.count} résultat{meta.count > 1 ? 's' : ''} Sirene
          </h2>
          <p className="font-body text-sm text-muted">
            {meta.zone} ·{' '}
            {searchCats.length > 0
              ? `${searchCats.length} catégorie${searchCats.length > 1 ? 's' : ''}`
              : 'toutes catégories'}{' '}
            · {meta.codesPostauxCount} code{meta.codesPostauxCount > 1 ? 's' : ''} postal
            {meta.codesPostauxCount > 1 ? 'aux' : ''} couvert
            {meta.codesPostauxCount > 1 ? 's' : ''}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Nouvelle recherche
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="rounded-md border border-border bg-surface-soft px-4 py-8 text-center font-body text-sm text-muted">
          <p>Aucun établissement trouvé pour ces critères.</p>
          <p className="mt-3 text-xs">
            Élargis le rayon, sélectionne plus de catégories ou retire le filtre de date.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {data.map((row) => {
              const checked = selected.has(row.siret)
              return (
                <li
                  key={row.siret}
                  className={`rounded-md border bg-surface p-4 shadow-sm transition ${
                    checked ? 'border-primary/40' : 'border-border'
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(row.siret)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-body text-sm font-semibold text-ink">
                          {row.nom_commerce}
                        </p>
                        <SireneRowBadges row={row} />
                      </div>
                      <p className="mt-1 font-body text-xs text-muted">
                        {row.adresse} · {row.code_postal} {row.ville}
                      </p>
                      <p className="mt-1 flex flex-wrap items-baseline gap-1.5 font-body text-xs text-muted">
                        {(() => {
                          const cat = categorieFromNaf(row.code_naf)
                          if (cat) {
                            return (
                              <span className="rounded-full bg-primary-soft px-2 py-0.5 font-body text-[10px] font-semibold text-primary-dark">
                                {CATEGORIE_LABELS[cat]}
                              </span>
                            )
                          }
                          return (
                            <span
                              className="rounded-full bg-gray-100 px-2 py-0.5 font-body text-[10px] font-semibold text-gray-700"
                              title="NAF hors périmètre Sigweb — sera importé comme « Autre »"
                            >
                              Hors périmètre
                            </span>
                          )
                        })()}
                        <span>
                          NAF {row.code_naf}
                          {row.libelle_naf ? ` · ${row.libelle_naf}` : ''}
                        </span>
                      </p>
                      <p className="mt-1 font-body text-xs text-muted">
                        {row.date_creation ? `Créé le ${row.date_creation}` : 'Date inconnue'}
                      </p>
                      <p className="mt-1 font-body text-[11px] text-muted">SIRET : {row.siret}</p>
                    </div>
                  </label>
                </li>
              )
            })}
          </ul>

          {importError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
              {importError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="font-body text-sm text-muted">
              {selected.size} sélectionné{selected.size > 1 ? 's' : ''} sur {data.length}
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={selected.size === 0 || importPending}
              onClick={onImport}
              className="max-lg:min-h-[44px]"
            >
              {importPending
                ? 'Import en cours…'
                : `Importer ${selected.size} prospect${selected.size > 1 ? 's' : ''}`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function SireneRowBadges({ row }: { row: SireneSourcingRow }) {
  const monthsSinceCreation = row.date_creation
    ? Math.floor(
        (new Date().getTime() - new Date(row.date_creation).getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      )
    : null
  const isNew = monthsSinceCreation !== null && monthsSinceCreation < 12
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {row.alreadyInCrm && (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 font-body text-[10px] font-semibold text-gray-700">
          Déjà en CRM
        </span>
      )}
      {isNew && !row.alreadyInCrm && (
        <span className="rounded-full bg-green-100 px-2 py-0.5 font-body text-[10px] font-semibold text-green-800">
          Nouveau commerce
        </span>
      )}
    </div>
  )
}

// ─── Sirene : succès import ────────────────────────────────────

function SireneImportSuccess({
  result,
  onReset,
}: {
  result: {
    imported: number
    merged: number
    dedupWarnings: number
    skipped: number
    failures: SireneImportFailure[]
  }
  onReset: () => void
}) {
  const total = result.imported + result.merged
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/30 bg-primary-soft/40 p-6">
        <p className="font-heading text-2xl font-extrabold text-primary-dark">
          ✓ {total} fiche{total > 1 ? 's' : ''} mise{total > 1 ? 's' : ''} à jour dans votre CRM
        </p>
        <ul className="mt-3 space-y-1 font-body text-sm text-ink">
          {result.imported > 0 && (
            <li>
              {result.imported} nouvelle{result.imported > 1 ? 's' : ''} fiche
              {result.imported > 1 ? 's' : ''} (source Sirene).
            </li>
          )}
          {result.merged > 0 && (
            <li>
              {result.merged} fiche{result.merged > 1 ? 's' : ''} fusionnée
              {result.merged > 1 ? 's' : ''} (SIRET déjà connu — source passée à
              <em> Google + Sirene</em>).
            </li>
          )}
          {result.dedupWarnings > 0 && (
            <li className="text-orange-700">
              ⚠ {result.dedupWarnings} doublon{result.dedupWarnings > 1 ? 's' : ''} potentiel
              {result.dedupWarnings > 1 ? 's' : ''} (match nom + CP) — à vérifier
              manuellement.
            </li>
          )}
          {result.skipped > 0 && (
            <li>
              {result.skipped} ignoré{result.skipped > 1 ? 's' : ''} (SIRET invalide ou doublon).
            </li>
          )}
          {result.failures.length > 0 && (
            <li>
              {result.failures.length} échec{result.failures.length > 1 ? 's' : ''} :
              <ul className="mt-1 list-disc pl-6 text-xs text-muted">
                {result.failures.map((f, i) => (
                  <li key={i}>
                    {f.name} — {f.reason}
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3 max-lg:flex-col">
        <Link
          href="/admin/crm?source=sirene"
          className="inline-flex items-center justify-center rounded-sm bg-primary px-5 py-2.5 font-heading text-sm font-bold text-white transition-opacity hover:opacity-90 max-lg:min-h-[44px] max-lg:w-full"
        >
          Voir mes prospects
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onReset}
          className="max-lg:min-h-[44px] max-lg:w-full"
        >
          Nouvelle recherche
        </Button>
      </div>
    </div>
  )
}
