/**
 * Bandeau légal/éthique affiché en pied de page des simulations publiques
 * (`/simulations/[slug]`).
 *
 * Rappelle au visiteur que les informations affichées (commerce inventé,
 * adresse, horaires, avis Google, photos Unsplash) sont fictives — utile
 * pour ne pas induire en erreur, et obligatoire vu qu'on attribue des
 * photos Unsplash à un commerce inexistant.
 *
 * Placement : à l'INTÉRIEUR du `<div className={demoStyles.demoRoot}>`
 * de `app/simulations/[slug]/page.tsx`, immédiatement après le `<Footer />`.
 * Cela garantit que les CSS variables de palette (`--ink`, `--cream`, ...)
 * définies par le `cssVars` du demoRoot sont accessibles → le bandeau
 * hérite des mêmes couleurs que le footer juste au-dessus, sans cassure
 * visuelle. Sans cette imbrication, `var(--ink)` ne résout pas.
 *
 * Style : prolonge visuellement le footer (même fond `var(--ink)`, même
 * couleur de texte `var(--cream)` à 70 % d'opacité), séparé par un fin
 * trait pour signaler qu'il s'agit d'un encart distinct. Aligné sur la
 * grille 1280px du footer pour la cohérence horizontale.
 *
 * Volontairement HORS du composant `Footer` partagé avec `/demos/[slug]` :
 * les vraies maquettes prospects ne doivent jamais voir ce bandeau.
 */
export default function FictiveDataDisclaimer() {
  return (
    <aside
      role="contentinfo"
      aria-label="Avertissement données fictives"
      style={{
        background: 'var(--ink)',
        color: 'color-mix(in srgb, var(--cream) 65%, transparent)',
        borderTop: '1px solid color-mix(in srgb, var(--cream) 15%, transparent)',
        padding: '24px 32px',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <p
          style={{
            fontSize: '0.82rem',
            lineHeight: 1.6,
            textAlign: 'center',
            fontStyle: 'italic',
            margin: 0,
          }}
        >
          Cette page est une démonstration. L&apos;ensemble des informations
          présentées (nom du commerce, adresse, horaires, avis clients,
          photographies) sont fictives et n&apos;ont qu&apos;une valeur
          illustrative. Photos : Unsplash.
        </p>
      </div>
    </aside>
  )
}
