'use client'

import { useState } from 'react'
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
  importSireneBatchAction,
  runSireneSourcingAction,
  type SireneImportFailure,
  type SireneSourcingRow,
} from '@/lib/actions/sirene-sourcing'

interface Props {
  baseCoords: { lat: number; lng: number } | null
}

/**
 * Formulaire de sourcing Sirene v2 — UX alignée sur GoogleSourcingForm :
 *   - Zone : centre (domicile, lecture seule) + slider de rayon en km
 *   - Catégories : grille de checkboxes multi-sélection (≥ 1 obligatoire)
 *
 * Côté serveur, la zone (lat/lng + rayon) est résolue en liste de codes
 * postaux via geo.api.gouv.fr, puis on interroge Sirene CP par CP × NAF.
 * Concurrence bornée pour respecter le rate limit data.gouv.fr.
 */

// Sourceable Sirene : on autorise toutes les catégories exposées dans
// l'admin (y compris 'autre' ? non — 'autre' n'a pas de NAF côté Sigweb,
// donc une recherche serait vide. On exclut.).
const SOURCEABLE = CATEGORIE_OPTIONS.filter(
  (o) => o.value !== 'autre' && CATEGORIES_EXPOSED_IN_ADMIN.has(o.value)
)

const fieldClass =
  'rounded-sm border border-border bg-white px-4 py-2.5 font-body text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

interface ResultsMeta {
  zone: string
  count: number
  communesCount: number
  codesPostauxCount: number
}

type ViewState =
  | { phase: 'form' }
  | { phase: 'loading' }
  | {
      phase: 'results'
      data: SireneSourcingRow[]
      meta: ResultsMeta
      selected: Set<string>
      importPending: boolean
      importError: string | null
    }
  | {
      phase: 'imported'
      imported: number
      merged: number
      dedupWarnings: number
      skipped: number
      failures: SireneImportFailure[]
    }
  | { phase: 'error'; message: string }

