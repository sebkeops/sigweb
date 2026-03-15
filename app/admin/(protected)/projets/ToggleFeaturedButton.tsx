'use client'

import { useState } from 'react'
import { toggleFeaturedHome } from '@/lib/actions/project'
import { Badge } from '@/components/ui/Badge'

interface Props {
  id: string
  featuredHome: boolean
  projectKind: string
}

export default function ToggleFeaturedButton({ id, featuredHome, projectKind }: Props) {
  const [isActive, setIsActive] = useState(featuredHome)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleToggle() {
    setLoading(true)
    setErrorMsg(null)
    const { error } = await toggleFeaturedHome(id, !isActive, projectKind)
    if (error) {
      setErrorMsg(error)
    } else {
      setIsActive((prev) => !prev)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleToggle}
        disabled={loading}
        title={isActive ? "Retirer de l'accueil" : "Afficher sur l'accueil"}
        className="transition-opacity hover:opacity-70 disabled:opacity-40"
      >
        <Badge variant={isActive ? 'green' : 'gray'}>
          {isActive ? 'Accueil ✓' : 'Accueil'}
        </Badge>
      </button>
      {errorMsg && (
        <p className="max-w-[180px] font-body text-xs leading-tight text-red-600">{errorMsg}</p>
      )}
    </div>
  )
}
