'use client'

import type { Maquette } from '@/types'
import { useEditor } from '../editor/EditorContext'
import LogoUploader from '../identity/LogoUploader'
import PaletteSelector from '../identity/PaletteSelector'

interface Props {
  maquette: Maquette
}

/**
 * Section "Identité & branding" — gère le logo (upload + extraction couleurs)
 * et la palette (catégorie / extraite / personnalisée).
 *
 * Les actions logo/palette ne passent pas par le debounce du contexte
 * d'édition (saves immédiats et atomiques), mais on lit l'updatedAt courant
 * via `getCurrentUpdatedAt()` du contexte (toujours frais, même après un
 * drag-drop photo concurrent) et on notifie via `notifyExternalSave`.
 */
export default function IdentitySection({ maquette }: Props) {
  const { notifyExternalSave, getCurrentUpdatedAt } = useEditor()

  return (
    <div>
      <LogoUploader
        maquette={maquette}
        getUpdatedAt={getCurrentUpdatedAt}
        onSaved={notifyExternalSave}
      />
      <PaletteSelector
        maquette={maquette}
        getUpdatedAt={getCurrentUpdatedAt}
        onSaved={notifyExternalSave}
      />
    </div>
  )
}
