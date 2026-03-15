'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Project } from '@/types'
import { Button } from '@/components/ui/Button'
import type { ProjectActionState } from '@/lib/actions/project'
import { uploadProjectImage } from '@/lib/actions/upload'

interface ProjectFormProps {
  project?: Project
  action: (prev: ProjectActionState, formData: FormData) => Promise<ProjectActionState>
}

const initialState: ProjectActionState = { success: false }


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
  const [projectKind, setProjectKind] = useState(project?.project_kind ?? 'simulation')
  const [published, setPublished] = useState(project?.published ?? false)
  const [featuredHome, setFeaturedHome] = useState(project?.featured_home ?? false)

  const [coverImageUrl, setCoverImageUrl] = useState(project?.cover_image_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

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

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)

    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadProjectImage(fd)

    if (result.error) {
      setUploadError(result.error)
    } else if (result.url) {
      setCoverImageUrl(result.url)
    }
    setUploading(false)
    e.target.value = ''
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
          <input
            id="business_type"
            name="business_type"
            type="text"
            maxLength={100}
            defaultValue={project?.business_type ?? ''}
            className={fieldClass}
            placeholder="Boulangerie, Coiffeur, Artisan…"
          />
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
            value={projectKind}
            onChange={(e) => setProjectKind(e.target.value as 'simulation' | 'realisation')}
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


      <div className="grid gap-6 sm:grid-cols-2">
        {/* Image de couverture — upload fichier */}
        <div>
          <label className={labelClass}>Image de couverture</label>

          {/* L'URL est transmise au server action via ce champ caché */}
          <input type="hidden" name="cover_image_url" value={coverImageUrl} />

          {coverImageUrl ? (
            <div className="relative overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageUrl}
                alt="Aperçu image de couverture"
                className="h-40 w-full object-cover"
              />
              <label className="absolute right-2 top-2 cursor-pointer rounded-sm bg-ink/70 px-2 py-1 font-body text-xs text-white transition-colors hover:bg-ink">
                {uploading ? 'Upload…' : 'Changer'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                onClick={() => setCoverImageUrl('')}
                className="absolute left-2 top-2 rounded-sm bg-red-600/80 px-2 py-1 font-body text-xs text-white transition-colors hover:bg-red-600"
              >
                Supprimer
              </button>
            </div>
          ) : (
            <label
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed px-4 py-8 text-center transition-colors ${
                uploading
                  ? 'cursor-default border-border bg-surface-soft opacity-60'
                  : 'border-border bg-surface-soft hover:border-primary hover:bg-surface'
              }`}
            >
              <span className="text-2xl">{uploading ? '⏳' : '📷'}</span>
              <span className="font-body text-sm font-semibold text-ink">
                {uploading ? 'Upload en cours…' : 'Cliquez pour choisir une image'}
              </span>
              <span className="font-body text-xs text-muted">
                JPG, PNG, WebP — max 5 Mo — converti automatiquement en WebP
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
                className="sr-only"
              />
            </label>
          )}

          {uploadError && <p className={errorClass}>{uploadError}</p>}
        </div>

        {/* URL externe — uniquement pour les réalisations */}
        {projectKind === 'realisation' ? (
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
        ) : (
          <div className="flex items-center rounded-md border border-dashed border-border bg-surface-soft px-4 py-6">
            <p className="font-body text-sm text-muted">
              Les simulations ont un lien automatique vers{' '}
              <code className="rounded bg-surface px-1 py-0.5 font-mono text-xs text-ink">
                /simulations/{slug || '…'}
              </code>
            </p>
          </div>
        )}
      </div>

      {/* Publié + Mis en avant */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
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

        <div className="flex items-start gap-3">
          <input name="featured_home" type="hidden" value={featuredHome ? 'true' : 'false'} />
          <input
            id="featured_home"
            type="checkbox"
            checked={featuredHome}
            onChange={(e) => setFeaturedHome(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <div>
            <label htmlFor="featured_home" className="font-body text-sm font-semibold text-ink">
              ⭐ Mettre en avant sur la page d&apos;accueil
            </label>
            <p className="font-body text-xs text-muted">
              Apparaîtra dans la section Réalisations ou Simulations de la home page.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-border pt-6">
        <Button type="submit" variant="primary" size="md" loading={pending || uploading}>
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
