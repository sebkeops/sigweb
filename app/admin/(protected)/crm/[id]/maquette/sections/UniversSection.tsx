import type { Maquette } from '@/types'
import SectionShell from './SectionShell'

interface Props { maquette: Maquette }

export default function UniversSection({ maquette }: Props) {
  const items = maquette.univers_items ?? []
  return (
    <SectionShell
      comingIn="Disponible en Sessions 3.3 (textes) et 3.4 (PhotoManager + drag & drop)"
      description="Édition des 5 cartes Univers (cat, name, desc) et assignation des photos par drag & drop."
      preview={
        <ol className="list-decimal space-y-1 pl-5 font-body text-sm">
          {items.length === 0
            ? <li className="text-muted">—</li>
            : items.slice(0, 5).map((item, i) => (
                <li key={i} className="text-ink">
                  <strong>{item.name}</strong>
                  <span className="text-muted"> · {item.cat}</span>
                </li>
              ))
          }
        </ol>
      }
    />
  )
}
