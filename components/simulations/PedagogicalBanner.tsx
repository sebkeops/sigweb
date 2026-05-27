import Link from 'next/link'
import type { ProspectCategorie } from '@/types'
import { PEDAGOGICAL_BANNER_TEXT_BY_CATEGORIE } from './pedagogical-banner-texts'

/**
 * Bandeau pédagogique placé EN HAUT des pages `/simulations/[slug]`,
 * AVANT le Header sticky de la simulation.
 *
 * Pourquoi ce bandeau : sans contextualisation, un visiteur arrivant
 * directement sur `/simulations/boulangerie` peut croire pendant les
 * 5 premières secondes qu'il s'agit du vrai site d'une boulangerie. Ce
 * bandeau dit clairement "Simulation SIGWEB — voici à quoi ressemblerait
 * votre site" et propose deux raccourcis de navigation.
 *
 * Structure :
 *   - Gauche : préfixe "Simulation SIGWEB —" en gras + texte pédagogique
 *     spécifique à la catégorie (cf. PEDAGOGICAL_BANNER_TEXT_BY_CATEGORIE).
 *   - Droite : 2 boutons (Accueil + Voir toutes les simulations).
 *
 * Important :
 *   - PAS sticky : il défile avec la page, libérant le Header sticky de
 *     la simulation pour qu'il reste fonctionnel comme sur /demos/[slug].
 *   - Placé HORS du `<div className={demoStyles.demoRoot}>` (ou avant) :
 *     il n'utilise donc PAS les CSS variables de palette (--ink, --cream)
 *     qui sont scoped au demoRoot. Style indépendant via Tailwind, sur
 *     les tokens globaux du site sigweb.fr (primary vert, surface, ink).
 *   - N'apparaît que sur `/simulations/[slug]`, JAMAIS sur `/demos/[slug]`.
 *
 * Server Component pur (pas de state ni d'interactivité).
 */

interface Props {
  categoryId: ProspectCategorie
}

export default function PedagogicalBanner({ categoryId }: Props) {
  const text = PEDAGOGICAL_BANNER_TEXT_BY_CATEGORIE[categoryId]

  return (
    <aside
      role="region"
      aria-label="Contexte de la simulation"
      className="border-b border-border bg-surface"
    >
      {/* px-4 sm:px-6 lg:px-8 : `container-wide` ne définit que `max-w` +
          `mx-auto` (cf. globals.css), il faut donc apporter le padding
          horizontal localement pour éviter que le texte colle aux bords
          de l'écran sur mobile. */}
      <div className="container-wide px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          {/* Texte pédagogique */}
          <p className="font-body text-sm leading-relaxed text-ink lg:text-[0.95rem]">
            <strong className="font-heading font-bold text-primary">
              Simulation SIGWEB —{' '}
            </strong>
            {text}
          </p>

          {/* Boutons navigation (côté droit, empilés sur mobile) */}
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-white px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:border-primary/40 hover:bg-surface-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span aria-hidden="true">←</span>
              <span>Accueil</span>
            </Link>
            <Link
              href="/simulations"
              className="inline-flex items-center rounded-sm bg-primary px-4 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Voir toutes les simulations
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
