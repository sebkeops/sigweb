'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  CATEGORIE_OPTIONS,
  CATEGORIES_EXPOSED_IN_ADMIN,
} from '@/lib/crm/constants'
import type { ProspectCategorie } from '@/types'
import {
  runSireneSourcingAction,
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

type ViewState =
  | { phase: 'form' }
  | { phase: 'loading' }
  | {
      phase: 'results'
      data: SireneSourcingRow[]
      meta: { categorie: ProspectCategorie | 'tous'; zone: string; count: number }
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
      })
    } else {
      setState({ phase: 'error', message: result.error })
    }
  }

  function backToForm() {
    setState({ phase: 'form' })
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
        onReset={backToForm}
      />
    )
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

function SireneResultsTable({
  data,
  meta,
  onReset,
}: {
  data: SireneSourcingRow[]
  meta: { categorie: ProspectCategorie | 'tous'; zone: string; count: number }
  onReset: () => void
}) {
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
        <p className="rounded-md border border-border bg-surface-soft px-4 py-8 text-center font-body text-sm text-muted">
          Aucun établissement trouvé pour ces critères. Élargis la zone, change
          d&apos;activité ou retire le filtre de date.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.map((row) => (
            <li
              key={row.siret}
              className="rounded-md border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-body text-sm font-semibold text-ink">
                  {row.nom_commerce}
                </p>
                <SireneRowBadges row={row} />
              </div>
              <p className="mt-1 font-body text-xs text-muted">
                {row.adresse} · {row.code_postal} {row.ville}
              </p>
              <p className="mt-1 font-body text-xs text-muted">
                NAF {row.code_naf}
                {row.libelle_naf ? ` · ${row.libelle_naf}` : ''}
                {row.date_creation ? ` · créé le ${row.date_creation}` : ''}
              </p>
              <p className="mt-1 font-body text-[11px] text-muted">SIRET : {row.siret}</p>
            </li>
          ))}
        </ul>
      )}

      <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 font-body text-xs text-blue-800">
        ℹ️ L&apos;import vers le CRM sera disponible à la prochaine étape.
        Pour l&apos;instant, cette page sert à valider la pertinence des
        résultats Sirene.
      </p>
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
