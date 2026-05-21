import type { Maquette } from '@/types'
import EditableField from '../editor/EditableField'

interface Props {
  maquette: Maquette
}

const HINT_ITALIC = 'Encadrez avec *des étoiles* les mots à mettre en italique dans le rendu.'

/**
 * Section "Lexique" — regroupe les 7 libellés transverses conditionnés par
 * catégorie (extension presets métier) :
 *   - brandTagline (header + footer)
 *   - 2 labels de nav (header + footer)
 *   - texte du CTA Hero primaire
 *   - suptitle de la section Histoire
 *   - titre de la section Avis (markdown italique)
 *   - label H4 de la colonne d'ancrage du Footer
 *
 * Le regroupement en une seule section facilite l'ajustement cohérent du
 * vocabulaire d'une maquette (ex : un coiffeur peut harmoniser "Le salon"
 * partout en quelques secondes). Pour modifier le contenu rédactionnel des
 * sections elles-mêmes (Hero / Histoire / etc.), voir les autres sections
 * de l'éditeur.
 */
export default function LexiqueSection({ maquette }: Props) {
  return (
    <div className="space-y-4">
      <p className="font-body text-xs text-muted">
        Ces 7 libellés sont préremplis selon la catégorie du prospect. Modifiez-les ici
        pour ajuster le vocabulaire de l&apos;ensemble de la page (header, footer, boutons,
        titres de section).
      </p>

      <EditableField
        kind="text"
        field="brand_tagline"
        label="Sous-titre du nom (header + footer)"
        placeholder="Boulangerie · Pâtisserie"
        initialValue={maquette.brand_tagline}
      />

      <div className="grid grid-cols-2 gap-3">
        <EditableField
          kind="text"
          field="nav_histoire_label"
          label="Nav : lien Histoire"
          placeholder="La maison"
          initialValue={maquette.nav_histoire_label}
        />
        <EditableField
          kind="text"
          field="nav_univers_label"
          label="Nav : lien Nos créations"
          placeholder="Nos créations"
          initialValue={maquette.nav_univers_label}
        />
      </div>

      <EditableField
        kind="text"
        field="hero_cta_primaire"
        label="Bouton Hero primaire"
        placeholder="Voir nos créations →"
        initialValue={maquette.hero_cta_primaire}
      />

      <EditableField
        kind="text"
        field="histoire_suptitle"
        label="Sur-titre section Histoire"
        placeholder="La maison"
        initialValue={maquette.histoire_suptitle}
      />

      <EditableField
        kind="textarea"
        field="avis_section_titre"
        label="Titre section Avis"
        hint={HINT_ITALIC}
        placeholder="Ce qu'en pensent nos *habitués*."
        initialValue={maquette.avis_section_titre}
        rows={2}
      />

      <EditableField
        kind="text"
        field="footer_colonne_label"
        label="Titre colonne Footer"
        placeholder="Le commerce"
        initialValue={maquette.footer_colonne_label}
      />
    </div>
  )
}
