'use client'

import { useState } from 'react'
import { toggleProjectPublished } from '@/lib/actions/project'
import { Badge } from '@/components/ui/Badge'

interface Props {
  id: string
  published: boolean
}

export default function TogglePublishedButton({ id, published }: Props) {
  const [isPublished, setIsPublished] = useState(published)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    const { error } = await toggleProjectPublished(id, !isPublished)
    if (!error) {
      setIsPublished((prev) => !prev)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={isPublished ? 'Dépublier' : 'Publier'}
      className="transition-opacity hover:opacity-70 disabled:opacity-40"
    >
      <Badge variant={isPublished ? 'green' : 'gray'}>
        {isPublished ? 'Publié' : 'Brouillon'}
      </Badge>
    </button>
  )
}
