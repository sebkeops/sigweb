'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { refreshProspectFromGoogleAction } from '@/lib/actions/google-import'
import { Button } from '@/components/ui/Button'

interface Props {
  prospectId: string
  hasPlaceId: boolean
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RefreshFromGoogleButton({ prospectId, hasPlaceId }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [flash, setFlash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 4000)
    return () => clearTimeout(t)
  }, [flash])

  function handleClick() {
    setError(null)
    setFlash(null)
    startTransition(async () => {
      const r = await refreshProspectFromGoogleAction(prospectId)
      if (!r.success) {
        setError(r.error)
        return
      }
      if ('redirectTo' in r.data) {
        router.push(r.data.redirectTo)
        return
      }
      setFlash(`Fiche enrichie le ${formatDateTime(r.data.lastEnrichedAt)}`)
      router.refresh()
    })
  }

  const label = hasPlaceId ? 'Enrichir depuis Google' : 'Lier à Google'

  return (
    <div className="flex flex-col items-end gap-2 max-lg:items-stretch">
      <Button type="button" variant="secondary" size="sm" onClick={handleClick} loading={pending} className="max-lg:min-h-[44px] max-lg:w-full">
        {label}
      </Button>
      {flash && (
        <span className="font-body text-xs text-primary-dark">✓ {flash}</span>
      )}
      {error && (
        <span className="font-body text-xs text-red-600">{error}</span>
      )}
    </div>
  )
}
