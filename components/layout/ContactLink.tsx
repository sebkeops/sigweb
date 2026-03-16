'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface Props {
  href: string
  className: string
  children: React.ReactNode
}

// Si l'utilisateur est déjà sur la page cible, force un rechargement complet
// pour réinitialiser l'état React (formulaire contact, wizard simulateur…).
// Ailleurs, navigation rapide via <Link>.
export default function ContactLink({ href, className, children }: Props) {
  const pathname = usePathname()

  if (pathname === href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
