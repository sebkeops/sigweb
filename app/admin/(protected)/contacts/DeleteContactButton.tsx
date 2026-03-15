'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteContact } from '@/lib/actions/contact'

export default function DeleteContactButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Supprimer ce message définitivement ?')) return
    setLoading(true)
    await deleteContact(id)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-sm border border-red-200 px-3 py-1.5 font-body text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
    >
      {loading ? '…' : 'Supprimer'}
    </button>
  )
}
