import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/types'
import { Badge } from '@/components/ui/Badge'

const kindLabels: Record<string, string> = {
  simulation: 'Simulation',
  realisation: 'Réalisation',
}

const businessTypeLabels: Record<string, string> = {
  boulangerie: 'Boulangerie',
  patisserie: 'Pâtisserie',
  boucherie: 'Boucherie',
  coiffeur: 'Coiffeur',
  artisan: 'Artisan',
  commerce: 'Commerce',
}

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="group overflow-hidden rounded-md border border-border bg-surface shadow-sm transition-shadow hover:shadow-card">
      {/* Image */}
      <div className="relative aspect-video bg-surface-strong">
        {project.cover_image_url ? (
          <Image
            src={project.cover_image_url}
            alt={`Aperçu du site ${project.title}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-heading text-4xl font-bold text-border">Sigweb</span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge variant={project.project_kind === 'simulation' ? 'orange' : 'green'}>
            {kindLabels[project.project_kind] ?? project.project_kind}
          </Badge>
          {project.business_type && (
            <Badge variant="gray">
              {businessTypeLabels[project.business_type] ?? project.business_type}
            </Badge>
          )}
        </div>

        <h3 className="mb-2 font-heading text-lg font-bold text-ink">{project.title}</h3>

        {project.short_description && (
          <p className="mb-4 font-body text-sm leading-relaxed text-muted line-clamp-3">
            {project.short_description}
          </p>
        )}

        {project.external_url && (
          <Link
            href={project.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-dark"
          >
            Voir le site →
          </Link>
        )}
      </div>
    </article>
  )
}
