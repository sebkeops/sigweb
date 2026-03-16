'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { submitSimulateur } from '@/lib/actions/simulateur'
import {
  type SimulateurAnswers,
  type ChoiceOption,
  projectTypeOptions,
  activityTypeOptions,
  priorityOptionsDefault,
  priorityOptionsArtisan,
  featuresOptions,
  contentOptions,
  selfManageOptions,
  selfManageItemsOptions,
  googleOptions,
  calculateEstimate,
  buildAnswerSummary,
} from '@/lib/simulateur/config'

// ── Types ──────────────────────────────────────────────────────
type WizardStep = 'intro' | '1' | '2' | '3' | '4' | '5' | '6' | '6b' | '7' | 'result'

const STEP_NUMBERS: Partial<Record<WizardStep, number>> = {
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '6b': 6, '7': 7,
}

function getNextStep(step: WizardStep, answers: Partial<SimulateurAnswers>): WizardStep {
  switch (step) {
    case 'intro': return '1'
    case '1': return '2'
    case '2': return '3'
    case '3': return '4'
    case '4': return '5'
    case '5': return '6'
    case '6': return answers.selfManage === 'Oui, pour quelques informations importantes' ? '6b' : '7'
    case '6b': return '7'
    default: return 'result'
  }
}

// ── Sous-composants ────────────────────────────────────────────
function OptionCard({
  option,
  selected,
  onClick,
}: {
  option: ChoiceOption
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-start gap-4 rounded-md border-2 bg-surface p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/40 hover:bg-surface-soft'
      }`}
    >
      {option.icon && (
        <span className="shrink-0 text-2xl leading-none" aria-hidden="true">
          {option.icon}
        </span>
      )}
      <div className="flex-1">
        <span className="block font-body text-sm font-semibold leading-snug text-ink sm:text-base">
          {option.label}
        </span>
        {option.hint && (
          <span className="mt-0.5 block font-body text-xs leading-snug text-muted">{option.hint}</span>
        )}
      </div>
      {selected && (
        <span className="shrink-0 font-bold text-primary" aria-hidden="true">
          ✓
        </span>
      )}
    </button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mb-8 flex items-center gap-1.5 rounded-sm font-body text-sm text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      ← Retour
    </button>
  )
}

function StepIntro({ onStart }: { onStart: () => void }) {
  return (
    <section className="section-pad bg-bg">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mb-6 block text-5xl" aria-hidden="true">
          ⏱️
        </span>
        <h1 className="mb-4 font-heading text-4xl font-extrabold text-ink md:text-5xl">
          Estimez votre projet
          <br />
          en 2 minutes
        </h1>
        <p className="mb-10 font-body text-lg leading-relaxed text-muted">
          Répondez à quelques questions simples pour obtenir une première estimation claire.
        </p>
        <button
          onClick={onStart}
          className="rounded-sm bg-cta px-10 py-4 font-heading text-lg font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2"
        >
          Commencer
        </button>
        <p className="mt-5 font-body text-sm text-muted">Sans engagement · Résultat immédiat</p>
      </div>
    </section>
  )
}

function StepQuestion({
  question,
  hint,
  options,
  onSelect,
  onBack,
  showBack = true,
}: {
  question: string
  hint?: string
  options: ChoiceOption[]
  onSelect: (value: string) => void
  onBack: () => void
  showBack?: boolean
}) {
  return (
    <section className="px-6 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-2xl">
        {showBack && <BackButton onClick={onBack} />}
        <fieldset>
          <legend>
            <h2 className="mb-2 font-heading text-2xl font-extrabold text-ink md:text-3xl">
              {question}
            </h2>
          </legend>
          {hint && <p className="mb-6 font-body text-sm text-muted">{hint}</p>}
          <div className="mt-6 grid grid-cols-1 gap-3">
            {options.map((option) => (
              <OptionCard
                key={option.value}
                option={option}
                selected={false}
                onClick={() => onSelect(option.value)}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  )
}

function StepMulti({
  question,
  hint,
  options,
  selected,
  onToggle,
  onContinue,
  onBack,
}: {
  question: string
  hint?: string
  options: ChoiceOption[]
  selected: string[]
  onToggle: (value: string) => void
  onContinue: () => void
  onBack: () => void
}) {
  return (
    <section className="px-6 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-2xl">
        <BackButton onClick={onBack} />
        <fieldset>
          <legend>
            <h2 className="mb-2 font-heading text-2xl font-extrabold text-ink md:text-3xl">
              {question}
            </h2>
          </legend>
          {hint && <p className="mb-2 font-body text-sm text-muted">{hint}</p>}
          <p className="mb-6 font-body text-xs text-muted">Vous pouvez choisir plusieurs réponses.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {options.map((option) => (
              <OptionCard
                key={option.value}
                option={option}
                selected={selected.includes(option.value)}
                onClick={() => onToggle(option.value)}
              />
            ))}
          </div>
        </fieldset>
        <div className="mt-8">
          <button
            onClick={onContinue}
            className="w-full rounded-sm bg-primary py-4 font-heading text-base font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:w-auto md:px-10"
          >
            Continuer →
          </button>
        </div>
      </div>
    </section>
  )
}

type FormState = { name: string; email: string; phone: string; business_name: string; website: string }

function StepResult({
  low,
  high,
  answers,
  form,
  setForm,
  formErrors,
  submitState,
  submitError,
  onSubmit,
  onBack,
}: {
  low: number
  high: number
  answers: Partial<SimulateurAnswers>
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  formErrors: Record<string, string>
  submitState: 'idle' | 'loading' | 'success' | 'error'
  submitError: string | null
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
}) {
  const inputClass =
    'w-full rounded-sm border border-border bg-surface px-4 py-3 font-body text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'

  const summaryItems = [
    answers.projectType && `${answers.projectType}`,
    answers.activityType && `${answers.activityType}`,
    answers.priority && `Priorité : ${answers.priority}`,
    answers.features?.length ? `${answers.features.length} fonctionnalité(s) sélectionnée(s)` : null,
    answers.selfManage && answers.selfManage !== 'Non, je préfère que vous vous en occupiez'
      ? 'Modifications en autonomie'
      : null,
    answers.googleVisibility !== 'Pas forcément' ? 'Visibilité Google incluse' : null,
  ].filter(Boolean) as string[]

  if (submitState === 'success') {
    return (
      <section className="section-pad bg-bg">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-6 block text-5xl" aria-hidden="true">
            🎉
          </span>
          <h2 className="mb-4 font-heading text-3xl font-extrabold text-ink">
            Demande envoyée !
          </h2>
          <p className="mb-8 font-body text-lg leading-relaxed text-muted">
            Merci pour votre confiance. Je reviens vers vous rapidement avec une estimation détaillée.
          </p>
          <Link
            href="/simulations"
            className="inline-flex items-center gap-2 font-body text-sm font-semibold text-primary hover:underline"
          >
            Voir des exemples de sites →
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-bg">
      {/* Bloc estimation */}
      <div className="bg-primary/5 px-6 py-12 md:px-12">
        <div className="mx-auto max-w-2xl">
          <BackButton onClick={onBack} />
          <div className="mb-2 text-4xl" aria-hidden="true">
            📋
          </div>
          <h2 className="mb-6 font-heading text-3xl font-extrabold text-ink md:text-4xl">
            Estimation de votre projet
          </h2>

          {/* Résumé des réponses */}
          {summaryItems.length > 0 && (
            <ul className="mb-8 flex flex-wrap gap-2" aria-label="Résumé de vos réponses">
              {summaryItems.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-white px-3 py-1 font-body text-xs font-semibold text-ink shadow-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}

          {/* Fourchette de prix */}
          <div className="mb-4 rounded-lg border border-primary/20 bg-white px-8 py-7 shadow-sm">
            <p className="mb-1 font-body text-sm font-semibold uppercase tracking-wide text-muted">
              Estimation indicative
            </p>
            <p className="font-heading text-4xl font-extrabold text-primary md:text-5xl">
              Entre {low.toLocaleString('fr-FR')} € et {high.toLocaleString('fr-FR')} €
            </p>
          </div>

          <p className="font-body text-sm leading-relaxed text-muted">
            Cette estimation est indicative. Le prix final dépendra du contenu à intégrer et des
            options retenues.
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="px-6 py-12 md:px-12">
        <div className="mx-auto max-w-2xl">
          <h3 className="mb-2 font-heading text-2xl font-extrabold text-ink">
            Recevoir une estimation détaillée
          </h3>
          <p className="mb-8 font-body text-sm text-muted">
            Laissez-moi vos coordonnées et je vous prépare un devis personnalisé.
          </p>

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {submitError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Nom */}
              <div>
                <label htmlFor="sim-name" className="mb-1.5 block font-body text-sm font-semibold text-ink">
                  Votre nom <span className="text-cta">*</span>
                </label>
                <input
                  id="sim-name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  aria-invalid={!!formErrors.name}
                  aria-describedby={formErrors.name ? 'sim-name-error' : undefined}
                  className={inputClass}
                  placeholder="Jean Dupont"
                />
                {formErrors.name && (
                  <p id="sim-name-error" className="mt-1 font-body text-xs text-red-600">
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Nom du commerce */}
              <div>
                <label htmlFor="sim-business" className="mb-1.5 block font-body text-sm font-semibold text-ink">
                  Nom de votre commerce
                </label>
                <input
                  id="sim-business"
                  type="text"
                  autoComplete="organization"
                  maxLength={150}
                  value={form.business_name}
                  onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))}
                  className={inputClass}
                  placeholder="Boulangerie Dupont"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="sim-email" className="mb-1.5 block font-body text-sm font-semibold text-ink">
                  Votre email <span className="text-cta">*</span>
                </label>
                <input
                  id="sim-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? 'sim-email-error' : undefined}
                  className={inputClass}
                  placeholder="jean@boulangerie.fr"
                />
                {formErrors.email && (
                  <p id="sim-email-error" className="mt-1 font-body text-xs text-red-600">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Téléphone */}
              <div>
                <label htmlFor="sim-phone" className="mb-1.5 block font-body text-sm font-semibold text-ink">
                  Téléphone
                </label>
                <input
                  id="sim-phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={20}
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className={inputClass}
                  placeholder="06 00 00 00 00"
                />
              </div>
            </div>

            {/* Honeypot anti-spam (caché visuellement) */}
            <div aria-hidden="true" className="absolute left-[-9999px] top-0 overflow-hidden">
              <label htmlFor="sim-website">Ne pas remplir</label>
              <input
                id="sim-website"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitState === 'loading'}
                className="w-full rounded-sm bg-cta py-4 font-heading text-base font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 disabled:opacity-50 md:w-auto md:px-10"
              >
                {submitState === 'loading' ? 'Envoi en cours…' : 'Recevoir mon estimation détaillée'}
              </button>
            </div>
          </form>

          {/* Lien secondaire vers simulations */}
          <div className="mt-10 border-t border-border pt-8 text-center">
            <p className="mb-3 font-body text-sm text-muted">
              Pas encore prêt à vous lancer ? Jetez d&apos;abord un œil aux exemples.
            </p>
            <Link
              href="/simulations"
              className="inline-flex items-center gap-2 font-body text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
            >
              Voir des exemples de sites →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Composant principal ────────────────────────────────────────
export default function Simulateur() {
  const [step, setStep] = useState<WizardStep>('intro')
  const [history, setHistory] = useState<WizardStep[]>([])
  const [animKey, setAnimKey] = useState(0)
  const [answers, setAnswers] = useState<Partial<SimulateurAnswers>>({
    features: [],
    selfManageItems: [],
  })

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    website: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (step !== 'intro') {
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }, [step])

  function goTo(nextStep: WizardStep) {
    setHistory((h) => [...h, step])
    setAnimKey((k) => k + 1)
    setStep(nextStep)
  }

  function goBack() {
    if (!history.length) return
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setAnimKey((k) => k + 1)
    setStep(prev)
  }

  function selectSingle(field: keyof SimulateurAnswers, value: string) {
    const newAnswers = { ...answers, [field]: value }
    setAnswers(newAnswers)
    goTo(getNextStep(step, newAnswers))
  }

  function toggleMulti(field: 'features' | 'selfManageItems', value: string) {
    setAnswers((prev) => {
      const current = (prev[field] ?? []) as string[]
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      }
    })
  }

  function continueStep() {
    goTo(getNextStep(step, answers))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errors: Record<string, string> = {}
    if (!form.name.trim() || form.name.trim().length < 2) {
      errors.name = 'Merci de saisir votre nom (au moins 2 caractères).'
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Adresse email invalide.'
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    setSubmitState('loading')
    setSubmitError(null)

    const result = await submitSimulateur({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      business_name: form.business_name.trim() || undefined,
      summary: buildAnswerSummary(answers),
      website: form.website,
    })

    if (result.success) {
      setSubmitState('success')
    } else {
      setSubmitState('error')
      setSubmitError(result.error ?? 'Une erreur est survenue.')
    }
  }

  const stepNum = STEP_NUMBERS[step]
  const priorityOpts =
    answers.activityType === 'Artisan / entreprise artisanale'
      ? priorityOptionsArtisan
      : priorityOptionsDefault
  const { low, high } = step === 'result' ? calculateEstimate(answers) : { low: 0, high: 0 }

  return (
    <div ref={topRef}>
      {/* Barre de progression */}
      {stepNum && (
        <div className="sticky top-16 z-10 border-b border-border bg-surface/95 backdrop-blur-sm">
          <div className="container-wide section-pad py-0">
            <div className="flex items-center gap-3 py-3.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  role="progressbar"
                  aria-valuenow={stepNum}
                  aria-valuemin={1}
                  aria-valuemax={7}
                  aria-label={`Étape ${stepNum} sur 7`}
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(stepNum / 7) * 100}%` }}
                />
              </div>
              <span className="whitespace-nowrap font-body text-xs text-muted">
                Étape {stepNum} sur 7
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Contenu animé */}
      <div key={animKey} className="animate-fade-step">
        {step === 'intro' && <StepIntro onStart={() => goTo('1')} />}

        {step === '1' && (
          <StepQuestion
            question="Quel est votre projet ?"
            options={projectTypeOptions}
            onSelect={(v) => selectSingle('projectType', v)}
            onBack={goBack}
            showBack={false}
          />
        )}

        {step === '2' && (
          <StepQuestion
            question="Quel type d'activité avez-vous ?"
            options={activityTypeOptions}
            onSelect={(v) => selectSingle('activityType', v)}
            onBack={goBack}
          />
        )}

        {step === '3' && (
          <StepQuestion
            question="Que doit faire votre site en priorité ?"
            options={priorityOpts}
            onSelect={(v) => selectSingle('priority', v)}
            onBack={goBack}
          />
        )}

        {step === '4' && (
          <StepMulti
            question="De quoi avez-vous besoin sur votre site ?"
            options={featuresOptions}
            selected={answers.features ?? []}
            onToggle={(v) => toggleMulti('features', v)}
            onContinue={continueStep}
            onBack={goBack}
          />
        )}

        {step === '5' && (
          <StepQuestion
            question="Avez-vous déjà le contenu ?"
            hint="Textes, photos, informations à afficher sur le site."
            options={contentOptions}
            onSelect={(v) => selectSingle('content', v)}
            onBack={goBack}
          />
        )}

        {step === '6' && (
          <StepQuestion
            question="Souhaitez-vous pouvoir modifier votre site vous-même ?"
            hint="Par exemple : changer vos horaires, ajouter une photo ou mettre à jour vos produits."
            options={selfManageOptions}
            onSelect={(v) => selectSingle('selfManage', v)}
            onBack={goBack}
          />
        )}

        {step === '6b' && (
          <StepMulti
            question="Que souhaitez-vous pouvoir modifier vous-même ?"
            options={selfManageItemsOptions}
            selected={answers.selfManageItems ?? []}
            onToggle={(v) => toggleMulti('selfManageItems', v)}
            onContinue={continueStep}
            onBack={goBack}
          />
        )}

        {step === '7' && (
          <StepQuestion
            question="Est-ce important pour vous d'apparaître sur Google ?"
            options={googleOptions}
            onSelect={(v) => selectSingle('googleVisibility', v)}
            onBack={goBack}
          />
        )}

        {step === 'result' && (
          <StepResult
            low={low}
            high={high}
            answers={answers}
            form={form}
            setForm={setForm}
            formErrors={formErrors}
            submitState={submitState}
            submitError={submitError}
            onSubmit={handleSubmit}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  )
}
