'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  generateFictiveSimulationAction,
  type GenerateSimulationActionState,
} from '@/lib/actions/simulation'
import { getExposedCategoriesByFamily } from '@/lib/crm/constants'

/**
 * Bloc admin "Génération automatique d'une simulation publique".
 *
 * Workflow utilisateur :
 *   1. Sélectionne une des 34 catégories (regroupées par famille)
 *   2. Clique sur "Générer"
 *   3. UI désactive le bouton + affiche un état "Génération en cours…"
 *      (la Server Action prend ~15-25s : 7 appels Unsplash + uploads
 *      Supabase Storage + INSERT BDD)
 *   4. Succès : redirige vers l'éditeur du projet créé pour relire et
 *      publier d'un clic
 *   5. Échec : affiche le message d'erreur (rate limit, Unsplash KO, etc.)
 *
 * Composant client (useActionState + router.push après succès). Le
 * formulaire en dessous (`ProjectForm`, création manuelle) reste
 * disponible — les deux flows coexistent.
 */

export default function SimulationGenerator() {
  const router = useRouter()
  const [state, action, pending] = useActionState<
    GenerateSimulationActionState | null,
    FormData
  >(async (prev, formData) => {
    const result = await generateFictiveSimulationAction(prev, formData)
    if (result.success) {
      // Redirection vers l'éditeur du projet créé (mêmes route que pour
      // une création manuelle, l'admin pourra relire/publier)
      router.push(`/admin/projets/${result.id}`)
    }
    return result
  }, null)

  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const families = getExposedCategoriesByFamily()

  return (
    <section className="mb-8 rounded-lg border border-primary/20 bg-primary-soft/30 p-6">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-bold text-ink">
          ⚡ Générer une simulation publique
        </h2>
        <p className="mt-1 font-body text-sm text-muted">
          Crée automatiquement une simulation fictive complète (commerce
          inventé, photos Unsplash, avis et horaires) pour la catégorie
          choisie. La simulation est créée en brouillon — vous pourrez
          la relire avant publication.
        </p>
      </div>

      <form action={action} className="space-y-3">
        <div>
          <label
            htmlFor="categoryId"
            className="mb-1 block font-body text-sm font-medium text-ink"
          >
            Catégorie
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            disabled={pending}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-sm border border-border bg-white px-3 py-2 font-body text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" disabled>
              — Choisir une catégorie —
            </option>
            {families.map((fam) => (
              <optgroup key={fam.family} label={fam.label}>
                {fam.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {state && state.success === false && (
          <div
            role="alert"
            className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 font-body text-sm text-red-700"
          >
            {state.error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending || !selectedCategory}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 font-body text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <>
                <Spinner />
                Génération en cours… (~20s)
              </>
            ) : (
              <>⚡ Générer la simulation</>
            )}
          </button>
          {pending && (
            <span className="font-body text-xs text-muted">
              Téléchargement de 7 photos Unsplash en cours…
            </span>
          )}
        </div>
      </form>
    </section>
  )
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
