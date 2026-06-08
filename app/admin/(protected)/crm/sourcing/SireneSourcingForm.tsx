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

/**
 * Formulaire de sourcing Sirene (chantier Sirene/PageSpeed Lot 1, étape 4).
 *
 * Différences vs sourcing Google :
 *   - Pas de centre/rayon (Sirene cherche par CP ou département)
 *   - Filtre 'créés < N mois' = la valeur ajoutée du canal Sirene
 *     (capter les commerces neufs invisibles sur Google)
 *   - Pas de score à l'étape de recherche (Sirene = données légales sèches)
 *   - Pas de filtre 'exclure chaînes/fermés' : etat_administratif='A' est
 *     déjà posé d'office côté adaptateur (filtre Sirene natif)
 *
 * UI alignée sur GoogleSourcingForm pour cohérence visuelle (mêmes
 * sections, mêmes Tailwind classes, mêmes patterns mobile-first).
 */

const SOURCEABLE = CATEGORIE_OPTIONS.filter(
  (o) => CATEGORIES_EXPOSED_IN_ADMIN.has(o.value)
)

const fieldClass =
  'rounded-sm border border-border bg-white px-4 py-2.5 font-body text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

interface ResultsMeta {
  categorie: ProspectCategorie | 'tous'
  zone: string
  count: number
}

type ViewState =
  | { phase: 'form' }
  | { phase: 'loading' }
  | {
      phase: 'results'
      data: SireneSourcingRow[]
      meta: ResultsMeta
      selected: Set<string>  // SIRETs sélectionnés pour import
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

export default function SireneSourcingForm() {
  const [state, setState] = useState<ViewState>({ phase: 'form' })

  // Form state
  const [zoneType, setZoneType] = useState<'codePostal' | 'departement'>('codePostal')
  const [zone, setZone] = useState('')
  const [categorie, setCategorie] = useState<ProspectCategorie | 'tous'>('tous')
  const [recentMonths, setRecentMonths] = useState(0)  // 0 = pas de filtre
  const [excludeAlreadyInCrm, setExcludeAlreadyInCrm] = useState(true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!zone.trim()) {
      setState({ phase: 'error', message: 'Indique un code postal ou un département.' })
      return
    }

    setState({ phase: 'loading' })

    const result = await runSireneSourcingAction({
      categorie,
      codePostal: zoneType === 'codePostal' ? zone.trim() : undefined,
      departement: zoneType === 'departement' ? zone.trim() : undefined,
      recentMonths,
      excludeAlreadyInCrm,
    })

    if (result.success) {
      setState({
        phase: 'results',
        data: result.data,
        meta: {
          categorie,
          zone: `${zoneType === 'codePostal' ? 'CP' : 'Dépt'} ${zone}`,
          count: result.data.length,
        },
        // Toutes décochées par défaut — l'admin coche explicitement
        // les fiches qu'il veut importer (évite les ajouts massifs accidentels).
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
      // celle de la recherche (qui peut être 'tous' ou ne pas matcher
      // exactement le NAF réel du SIRET). Fallback sur la catégorie de
      // recherche si le NAF est hors périmètre Sigweb.
      suggestedCategorie:
        categorieFromNaf(r.code_naf) ?? (categorie === 'tous' ? null : categorie),
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
        <p className="font-heading text-lg font-bold text-ink">Recherche Sirene en cours…</p>
        <p className="mt-2 font-body text-sm text-muted">
          Interrogation des registres légaux.
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

      {/* Section 1 — Zone */}
      <section className="rounded-md border border-border bg-surface-soft p-6">
        <h2 className="mb-4 font-heading text-base font-bold text-ink">Zone à cibler</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setZoneType('codePostal')}
            className={`rounded-sm border px-4 py-2 font-body text-sm font-medium transition ${
              zoneType === 'codePostal'
                ? 'border-primary bg-primary-soft text-primary-dark'
                : 'border-border bg-surface text-muted hover:text-ink'
            }`}
          >
            Code postal
          </button>
          <button
            type="button"
            onClick={() => setZoneType('departement')}
            className={`rounded-sm border px-4 py-2 font-body text-sm font-medium transition ${
              zoneType === 'departement'
                ? 'border-primary bg-primary-soft text-primary-dark'
                : 'border-border bg-surface text-muted hover:text-ink'
            }`}
          >
            Département
          </button>
        </div>

        <input
          type="text"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          placeholder={zoneType === 'codePostal' ? 'Ex : 31000' : 'Ex : 31 ou 32'}
          inputMode="numeric"
          className={`${fieldClass} w-full sm:max-w-xs`}
        />
        <p className="mt-2 font-body text-xs text-muted">
          {zoneType === 'codePostal'
            ? 'Recherche restreinte aux établissements de ce code postal.'
            : 'Recherche sur tout le département (peut renvoyer beaucoup de résultats).'}
        </p>
      </section>

      {/* Section 2 — Catégorie */}
      <section className="rounded-md border border-border bg-surface-soft p-6">
        <h2 className="mb-4 font-heading text-base font-bold text-ink">Type d&apos;activité</h2>
        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value as ProspectCategorie | 'tous')}
          className={`${fieldClass} w-full sm:max-w-md`}
        >
          <option value="tous">Toutes activités</option>
          {SOURCEABLE.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-2 font-body text-xs text-muted">
          Les libellés correspondent à des codes NAF Sigweb (boulangerie =
          1071C, 1071D, 4724Z, etc.). « Toutes activités » ne filtre pas par
          NAF (utile pour explorer un quartier ou un département).
        </p>
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
          disabled={!zone.trim()}
          className="max-lg:min-h-[44px] max-lg:w-full"
        >
          Rechercher
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
            {meta.zone} · {meta.categorie === 'tous' ? 'toutes activités' : meta.categorie}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          Nouvelle recherche
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="rounded-md border border-border bg-surface-soft px-4 py-8 text-center font-body text-sm text-muted">
          <p>Aucun établissement trouvé pour ces critères.</p>
          {meta.categorie === 'tous' && (
            <p className="mt-3 text-xs">
              💡 Avec <strong>« Toutes activités »</strong>, l&apos;API Sirene
              renvoie en priorité les grandes entreprises (Carrefour, La Poste,
              EDF…) qui sont automatiquement exclues. Pour trouver des
              <em> commerces de proximité neufs</em>, <strong>cibles une activité
              précise</strong> (boulangerie, coiffeur, plomberie…) et lance la
              recherche par code postal plutôt que département.
            </p>
          )}
          {meta.categorie !== 'tous' && (
            <p className="mt-3 text-xs">
              Élargis la zone (passer en département) ou retire le filtre de
              date.
            </p>
          )}
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
                      {/* Catégorie Sigweb dérivée du NAF — utile pour distinguer
                          rapidement un commerce-cible (boulangerie, coiffeur)
                          d'un NAF hors périmètre (ex: production électrique). */}
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
