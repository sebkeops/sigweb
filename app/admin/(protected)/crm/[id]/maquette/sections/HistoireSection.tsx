import type { Maquette } from '@/types'
import EditableField from '../editor/EditableField'

interface Props { maquette: Maquette }

const HINT_ITALIC = 'Encadrez avec *des étoiles* les mots à mettre en italique dans le rendu.'

export default function HistoireSection({ maquette }: Props) {
  return (
    <div className="space-y-4">
      <EditableField
        kind="textarea"
        field="histoire_title"
        label="Titre"
        hint={HINT_ITALIC}
        placeholder="Une boulangerie de *quartier*, ouverte à tous."
        initialValue={maquette.histoire_title}
        rows={2}
      />
      <EditableField
        kind="textarea"
        field="histoire_lead"
        label="Phrase italique d'intro"
        placeholder="Avec une seule idée en tête : faire du bon pain, simplement."
        initialValue={maquette.histoire_lead}
        rows={2}
      />
      <EditableField
        kind="textarea"
        field="texte_presentation"
        label="Paragraphe principal"
        placeholder="Pas de fioritures. Du levain naturel…"
        initialValue={maquette.texte_presentation}
        rows={5}
      />
      <EditableField
        kind="number"
        field="annee_creation"
        label="Année de création"
        placeholder="2014"
        initialValue={maquette.annee_creation}
        min={1800}
        max={2100}
      />
      <p className="font-body text-xs text-muted">
        L&apos;année alimente le bandeau « X ans de savoir-faire » et le bloc Hero meta.
        Laisser vide masque le bandeau.
      </p>
    </div>
  )
}
