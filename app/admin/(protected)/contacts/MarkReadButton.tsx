'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { markContactRead } from '@/lib/actions/contact'

export default function MarkReadButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleMarkRead() {
    setLoading(true)
    await markContactRead(id)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleMarkRead}
      disabled={loading}
      className="rounded-sm border border-primary px-3 py-1.5 font-body text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-40"
    >
      {loading ? '…' : 'Marquer lu'}
    </button>
  )
}
