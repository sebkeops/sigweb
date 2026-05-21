'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Prospect } from '@/types'
import { Button } from '@/components/ui/Button'
import type { ProspectActionState } from '@/lib/actions/prospect'
import { CANAL_OPTIONS, getExposedCategoriesByFamily, STATUT_OPTIONS } from '@/lib/crm/constants'

interface ProspectFormProps {
  prospect?: Prospect
  /**
   * Valeurs initiales en mode création (pré-remplissage depuis enrichissement
   * Google). Ignoré si `prospect` est fourni (mode édition).
   */
  initialData?: Partial<Prospect>
  /**
   * Token signé HMAC contenant les données Google enrichies. Posé en input
   * hidden et lu par createProspect au submit. Remplace l'ancien mécanisme
   * cookie pour éviter qu'un autre onglet n'écrase la donnée entre le render
   * et la soumission.
   */
  enrichedToken?: string | null
  action: (prev: ProspectActionState, formData: FormData) => Promise<ProspectActionState>
}

const initialState: ProspectActionState = { success: false }

const fieldClass =
  'w-full rounded-sm border border-border bg-white px-4 py-3 font-body text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
const labelClass = 'mb-1.5 block font-body text-sm font-semibold text-ink'
const errorClass = 'mt-1 font-body text-xs text-red-600'
const blockTitleClass = 'mb-4 font-heading text-base font-bold text-ink'
const blockClass = 'rounded-md border border-border bg-surface-soft p-6'

