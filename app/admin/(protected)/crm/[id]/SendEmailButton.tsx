'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  prepareEmailContent,
  regenerateEmailPreview,
  sendEmail,
} from '@/lib/actions/email'
import type { WebVariant } from '@/types'

interface Props {
  prospectId: string
  /** Pré-validés côté serveur dans page.tsx pour décider si afficher le bouton. */
  hasEmail: boolean
  isUnsubscribed: boolean
  hasPublishedMaquette: boolean
}

interface PreparedContent {
  variant: WebVariant
  subject: string
  bodyHtml: string
  bodyText: string
  previewImageUrl: string | null
  maquetteUrl: string
  toEmail: string
  from: string
}

type Tab = 'visual' | 'html' | 'text'

export default function SendEmailButton({
  prospectId,
  hasEmail,
  isUnsubscribed,
  hasPublishedMaquette,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<PreparedContent | null>(null)
  const [variantOverride, setVariantOverride] = useState<WebVariant | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('visual')
  const [sending, startSendingTransition] = useTransition()
  const [sentInfo, setSentInfo] = useState<string | null>(null)

  const disabled = !hasEmail || isUnsubscribed
  const disabledReason = !hasEmail
    ? 'Pas d\'email renseigné'
    : isUnsubscribed
    ? 'Prospect désabonné'
    : null

  async function openAndLoad(forcedVariant?: WebVariant) {
    setOpen(true)
    setLoading(true)
    setError(null)
    setSentInfo(null)
    const result = await prepareEmailContent(prospectId, forcedVariant)
    setLoading(false)
    if (!result.success) {
      setError(result.error)
      setContent(null)
      return
    }
    setContent(result.data)
    setVariantOverride(forcedVariant ?? result.data.variant)
  }

  async function toggleVariant() {
    if (!content) return
    const otherVariant: WebVariant =
      content.variant === 'sans-site' ? 'avec-site' : 'sans-site'
    await openAndLoad(otherVariant)
  }

  async function handleRegeneratePreview() {
    setError(null)
    const result = await regenerateEmailPreview(prospectId)
    if (!result.success) {
      setError(result.error)
      return
    }
    // On recharge tout le contenu pour que le HTML embarque la nouvelle URL.
    await openAndLoad(variantOverride ?? content?.variant)
  }

  function handleSend(toOverride?: string) {
    if (!content) return
    setError(null)
    setSentInfo(null)
    startSendingTransition(async () => {
      const result = await sendEmail({
        prospectId,
        variantOverride: variantOverride ?? content.variant,
        customSubject: content.subject,
        customBodyHtml: content.bodyHtml,
        customBodyText: content.bodyText,
        toOverride,
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      setSentInfo(`Email envoyé à ${result.to}`)
    })
  }

  function close() {
    setOpen(false)
    // Garde le contenu en mémoire au cas où l'admin réouvre rapidement.
  }

  return (
    <div className="flex flex-col items-end gap-1 max-lg:items-stretch">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => openAndLoad()}
        disabled={disabled}
        className="max-lg:min-h-[44px] max-lg:w-full"
      >
        Envoyer email
      </Button>
      {disabledReason && (
        <span className="font-body text-xs text-muted">{disabledReason}</span>
      )}
      {!disabled && !hasPublishedMaquette && (
        <span className="font-body text-xs text-orange-600">
          ⚠ Pas de maquette publiée
        </span>
      )}

      <Modal
        open={open}
        onClose={close}
        title="Envoyer un email de prospection"
        size="2xl"
      >
        {loading && (
          <p className="font-body text-sm text-muted">
            Préparation de l'email (rendu + screenshot maquette)…
          </p>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {content && !loading && (
          <div className="space-y-5">
            {/* ─── Section 1 : variante ─────────────────────────── */}
            <div className="rounded-md border border-border bg-surface-strong p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-muted">
                    Variante détectée automatiquement
                  </p>
                  <p className="mt-1 font-heading text-base font-bold text-ink">
                    {content.variant === 'sans-site'
                      ? 'Sans site existant'
                      : 'Avec site existant'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleVariant}
                >
                  Forcer{' '}
                  {content.variant === 'sans-site' ? 'avec site' : 'sans site'}
                </Button>
              </div>
            </div>

            {/* ─── Section 2 : preview maquette ─────────────────── */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-body text-xs uppercase tracking-wider text-muted">
                  Preview de la maquette
                </p>
                <button
                  type="button"
                  onClick={handleRegeneratePreview}
                  className="font-body text-xs text-primary hover:underline"
                >
                  Régénérer
                </button>
              </div>
              {content.previewImageUrl ? (
                <Image
                  src={content.previewImageUrl}
                  alt="Aperçu maquette"
                  width={600}
                  height={315}
                  unoptimized
                  className="w-full rounded-md border border-border"
                />
              ) : (
                <div className="rounded-md border border-dashed border-border bg-surface-strong px-4 py-8 text-center font-body text-sm text-muted">
                  Pas de preview disponible — l'email partira avec le placeholder.
                </div>
              )}
            </div>

            {/* ─── Section 3 : destinataires + sujet ────────────── */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted">
                    De
                  </label>
                  <input
                    type="text"
                    value={content.from}
                    readOnly
                    className="mt-1 w-full cursor-not-allowed rounded-sm border border-border bg-surface-strong px-3 py-2 font-body text-sm text-muted"
                  />
                </div>
                <div>
                  <label className="font-body text-xs uppercase tracking-wider text-muted">
                    À
                  </label>
                  <input
                    type="text"
                    value={content.toEmail}
                    readOnly
                    className="mt-1 w-full cursor-not-allowed rounded-sm border border-border bg-surface-strong px-3 py-2 font-body text-sm text-muted"
                  />
                </div>
              </div>
              <div>
                <label className="font-body text-xs uppercase tracking-wider text-muted">
                  Sujet
                </label>
                <input
                  type="text"
                  value={content.subject}
                  onChange={(e) =>
                    setContent({ ...content, subject: e.target.value })
                  }
                  className="mt-1 w-full rounded-sm border border-border bg-surface px-3 py-2 font-body text-sm text-ink focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* ─── Section 4 : aperçu / source HTML / texte ────── */}
            <div>
              <div className="mb-2 flex border-b border-border">
                <TabButton
                  label="Aperçu"
                  active={activeTab === 'visual'}
                  onClick={() => setActiveTab('visual')}
                />
                <TabButton
                  label="HTML"
                  active={activeTab === 'html'}
                  onClick={() => setActiveTab('html')}
                />
                <TabButton
                  label="Texte"
                  active={activeTab === 'text'}
                  onClick={() => setActiveTab('text')}
                />
              </div>

              {activeTab === 'visual' && (
                <iframe
                  title="Aperçu email"
                  srcDoc={content.bodyHtml}
                  sandbox=""
                  className="h-[520px] w-full rounded-sm border border-border bg-white"
                />
              )}
              {activeTab === 'html' && (
                <textarea
                  value={content.bodyHtml}
                  onChange={(e) =>
                    setContent({ ...content, bodyHtml: e.target.value })
                  }
                  spellCheck={false}
                  className="h-[520px] w-full rounded-sm border border-border bg-surface-strong p-3 font-mono text-xs text-ink focus:border-primary focus:outline-none"
                />
              )}
              {activeTab === 'text' && (
                <textarea
                  value={content.bodyText}
                  onChange={(e) =>
                    setContent({ ...content, bodyText: e.target.value })
                  }
                  spellCheck={false}
                  className="h-[520px] w-full rounded-sm border border-border bg-surface-strong p-3 font-mono text-xs text-ink focus:border-primary focus:outline-none"
                />
              )}
            </div>

            {sentInfo && (
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                ✓ {sentInfo}
              </div>
            )}

            {/* ─── Section 5 : actions ──────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={close}
                disabled={sending}
              >
                Fermer
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSend('siguenza.sebastien@gmail.com')}
                  loading={sending}
                >
                  Envoyer un test à mon email
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleSend()}
                  loading={sending}
                  disabled={!hasPublishedMaquette}
                >
                  Envoyer à {content.toEmail}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 font-body text-sm transition-colors ${
        active
          ? 'border-b-2 border-primary font-semibold text-primary'
          : 'text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  )
}
