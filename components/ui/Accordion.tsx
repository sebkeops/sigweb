'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Accordion multi-ouvert avec persistance localStorage.
 *
 * Le state est mémorisé sous la clé `accordion:<storageKey>` pour qu'on
 * retrouve l'état d'ouverture en revenant sur la page (ex : éditeur de
 * maquette qui revient à mi-édition).
 *
 * Plusieurs `<AccordionItem>` peuvent être ouverts simultanément — workflow
 * fluide quand on alterne entre sections.
 */

interface AccordionContextValue {
  isOpen: (id: string) => boolean
  toggle: (id: string) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)

interface AccordionProps {
  /** Clé localStorage pour mémoriser l'état d'ouverture. */
  storageKey: string
  /** IDs ouverts par défaut au premier rendu (avant lecture localStorage). */
  defaultOpen?: readonly string[]
  children: ReactNode
}

export function Accordion({ storageKey, defaultOpen = [], children }: AccordionProps) {
  const fullKey = `accordion:${storageKey}`
  const defaultSet = useMemo(() => new Set(defaultOpen), [defaultOpen])

  // SSR-safe : on initialise au défaut, puis on hydrate depuis localStorage en effet.
  const [openIds, setOpenIds] = useState<Set<string>>(defaultSet)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(fullKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setOpenIds(new Set(parsed.filter((s) => typeof s === 'string')))
        }
      }
    } catch {
      // localStorage indisponible (private mode strict) → on garde le défaut.
    }
    setHydrated(true)
  }, [fullKey])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(fullKey, JSON.stringify([...openIds]))
    } catch {
      // ignore
    }
  }, [openIds, fullKey, hydrated])

  const toggle = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isOpen = useCallback((id: string) => openIds.has(id), [openIds])

  const value = useMemo<AccordionContextValue>(() => ({ isOpen, toggle }), [isOpen, toggle])

  return <AccordionContext.Provider value={value}>{children}</AccordionContext.Provider>
}

interface AccordionItemProps {
  id: string
  /** Titre du header cliquable. */
  title: ReactNode
  /** Sous-titre optionnel à droite (ex: badge "à venir"). */
  subtitle?: ReactNode
  children: ReactNode
}

export function AccordionItem({ id, title, subtitle, children }: AccordionItemProps) {
  const ctx = useContext(AccordionContext)
  if (!ctx) throw new Error('AccordionItem must be used inside <Accordion>')
  const open = ctx.isOpen(id)

  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => ctx.toggle(id)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-strong"
      >
        <span className="font-heading text-base font-bold text-ink">{title}</span>
        <span className="flex items-center gap-3">
          {subtitle && <span className="font-body text-xs text-muted">{subtitle}</span>}
          <span
            aria-hidden="true"
            className={`inline-block transition-transform ${open ? 'rotate-180' : ''}`}
          >
            ▾
          </span>
        </span>
      </button>
      {open && (
        <div className="border-t border-border px-5 py-4 font-body text-sm text-text">
          {children}
        </div>
      )}
    </div>
  )
}
