import type { Maquette, MaquetteUniversItem } from '@/types'
import PhotoManager from '../photos/PhotoManager'

interface Props {
  maquette: Maquette
  universItems: MaquetteUniversItem[]
}

export default function PhotosSection({ maquette, universItems }: Props) {
  return <PhotoManager maquette={maquette} universItems={universItems} />
}
