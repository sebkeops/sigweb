'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProspect } from '@/lib/actions/prospect'

interface Props {
  id: string
  nom: string
}

export default function DeleteProspectButton({ id, nom }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Supprimer le prospect "${nom}" ? Cette action est irréversible.`)) return
    setLoading(true)
    const { error } = await deleteProspect(id)
    if (error) {
      alert(error)
      setLoading(false)
      return
    }
    router.push('/admin/crm')
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="font-body text-sm font-medium text-red-600 hover:underline disabled:opacity-40"
    >
      {loading ? '…' : 'Supprimer'}
    </button>
  )
}
