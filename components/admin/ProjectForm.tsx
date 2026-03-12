'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Project } from '@/types'
import { Button } from '@/components/ui/Button'
import type { ProjectActionState } from '@/lib/actions/project'

interface ProjectFormProps {
  project?: Project
  action: (prev: ProjectActionState, formData: FormData) => Promise<ProjectActionState>
}

const initialState: ProjectActionState = { success: false }

const businessTypes = [
  { value: '', label: 'Sélectionner…' },
  { value: 'boulangerie', label: 'Boulangerie' },
  { value: 'patisserie', label: 'Pâtisserie' },
  { value: 'boucherie', label: 'Boucherie' },
  { value: 'coiffeur', label: 'Salon de coiffure' },
  { value: 'artisan', label: 'Artisan' },
  { value: 'commerce', label: 'Commerce de proximité' },
  { value: 'autre', label: 'Autre' },
]

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function ProjectForm({ project, action }: ProjectFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const router = useRouter()

  const [slug, setSlug] = useState(project?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!project)
  const [published, setPublished] = useState(project?.published ?? false)

  useEffect(() => {
    if (state.success) {
      router.push('/admin/projets')
    }
  }, [state.success, router])

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugManual) {
      setSlug(slugify(e.target.value))
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value)
    setSlugManual(true)
  }

  const fieldClass =
    'w-full rounded-sm border border-border bg-white px-4 py-3 font-body text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
  const labelClass = 'mb-1.5 block font-body text-sm font-semibold text-ink'
  const errorClass = 'mt-1 font-body text-xs text-red-600'

  return (
    <form action={formAction} noValidate className="space-y-6">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Titre */}
        <div>
          <label htmlFor="title" className={labelClass}>
            Titre <span className="text-cta">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            defaultValue={project?.title ?? ''}
            onChange={handleTitleChange}
            className={fieldClass}
            placeholder="Boulangerie Artisane"
          />
          {state.fieldErrors?.title && (
            <p className={errorClass}>{state.fieldErrors.title[0]}</p>
          )}
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className={labelClass}>
            Slug <span className="text-cta">*</span>
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            maxLength={200}
            value={slug}
            onChange={handleSlugChange}
            className={fieldClass}
            placeholder="boulangerie-artisane"
          />
          {state.fieldErrors?.slug && (
            <p className={errorClass}>{state.fieldErrors.slug[0]}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Type de commerce */}
        <div>
          <label htmlFor="business_type" className={labelClass}>
            Type de commerce
          </label>
          <select
            id="business_type"
            name="business_type"
            defaultValue={project?.business_type ?? ''}
            className={fieldClass}
          >
            {businessTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type de projet */}
        <div>
          <label htmlFor="project_kind" className={labelClass}>
            Type de projet <span className="text-cta">*</span>
          </label>
          <select
            id="project_kind"
            name="project_kind"
            required
            defaultValue={project?.project_kind ?? 'simulation'}
            className={fieldClass}
          >
            <option value="simulation">Simulation</option>
            <option value="realisation">Réalisation</option>
          </select>
        </div>
      </div>

      {/* Description courte */}
      <div>
        <label htmlFor="short_description" className={labelClass}>
          Description courte
        </label>
        <textarea
          id="short_description"
          name="short_description"
          rows={3}
          maxLength={500}
          defaultValue={project?.short_description ?? ''}
          className={`${fieldClass} resize-none`}
          placeholder="Résumé visible sur la liste des projets…"
        />
      </div>

      {/* Contenu */}
      <div>
        <label htmlFor="content" className={labelClass}>
          Contenu
        </label>
        <textarea
          id="content"
          name="content"
          rows={6}
          maxLength={10000}
          defaultValue={project?.content ?? ''}
          className={`${fieldClass} resize-y`}
          placeholder="Description détaillée du projet…"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* URL image */}
        <div>
          <label htmlFor="cover_image_url" className={labelClass}>
            URL de l&apos;image de couverture
          </label>
          <input
            id="cover_image_url"
            name="cover_image_url"
            type="url"
            maxLength={500}
            defaultValue={project?.cover_image_url ?? ''}
            className={fieldClass}
            placeholder="https://…"
          />
          {state.fieldErrors?.cover_image_url && (
            <p className={errorClass}>{state.fieldErrors.cover_image_url[0]}</p>
          )}
        </div>

        {/* URL externe */}
        <div>
          <label htmlFor="external_url" className={labelClass}>
            URL du site (lien externe)
          </label>
          <input
            id="external_url"
            name="external_url"
            type="url"
            maxLength={500}
            defaultValue={project?.external_url ?? ''}
            className={fieldClass}
            placeholder="https://…"
          />
          {state.fieldErrors?.external_url && (
            <p className={errorClass}>{state.fieldErrors.external_url[0]}</p>
          )}
        </div>
      </div>

      {/* Publié */}
      <div className="flex items-center gap-3">
        {/* Hidden input : transmet toujours la valeur, quelle que soit l'état de la checkbox */}
        <input name="published" type="hidden" value={published ? 'true' : 'false'} />
        <input
          id="published"
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <label htmlFor="published" className="font-body text-sm font-semibold text-ink">
          Publié (visible sur le site)
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-border pt-6">
        <Button type="submit" variant="primary" size="md" loading={pending}>
          {project ? 'Enregistrer les modifications' : 'Créer le projet'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => router.push('/admin/projets')}
        >
          Annuler
        </Button>
      </div>
    </form>
  )
}
