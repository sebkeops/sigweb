import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { LinkButton } from '@/components/ui/Button'
import TogglePublishedButton from './TogglePublishedButton'
import DeleteProjectButton from './DeleteProjectButton'

export const metadata: Metadata = { title: 'Projets | Admin Sigweb' }

const kindLabels: Record<string, string> = {
  simulation: 'Simulation',
  realisation: 'Réalisation',
}

async function getProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminProjetsPage() {
  const projects = await getProjects()

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold text-ink">Projets</h1>
        <LinkButton href="/admin/projets/nouveau" variant="primary" size="md">
          + Nouveau projet
        </LinkButton>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-md border border-border bg-surface py-16 text-center">
          <p className="font-body text-base text-muted">Aucun projet. Commencez par en créer un.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-surface shadow-sm">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-surface-soft">
              <tr>
                <th className="px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted">
                  Titre
                </th>
                <th className="hidden px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted sm:table-cell">
                  Type
                </th>
                <th className="hidden px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted md:table-cell">
                  Commerce
                </th>
                <th className="px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted">
                  Statut
                </th>
                <th className="px-5 py-4 font-body text-xs font-semibold uppercase tracking-wider text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-surface-soft">
                  <td className="px-5 py-4">
                    <p className="font-body text-sm font-semibold text-ink">{project.title}</p>
                    <p className="font-body text-xs text-muted">{project.slug}</p>
                  </td>
                  <td className="hidden px-5 py-4 sm:table-cell">
                    <Badge variant={project.project_kind === 'simulation' ? 'orange' : 'green'}>
                      {kindLabels[project.project_kind] ?? project.project_kind}
                    </Badge>
                  </td>
                  <td className="hidden px-5 py-4 md:table-cell">
                    <span className="font-body text-sm text-muted">
                      {project.business_type ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <TogglePublishedButton id={project.id} published={project.published} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/projets/${project.id}`}
                        className="font-body text-sm font-medium text-primary hover:underline"
                      >
                        Modifier
                      </Link>
                      <DeleteProjectButton id={project.id} title={project.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
