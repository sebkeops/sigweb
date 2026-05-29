import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ProspectStatut } from '@/types'
import {
  isTestEmailRecipient,
  nextStatutAfterEmailSent,
} from './statut-progression'

describe('nextStatutAfterEmailSent — progression mécanique', () => {
  it('a_qualifier → contacte (1er contact)', () => {
    expect(nextStatutAfterEmailSent('a_qualifier')).toBe('contacte')
  })

  it('qualifie → contacte (1er contact)', () => {
    expect(nextStatutAfterEmailSent('qualifie')).toBe('contacte')
  })

  it('maquette_prete → contacte (1er contact)', () => {
    expect(nextStatutAfterEmailSent('maquette_prete')).toBe('contacte')
  })

  it('contacte → relance_1 (2e envoi)', () => {
    expect(nextStatutAfterEmailSent('contacte')).toBe('relance_1')
  })

  it('relance_1 → relance_2', () => {
    expect(nextStatutAfterEmailSent('relance_1')).toBe('relance_2')
  })

  it('relance_2 → relance_3', () => {
    expect(nextStatutAfterEmailSent('relance_2')).toBe('relance_3')
  })

  it('relance_3 → null (plafond, décision manuelle)', () => {
    expect(nextStatutAfterEmailSent('relance_3')).toBeNull()
  })

  it.each<ProspectStatut>([
    'repondu',
    'rdv_pris',
    'devis_envoye',
    'signe',
    'perdu',
    'ecarte',
  ])('%s → null (pas de régression d\'un statut avancé)', (s) => {
    expect(nextStatutAfterEmailSent(s)).toBeNull()
  })
})

describe('isTestEmailRecipient — détection domaine test', () => {
  const ORIGINAL_ENV = process.env.SIGWEB_TEST_EMAIL_DOMAINS

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) delete process.env.SIGWEB_TEST_EMAIL_DOMAINS
    else process.env.SIGWEB_TEST_EMAIL_DOMAINS = ORIGINAL_ENV
  })

  describe('défaut (env non définie) → sigweb.fr seul', () => {
    beforeEach(() => {
      delete process.env.SIGWEB_TEST_EMAIL_DOMAINS
    })

    it('contact@sigweb.fr → true', () => {
      expect(isTestEmailRecipient('contact@sigweb.fr')).toBe(true)
    })

    it('Casse différente → toujours true', () => {
      expect(isTestEmailRecipient('Sebastien@SIGWEB.FR')).toBe(true)
    })

    it('Vrai prospect non-sigweb → false', () => {
      expect(isTestEmailRecipient('client@boulangerie-pierre.fr')).toBe(false)
    })

    it('Email sans @ → false', () => {
      expect(isTestEmailRecipient('pas-un-email')).toBe(false)
    })

    it('Espaces autour → tolérés', () => {
      expect(isTestEmailRecipient('   contact@sigweb.fr  ')).toBe(true)
    })
  })

  describe('configurable via env CSV', () => {
    it('Multiples domaines séparés par virgules', () => {
      process.env.SIGWEB_TEST_EMAIL_DOMAINS = 'sigweb.fr,mailtest.com'
      expect(isTestEmailRecipient('a@sigweb.fr')).toBe(true)
      expect(isTestEmailRecipient('b@mailtest.com')).toBe(true)
      expect(isTestEmailRecipient('c@autre.com')).toBe(false)
    })

    it('Espaces autour des domaines dans la config → ignorés', () => {
      process.env.SIGWEB_TEST_EMAIL_DOMAINS = ' sigweb.fr ,  mailtest.com '
      expect(isTestEmailRecipient('a@sigweb.fr')).toBe(true)
      expect(isTestEmailRecipient('b@mailtest.com')).toBe(true)
    })

    it('Env vide → comportement par défaut (sigweb.fr seul)', () => {
      process.env.SIGWEB_TEST_EMAIL_DOMAINS = ''
      expect(isTestEmailRecipient('a@sigweb.fr')).toBe(true)
      expect(isTestEmailRecipient('b@autre.com')).toBe(false)
    })
  })
})
