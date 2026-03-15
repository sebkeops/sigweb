import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProjectForm from '@/components/admin/ProjectForm'
import { createClient } from '@/lib/supabase/server'
import { updateProject } from '@/lib/actions/project'
import type { Project } from '@/types'

export const metadata: Metadata = { title: 'Modifier un projet | Admin Sigweb' }

interface Props {
  params: Promise<{ id: string }>
}

async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('*').eq('id', id).single()
  return data ?? null
}

export default async function EditProjetPage({ params }: Props) {
  const { id } = await params
  const project = await getProject(id)

  if (!project) notFound()

  // Liaison de l'id au server action via bind
  const updateWithId = updateProject.bind(null, project.id)

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Link href="/admin/projets" className="font-body text-sm text-muted hover:text-primary">
          ← Projets
        </Link>
        <span className="text-muted">/</span>
        <h1 className="font-heading text-2xl font-extrabold text-ink">Modifier</h1>
        <span className="font-body text-sm text-muted">— {project.title}</span>
      </div>

      <div className="max-w-3xl rounded-lg bg-surface p-8 shadow-sm">
        <ProjectForm project={project} action={updateWithId} />
      </div>
    </div>
  )
}
