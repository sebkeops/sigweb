'use client'

import { useEffect } from 'react'

/**
 * Verrouille le scroll de la page entière tant que l'éditeur est monté.
 *
 * Pourquoi : le layout admin parent `<main>` n'a pas de hauteur bornée,
 * donc la fenêtre globale scrolle si le formulaire éditeur dépasse le
 * viewport. Ce scroll global crée une 2e scrollbar visible à côté de
 * celle de la preview, peu importe les efforts faits sur le layout interne.
 *
 * En verrouillant `body.overflow`, on garantit qu'AUCUNE scrollbar de page
 * n'apparaît. Les colonnes formulaire et preview ont leurs propres scrolls
 * indépendants (visibles seulement si leur contenu dépasse leur hauteur).
 *
 * Restauration au unmount : le user qui revient à `/admin/crm` retrouve
 * le scroll normal.
 */
export default function LockBodyScroll() {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  return null
}
