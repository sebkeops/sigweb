'use client'

import { useState } from 'react'
import GoogleSourcingForm from './GoogleSourcingForm'
import SireneSourcingForm from './SireneSourcingForm'

interface Props {
  baseCoords: { lat: number; lng: number } | null
}

type Source = 'google' | 'sirene'

const TABS: Array<{ value: Source; label: string; subtitle: string }> = [
  {
    value: 'google',
    label: 'Google',
    subtitle: 'Commerces présents sur Maps',
  },
  {
    value: 'sirene',
    label: 'Sirene',
    subtitle: 'Commerces récents · données légales',
  },
]

/**
 * Page sourcing avec onglets Google / Sirene (chantier Sirene/PageSpeed
 * Lot 1 étape 4).
 *
 * Le flux Google existant est strictement préservé : `GoogleSourcingForm`
 * est l'extraction 1:1 de l'ancien `SourcingPage`.
 *
 * Le flux Sirene est complémentaire — utile pour capter les commerces
 * récents que Google n'a pas encore indexés (gros levier sourcing).
 */
export default function SourcingPage({ baseCoords }: Props) {
  const [activeSource, setActiveSource] = useState<Source>('google')

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Source de sourcing"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        {TABS.map((tab) => {
          const active = activeSource === tab.value
          return (
            <button
              key={tab.value}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setActiveSource(tab.value)}
              className={`flex flex-col items-start gap-0.5 rounded-md border px-4 py-2 text-left transition ${
                active
                  ? 'border-primary bg-primary-soft text-primary-dark'
                  : 'border-border bg-surface text-muted hover:border-primary/40 hover:text-ink'
              }`}
            >
              <span className="font-heading text-sm font-bold">{tab.label}</span>
              <span className="font-body text-[11px] text-muted">{tab.subtitle}</span>
            </button>
          )
        })}
      </div>

      {activeSource === 'google' ? (
        <GoogleSourcingForm baseCoords={baseCoords} />
      ) : (
        <SireneSourcingForm />
      )}
    </div>
  )
}
