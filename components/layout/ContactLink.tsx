'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface Props {
  className: string
  children: React.ReactNode
}

// Quand on est déjà sur /contact, force un rechargement complet
// pour réinitialiser l'état du formulaire (success screen → formulaire vide).
// Ailleurs, navigation rapide via <Link>.
export default function ContactLink({ className, children }: Props) {
  const pathname = usePathname()

  if (pathname === '/contact') {
    return (
      <a href="/contact" className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link href="/contact" className={className}>
      {children}
    </Link>
  )
}
