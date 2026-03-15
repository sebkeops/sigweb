'use client'

import { useActionState, useRef } from 'react'
import { submitContact, type ContactActionState } from '@/lib/actions/contact'
import { Button } from '@/components/ui/Button'

const businessTypes = [
  { value: '', label: 'Votre activité (optionnel)' },
  { value: 'boulangerie', label: 'Boulangerie' },
  { value: 'patisserie', label: 'Pâtisserie' },
  { value: 'boucherie', label: 'Boucherie' },
  { value: 'coiffeur', label: 'Salon de coiffure' },
  { value: 'artisan', label: 'Artisan' },
  { value: 'commerce', label: 'Commerce de proximité' },
  { value: 'autre', label: 'Autre' },
]

const initialState: ContactActionState = { success: false }

export default function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  if (state.success) {
    return (
      <div className="rounded-md border border-primary-soft bg-primary-soft/30 p-8 text-center">
        <div className="mb-3 text-4xl">✅</div>
        <h2 className="font-heading text-xl font-bold text-ink">Message envoyé !</h2>
        <p className="mt-2 font-body text-sm text-muted">
          Merci pour votre message. Nous vous répondrons dans les meilleurs délais.
        </p>
      </div>
    )
  }

  return (
    <form ref={formRef} action={action} noValidate className="space-y-5">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Nom */}
        <div>
          <label htmlFor="name" className="mb-1.5 block font-body text-sm font-semibold text-ink">
            Votre nom <span className="text-cta">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={100}
            className="w-full rounded-sm border border-border bg-surface px-4 py-3 font-body text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Jean Dupont"
          />
          {state.fieldErrors?.name && (
            <p className="mt-1 font-body text-xs text-red-600">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        {/* Nom du commerce */}
        <div>
          <label
            htmlFor="business_name"
            className="mb-1.5 block font-body text-sm font-semibold text-ink"
          >
            Nom de votre commerce
          </label>
          <input
            id="business_name"
            name="business_name"
            type="text"
            autoComplete="organization"
            maxLength={150}
            className="w-full rounded-sm border border-border bg-surface px-4 py-3 font-body text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Boulangerie Dupont"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1.5 block font-body text-sm font-semibold text-ink">
            Email <span className="text-cta">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={255}
            className="w-full rounded-sm border border-border bg-surface px-4 py-3 font-body text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="jean@example.com"
          />
          {state.fieldErrors?.email && (
            <p className="mt-1 font-body text-xs text-red-600">{state.fieldErrors.email[0]}</p>
          )}
        </div>

        {/* Téléphone */}
        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block font-body text-sm font-semibold text-ink"
          >
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={20}
            className="w-full rounded-sm border border-border bg-surface px-4 py-3 font-body text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="06 12 34 56 78"
          />
        </div>
      </div>

      {/* Type d'activité */}
      <div>
        <label
          htmlFor="business_type"
          className="mb-1.5 block font-body text-sm font-semibold text-ink"
        >
          Type d&apos;activité
        </label>
        <select
          id="business_type"
          name="business_type"
          className="w-full rounded-sm border border-border bg-surface px-4 py-3 font-body text-sm text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {businessTypes.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="mb-1.5 block font-body text-sm font-semibold text-ink"
        >
          Votre message <span className="text-cta">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          maxLength={2000}
          className="w-full resize-none rounded-sm border border-border bg-surface px-4 py-3 font-body text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Décrivez votre projet en quelques mots : votre activité, ce que vous cherchez pour votre site, ou vos questions."
        />
        {state.fieldErrors?.message && (
          <p className="mt-1 font-body text-xs text-red-600">{state.fieldErrors.message[0]}</p>
        )}
      </div>

      {/* Honeypot anti-spam — caché visuellement et des lecteurs d'écran */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-0 opacity-0">
        <label htmlFor="website">Ne pas remplir ce champ</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <Button type="submit" variant="cta" size="lg" loading={pending} className="w-full sm:w-auto">
        Envoyer le message
      </Button>
    </form>
  )
}
