/**
 * Bandeau légal/éthique affiché en pied de page des simulations publiques
 * (`/simulations/[slug]`).
 *
 * Rappelle au visiteur que les informations affichées (commerce inventé,
 * adresse, horaires, avis Google, photos Unsplash) sont fictives — utile
 * pour ne pas induire en erreur, et obligatoire vu qu'on attribue des
 * photos Unsplash à un commerce inexistant.
 *
 * Placement volontairement HORS du composant `Footer` de
 * `app/demos/[slug]/components/` : le footer reste partagé tel quel avec
 * les vraies maquettes prospects (qui présentent un vrai commerce — pas
 * de disclaimer là-bas). Le bandeau est juste accolé en dessous, dans la
 * page `/simulations/[slug]/page.tsx`.
 *
 * Style discret : fond gris très clair, texte gris foncé, padding modeste,
 * font-size réduite — l'utilisateur peut le lire mais ça ne mange pas la
 * scène visuelle de la simulation.
 */
export default function FictiveDataDisclaimer() {
  return (
    <aside
      role="contentinfo"
      aria-label="Avertissement données fictives"
      className="border-t border-border bg-surface-soft py-6"
    >
      <div className="container-wide">
        <p className="text-center font-body text-xs leading-relaxed text-muted sm:text-sm">
          <em>
            Cette page est une démonstration. L&apos;ensemble des informations
            présentées (nom du commerce, adresse, horaires, avis clients,
            photographies) sont fictives et n&apos;ont qu&apos;une valeur
            illustrative. Photos : Unsplash.
          </em>
        </p>
      </div>
    </aside>
  )
}
