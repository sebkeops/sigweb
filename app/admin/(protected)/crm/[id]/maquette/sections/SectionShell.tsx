import type { ReactNode } from 'react'

/**
 * Shell de section placeholder pour les zones d'édition non encore implémentées.
 * Affiche un message clair "Disponible en Session 3.X" pour que l'admin
 * sache à quoi s'attendre, sans donner l'illusion d'une UI cassée.
 */
interface Props {
  /** Référence à la session livrante (ex: "Session 3.3"). */
  comingIn: string
  /** Description courte de ce qui sera éditable ici. */
  description: string
  /** Résumé optionnel des valeurs actuelles (lecture seule, depuis la maquette). */
  preview?: ReactNode
}

export default function SectionShell({ comingIn, description, preview }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-dashed border-border bg-surface-soft p-4">
        <div className="mb-1 font-body text-xs font-semibold uppercase tracking-wider text-muted">
          {comingIn}
        </div>
        <p className="font-body text-sm text-text">{description}</p>
      </div>
      {preview && (
        <div className="space-y-2">
          <div className="font-body text-xs font-semibold uppercase tracking-wider text-muted">
            Valeurs actuelles
          </div>
          {preview}
        </div>
      )}
    </div>
  )
}
