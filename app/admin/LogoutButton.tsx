'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-sm border border-border px-4 py-2 font-body text-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary"
    >
      Déconnexion
    </button>
  )
}