export default function ProspectForm({ prospect, initialData, enrichedToken, action }: ProspectFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const router = useRouter()
  // Source unique pour les valeurs initiales : prospect (édition) sinon initialData (pré-remplissage).
  const seed: Partial<Prospect> = prospect ?? initialData ?? {}

  // Enrichissement Google dont le type n'a pas pu être mappé sur une catégorie
  // CRM : `suggestedCategorie` vaut alors 'autre'. Dans ce cas on NE pré-sélectionne
  // PAS "Autre" — le select reste sur "Choisir…" pour forcer un choix explicite de
  // l'admin. Sinon un fleuriste / garagiste est enregistré silencieusement 'autre'
  // (le libellé Google masque le problème dans la liste et la fiche).
  const enrichmentFellBackToAutre =
    !prospect && seed.categorie === 'autre' && !!seed.google_primary_type_display

  useEffect(() => {
    if (state.success) {
      router.push(prospect ? `/admin/crm/${prospect.id}` : '/admin/crm')
    }
  }, [state.success, prospect, router])

  function err(field: string) {
    const msg = state.fieldErrors?.[field]?.[0]
    return msg ? <p className={errorClass}>{msg}</p> : null
  }

  return (
    <form action={formAction} noValidate className="space-y-6">
      {enrichedToken && <input type="hidden" name="_enriched_token" value={enrichedToken} />}
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Bloc Identité */}
      <div className={blockClass}>
        <h2 className={blockTitleClass}>Identité</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="nom_commerce" className={labelClass}>
              Nom du commerce <span className="text-cta">*</span>
            </label>
            <input
              id="nom_commerce"
              name="nom_commerce"
              type="text"
              required
              maxLength={200}
              defaultValue={seed.nom_commerce ?? ''}
              className={fieldClass}
              placeholder="Boulangerie Dupont"
            />
            {err('nom_commerce')}
          </div>
          <div>
            <label htmlFor="categorie" className={labelClass}>
              Catégorie <span className="text-cta">*</span>
            </label>
            <select
              id="categorie"
              name="categorie"
              required
              defaultValue={enrichmentFellBackToAutre ? '' : (seed.categorie ?? '')}
              className={fieldClass}
            >
              <option value="" disabled>
                Choisir…
              </option>
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
            {err('categorie')}
            {seed.categorie === 'autre' && seed.google_primary_type_display && (
              <p className="mt-1 font-body text-xs text-muted">
                Type Google : <strong>{seed.google_primary_type_display}</strong> — choisissez
                la catégorie Sigweb correspondante si elle existe, sinon laissez «&nbsp;Autre&nbsp;».
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bloc Localisation */}
      <div className={blockClass}>
        <h2 className={blockTitleClass}>Localisation</h2>
        <div className="space-y-6">
          <div>
            <label htmlFor="adresse" className={labelClass}>Adresse</label>
            <input
              id="adresse"
              name="adresse"
              type="text"
              maxLength={300}
              defaultValue={seed.adresse ?? ''}
              className={fieldClass}
              placeholder="12 rue de la Mairie"
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="ville" className={labelClass}>Ville</label>
              <input
                id="ville"
                name="ville"
                type="text"
                maxLength={120}
                defaultValue={seed.ville ?? ''}
                className={fieldClass}
                placeholder="L'Isle-Jourdain"
              />
            </div>
            <div>
              <label htmlFor="code_postal" className={labelClass}>Code postal</label>
              <input
                id="code_postal"
                name="code_postal"
                type="text"
                maxLength={20}
                defaultValue={seed.code_postal ?? ''}
                className={fieldClass}
                placeholder="32600"
              />
            </div>
            <div>
              <label htmlFor="distance_km" className={labelClass}>Distance (km)</label>
              <input
                id="distance_km"
                name="distance_km"
                type="number"
                step="0.1"
                min="0"
                defaultValue={seed.distance_km ?? ''}
                className={fieldClass}
                placeholder="12.5"
              />
              <p className="mt-1 font-body text-xs text-muted">
                Distance approximative depuis L&apos;Isle-Jourdain
              </p>
              {err('distance_km')}
            </div>
          </div>
        </div>
      </div>

      {/* Bloc Contact */}
      <div className={blockClass}>
        <h2 className={blockTitleClass}>Contact</h2>
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="telephone" className={labelClass}>Téléphone</label>
              <input
                id="telephone"
                name="telephone"
                type="tel"
                maxLength={40}
                defaultValue={seed.telephone ?? ''}
                className={fieldClass}
                placeholder="05 62 00 00 00"
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={seed.email ?? ''}
                className={fieldClass}
                placeholder="contact@commerce.fr"
              />
              {err('email')}
            </div>
          </div>
          <div>
            <label htmlFor="site_existant_url" className={labelClass}>Site existant (URL)</label>
            <input
              id="site_existant_url"
              name="site_existant_url"
              type="url"
              defaultValue={seed.site_existant_url ?? ''}
              className={fieldClass}
              placeholder="https://…"
            />
            {err('site_existant_url')}
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="instagram_url" className={labelClass}>Instagram (URL)</label>
              <input
                id="instagram_url"
                name="instagram_url"
                type="url"
                defaultValue={seed.instagram_url ?? ''}
                className={fieldClass}
                placeholder="https://instagram.com/…"
              />
              {err('instagram_url')}
            </div>
            <div>
              <label htmlFor="facebook_url" className={labelClass}>Facebook (URL)</label>
              <input
                id="facebook_url"
                name="facebook_url"
                type="url"
                defaultValue={seed.facebook_url ?? ''}
                className={fieldClass}
                placeholder="https://facebook.com/…"
              />
              {err('facebook_url')}
            </div>
          </div>
        </div>
      </div>

      {/* Bloc Qualification — le score est désormais calculé automatiquement
          (cf. lib/scoring/) et géré depuis la fiche détail. Le formulaire
          ne contient plus que les champs subjectifs : canal et statut. */}
      <div className={blockClass}>
        <h2 className={blockTitleClass}>Qualification</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="canal" className={labelClass}>Canal</label>
            <select
              id="canal"
              name="canal"
              defaultValue={seed.canal ?? 'a_definir'}
              className={fieldClass}
            >
              {CANAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {err('canal')}
          </div>
          <div>
            <label htmlFor="statut" className={labelClass}>Statut</label>
            <select
              id="statut"
              name="statut"
              defaultValue={seed.statut ?? 'a_qualifier'}
              className={fieldClass}
            >
              {STATUT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {err('statut')}
          </div>
        </div>
        <p className="mt-3 font-body text-xs text-muted">
          Le score est calculé automatiquement à partir des données factuelles
          (distance, site web, activité Google). Vous pourrez l&apos;ajuster manuellement
          depuis la fiche du prospect après création.
        </p>
      </div>

      {/* Bloc Suivi */}
      <div className={blockClass}>
        <h2 className={blockTitleClass}>Suivi</h2>
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="date_dernier_contact" className={labelClass}>Date du dernier contact</label>
              <input
                id="date_dernier_contact"
                name="date_dernier_contact"
                type="date"
                defaultValue={seed.date_dernier_contact ?? ''}
                className={fieldClass}
              />
              {err('date_dernier_contact')}
            </div>
            <div>
              <label htmlFor="date_relance_prevue" className={labelClass}>Date de relance prévue</label>
              <input
                id="date_relance_prevue"
                name="date_relance_prevue"
                type="date"
                defaultValue={seed.date_relance_prevue ?? ''}
                className={fieldClass}
              />
              {err('date_relance_prevue')}
            </div>
          </div>
          <div>
            <label htmlFor="notes" className={labelClass}>Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={6}
              maxLength={5000}
              defaultValue={seed.notes ?? ''}
              className={`${fieldClass} resize-y`}
              placeholder="Contexte, points abordés, prochaine action…"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-border pt-6">
        <Button type="submit" variant="primary" size="md" loading={pending}>
          {prospect ? 'Mettre à jour' : 'Enregistrer'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => router.push(prospect ? `/admin/crm/${prospect.id}` : '/admin/crm')}
        >
          Annuler
        </Button>
      </div>
    </form>
  )
}
