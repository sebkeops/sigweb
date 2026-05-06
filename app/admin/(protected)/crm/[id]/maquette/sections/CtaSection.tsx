import type { Maquette } from '@/types'
import EditableField from '../editor/EditableField'

interface Props { maquette: Maquette }

const HINT_ITALIC = 'Encadrez avec *des étoiles* les mots à mettre en italique dans le rendu.'

export default function CtaSection({ maquette }: Props) {
  return (
    <div className="space-y-4">
      <EditableField
        kind="text"
        field="cta_banner_title"
        label="Titre"
        hint={HINT_ITALIC}
        placeholder="Une commande, *une question* ?"
        initialValue={maquette.cta_banner_title}
      />
      <EditableField
        kind="textarea"
        field="cta_banner_text"
        label="Texte d'accompagnement"
        placeholder="Pour toute commande spéciale, un coup de fil suffit."
        initialValue={maquette.cta_banner_text}
        rows={3}
      />
    </div>
  )
}
