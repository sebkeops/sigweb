import type { Metadata } from 'next'
import Link from 'next/link'
import ProjectForm from '@/components/admin/ProjectForm'
import { createProject } from '@/lib/actions/project'

export const metadata: Metadata = { title: 'Nouveau projet | Admin Sigweb' }

export default function NouveauProjetPage() {
  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/admin/projets"
          className="font-body text-sm text-muted hover:text-primary"
        >
          ← Projets
        </Link>
        <span className="text-muted">/</span>
        <h1 className="font-heading text-2xl font-extrabold text-ink">Nouveau projet</h1>
      </div>

      <div className="max-w-3xl rounded-lg bg-surface p-8 shadow-sm">
        <ProjectForm action={createProject} />
      </div>
    </div>
  )
}