export default function SireneSourcingForm({ baseCoords }: Props) {
  const [state, setState] = useState<ViewState>({ phase: 'form' })

  const [radiusKm, setRadiusKm] = useState(15)
  const [recentMonths, setRecentMonths] = useState(0)
  const [excludeAlreadyInCrm, setExcludeAlreadyInCrm] = useState(true)
  const [selectedCats, setSelectedCats] = useState<Set<ProspectCategorie>>(new Set())

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
        message:
          'Coordonnées du centre manquantes (SIGWEB_BASE_LATITUDE / LONGITUDE).',
      })
      return
    }

    const cats = [...selectedCats]
    setState({ phase: 'loading' })

    const result = await runSireneSourcingAction({
      centerLat: baseCoords.lat,
      centerLng: baseCoords.lng,
      radiusKm,
      categories: cats,
      recentMonths,
      excludeAlreadyInCrm,
    })

    if (result.success) {
      setState({
        phase: 'results',
        data: result.data,
        meta: {
          zone: `${radiusKm} km autour du domicile`,
          count: result.data.length,
          communesCount: result.meta?.communesCount ?? 0,
          codesPostauxCount: result.meta?.codesPostauxCount ?? 0,
        },
        selected: new Set<string>(),
        importPending: false,
        importError: null,
      })
    } else {
      setState({ phase: 'error', message: result.error })
    }
  }

  function backToForm() {
    setState({ phase: 'form' })
  }

  async function handleImport() {
    if (state.phase !== 'results') return
    const selected = state.data.filter((r) => state.selected.has(r.siret))
    if (selected.length === 0) return

    setState({ ...state, importPending: true, importError: null })

    const fallbackCat: ProspectCategorie | null =
      selectedCats.size === 1 ? [...selectedCats][0] : null

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
      // Catégorie dérivée du NAF de l'établissement = plus précise que
      // les catégories de recherche (multi-sélection). Fallback : si une
      // seule catégorie était cochée, on la propose ; sinon null.
      suggestedCategorie: categorieFromNaf(r.code_naf) ?? fallbackCat,
    }))

    const result = await importSireneBatchAction(items)
    if (!result.success) {
      setState({ ...state, importPending: false, importError: result.error })
      return
    }
    setState({
      phase: 'imported',
      imported: result.imported,
      merged: result.merged,
      dedupWarnings: result.dedupWarnings,
      skipped: result.skipped,
      failures: result.failures,
    })
  }

  function toggleSelection(siret: string) {
    if (state.phase !== 'results') return
    const next = new Set(state.selected)
    if (next.has(siret)) next.delete(siret)
    else next.add(siret)
    setState({ ...state, selected: next })
  }

  if (state.phase === 'loading') {
    return (
      <div className="rounded-md border border-border bg-surface p-12 text-center shadow-sm">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="font-heading text-lg font-bold text-ink">
          Recherche Sirene en cours…
        </p>
        <p className="mt-2 font-body text-sm text-muted">
          Résolution des codes postaux puis interrogation des registres.
        </p>
        <p className="mt-3 font-body text-xs text-accent">
          ⏱️ Plusieurs catégories ou rayon large : peut prendre 10-20 s.
        </p>
      </div>
    )
  }

  if (state.phase === 'results') {
    return (
      <SireneResultsTable
        data={state.data}
        meta={state.meta}
        selected={state.selected}
        importPending={state.importPending}
        importError={state.importError}
        searchCats={[...selectedCats]}
        onToggle={toggleSelection}
        onImport={handleImport}
        onReset={backToForm}
      />
    )
  }

  if (state.phase === 'imported') {
    return <SireneImportSuccess result={state} onReset={backToForm} />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {state.phase === 'error' && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Section 1 — Zone géographique (identique à GoogleSourcingForm) */}
      <section className="rounded-md border border-border bg-surface-soft p-6">
        <h2 className="mb-4 font-heading text-base font-bold text-ink">
          Zone géographique
        </h2>

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
            <label htmlFor="sirene-radius" className="font-body text-sm font-semibold text-ink">
              Rayon de recherche
            </label>
            <span className="font-heading text-lg font-bold text-primary">
              {radiusKm} km
            </span>
          </div>
          <input
            id="sirene-radius"
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

      {/* Section 2 — Catégories (grille checkbox multi-sélection) */}
      <section className="rounded-md border border-border bg-surface-soft p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-base font-bold text-ink">
            Catégories à cibler
          </h2>
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

      {/* Section 3 — Filtres */}
      <section className="rounded-md border border-border bg-surface-soft p-6">
        <h2 className="mb-4 font-heading text-base font-bold text-ink">Filtres</h2>
        <div className="space-y-4">
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

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={excludeAlreadyInCrm}
              onChange={(e) => setExcludeAlreadyInCrm(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="font-body text-sm text-ink">
              Exclure les SIRET déjà dans mon CRM
              <span className="block font-body text-xs text-muted">
                Évite de re-voir des prospects déjà importés (clé : SIRET).
              </span>
            </span>
          </label>
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

// ─── Résultats ─────────────────────────────────────────────────────

interface ResultsTableProps {
  data: SireneSourcingRow[]
  meta: ResultsMeta
  selected: Set<string>
  importPending: boolean
  importError: string | null
  searchCats: ProspectCategorie[]
  onToggle: (siret: string) => void
  onImport: () => void
  onReset: () => void
}

function SireneResultsTable({
  data,
  meta,
  selected,
  importPending,
  importError,
  searchCats,
  onToggle,
  onImport,
  onReset,
}: ResultsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold text-ink">
            {meta.count} résultat{meta.count > 1 ? 's' : ''}
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
            Élargis le rayon, sélectionne plus de catégories ou retire le filtre
            de date.
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
                        {row.date_creation
                          ? `Créé le ${row.date_creation}`
                          : 'Date inconnue'}
                      </p>
                      <p className="mt-1 font-body text-[11px] text-muted">
                        SIRET : {row.siret}
                      </p>
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

// ─── Succès après import batch ────────────────────────────────────

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
          Nouvelle recherche Sirene
        </Button>
      </div>
    </div>
  )
}
