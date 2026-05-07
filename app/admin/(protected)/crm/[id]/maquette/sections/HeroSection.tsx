import type { Maquette } from '@/types'
import EditableField from '../editor/EditableField'

interface Props { maquette: Maquette }

const HINT_ITALIC = 'Encadrez avec *des étoiles* les mots à mettre en italique dans le rendu.'

export default function HeroSection({ maquette }: Props) {
  return (
    <div className="space-y-4">
      <EditableField
        kind="text"
        field="hero_eyebrow"
        label="Eyebrow"
        placeholder="Artisan boulanger · L'Isle Jourdain"
        initialValue={maquette.hero_eyebrow}
      />
      <EditableField
        kind="textarea"
        field="hero_title"
        label="Titre"
        hint={HINT_ITALIC}
        placeholder="Le pain *fait maison*, au quotidien."
        initialValue={maquette.hero_title}
        rows={2}
      />
      <EditableField
        kind="textarea"
        field="hero_lead"
        label="Phrase d'intro (lead)"
        placeholder="Pétri, façonné et cuit chaque jour…"
        initialValue={maquette.hero_lead}
        rows={3}
      />
      <EditableField
        kind="textarea"
        field="hero_quote"
        label="Citation"
        placeholder="Le bon pain, c'est du temps respecté…"
        initialValue={maquette.hero_quote}
        rows={3}
      />
      <EditableField
        kind="text"
        field="hero_quote_author"
        label="Auteur de la citation"
        placeholder="— Le boulanger"
        initialValue={maquette.hero_quote_author}
      />
    </div>
  )
}
