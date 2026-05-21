'use client'

import { Drawer } from '@/components/ui/Drawer'

interface FiltersDrawerProps {
  open: boolean
  onClose: () => void
  hasFilters: boolean
  onReset: () => void
  children: React.ReactNode
}

/**
 * Drawer mobile des filtres prospects — empile les selects fournis en
 * `children` et ajoute un pied « Reinitialiser » / « Appliquer ».
 *
 * Les filtres s'appliquent en direct (a chaque changement de select via la
 * navigation) ; « Appliquer » ne fait donc que refermer le drawer.
 */
export default function FiltersDrawer({
  open,
  onClose,
  hasFilters,
  onReset,
  children,
}: FiltersDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} side="bottom" title="Filtres">
      <div className="flex flex-col gap-4">{children}</div>

      <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              onReset()
              onClose()
            }}
            className="min-h-[44px] flex-1 rounded-sm border border-border px-4 font-body text-sm font-semibold text-muted transition-colors hover:text-primary"
          >
            Réinitialiser
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] flex-1 rounded-sm border border-primary bg-primary px-4 font-body text-sm font-semibold text-white"
        >
          Appliquer
        </button>
      </div>
    </Drawer>
  )
}
