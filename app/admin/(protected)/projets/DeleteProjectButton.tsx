'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProject } from '@/lib/actions/project'

interface Props {
  id: string
  title: string
}

export default function DeleteProjectButton({ id, title }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Supprimer le projet "${title}" ? Cette action est irréversible.`)) return
    setLoading(true)
    const { error } = await deleteProject(id)
    if (error) {
      alert(error)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="font-body text-sm font-medium text-red-500 hover:underline disabled:opacity-40"
    >
      {loading ? '…' : 'Supprimer'}
    </button>
  )
}
