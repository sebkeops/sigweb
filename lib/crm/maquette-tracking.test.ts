import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  extractClientIp,
  hashIp,
  normalizeReferrer,
  parseSource,
  parseUserAgent,
  VISIT_UPSERT_WINDOW_MS,
} from './maquette-tracking'

describe('hashIp — RGPD-friendly', () => {
  const ORIGINAL_SALT = process.env.SIGWEB_VISIT_HASH_SALT

  afterEach(() => {
    if (ORIGINAL_SALT === undefined) delete process.env.SIGWEB_VISIT_HASH_SALT
    else process.env.SIGWEB_VISIT_HASH_SALT = ORIGINAL_SALT
  })

  it('produit un hash hexa de 16 chars', () => {
    const h = hashIp('192.168.1.1')
    expect(h).toMatch(/^[0-9a-f]{16}$/)
  })

  it('meme IP → meme hash (determinisme)', () => {
    expect(hashIp('192.168.1.1')).toBe(hashIp('192.168.1.1'))
  })

  it('IPs differentes → hashs differents', () => {
    expect(hashIp('192.168.1.1')).not.toBe(hashIp('192.168.1.2'))
  })

  it('salt change le hash', () => {
    delete process.env.SIGWEB_VISIT_HASH_SALT
    const fallback = hashIp('192.168.1.1')
    process.env.SIGWEB_VISIT_HASH_SALT = 'autre-salt'
    const custom = hashIp('192.168.1.1')
    expect(fallback).not.toBe(custom)
  })

  it('IP "unknown" donne toujours le meme hash (cas degenere)', () => {
    expect(hashIp('unknown')).toBe(hashIp('unknown'))
  })
})

describe('parseUserAgent — categorisation mobile/desktop/tablet', () => {
  it('iPhone → mobile', () => {
    expect(parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15')).toBe('mobile')
  })

  it('Android Mobile → mobile', () => {
    expect(parseUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7) Mobile')).toBe('mobile')
  })

  it('iPad → tablet', () => {
    expect(parseUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0)')).toBe('tablet')
  })

  it('Android sans "Mobile" → tablet (tablette Android)', () => {
    expect(parseUserAgent('Mozilla/5.0 (Linux; Android 13; SM-T870)')).toBe('tablet')
  })

  it('Chrome desktop → desktop', () => {
    expect(parseUserAgent('Mozilla/5.0 (Windows NT 10.0) Chrome/120.0')).toBe('desktop')
  })

  it('Safari macOS → desktop', () => {
    expect(parseUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605')).toBe('desktop')
  })

  it('null / vide / espaces → null', () => {
    expect(parseUserAgent(null)).toBeNull()
    expect(parseUserAgent(undefined)).toBeNull()
    expect(parseUserAgent('')).toBeNull()
    expect(parseUserAgent('   ')).toBeNull()
  })
})

describe('parseSource — whitelist stricte', () => {
  it('valeurs whitelistees passent telles quelles', () => {
    expect(parseSource('affiche')).toBe('affiche')
    expect(parseSource('email')).toBe('email')
    expect(parseSource('email-test')).toBe('email-test')
    expect(parseSource('carte')).toBe('carte')
    expect(parseSource('direct')).toBe('direct')
  })

  it('email-test (envoi test) distingue de email (envoi reel)', () => {
    expect(parseSource('email-test')).toBe('email-test')
    expect(parseSource('email')).toBe('email')
    expect(parseSource('email-test')).not.toBe(parseSource('email'))
  })

  it('casse mixte normalisee', () => {
    expect(parseSource('AFFICHE')).toBe('affiche')
    expect(parseSource('Email')).toBe('email')
  })

  it('espaces autour tolérés', () => {
    expect(parseSource('  affiche  ')).toBe('affiche')
  })

  it('null / undefined → direct', () => {
    expect(parseSource(null)).toBe('direct')
    expect(parseSource(undefined)).toBe('direct')
    expect(parseSource('')).toBe('direct')
  })

  it('valeur inconnue → other (pas d\'erreur, on normalise)', () => {
    expect(parseSource('facebook')).toBe('other')
    expect(parseSource('linkedin')).toBe('other')
    expect(parseSource('xxx')).toBe('other')
  })

  it('"other" en entree → "other" en sortie (idempotent)', () => {
    expect(parseSource('other')).toBe('other')
  })
})

describe('extractClientIp', () => {
  it('prend la 1ere IP de x-forwarded-for', () => {
    const headers = new Headers({
      'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
    })
    expect(extractClientIp(headers)).toBe('192.168.1.1')
  })

  it('fallback sur x-real-ip si pas de x-forwarded-for', () => {
    const headers = new Headers({ 'x-real-ip': '10.0.0.5' })
    expect(extractClientIp(headers)).toBe('10.0.0.5')
  })

  it('"unknown" si aucun header', () => {
    expect(extractClientIp(new Headers())).toBe('unknown')
  })

  it('IPv6 acceptee', () => {
    const headers = new Headers({ 'x-forwarded-for': '2001:db8::1' })
    expect(extractClientIp(headers)).toBe('2001:db8::1')
  })

  it('espaces dans x-forwarded-for tolérés', () => {
    const headers = new Headers({ 'x-forwarded-for': '  192.168.1.1  ' })
    expect(extractClientIp(headers)).toBe('192.168.1.1')
  })
})

describe('normalizeReferrer', () => {
  it('null / vide → null', () => {
    expect(normalizeReferrer(null)).toBeNull()
    expect(normalizeReferrer(undefined)).toBeNull()
    expect(normalizeReferrer('')).toBeNull()
    expect(normalizeReferrer('   ')).toBeNull()
  })

  it('tronque a 500 chars', () => {
    const long = 'https://example.com/' + 'a'.repeat(1000)
    const normalized = normalizeReferrer(long)
    expect(normalized).not.toBeNull()
    expect(normalized!.length).toBe(500)
  })

  it('preserve les referrers courts', () => {
    expect(normalizeReferrer('https://mail.google.com/')).toBe('https://mail.google.com/')
  })
})

describe('VISIT_UPSERT_WINDOW_MS', () => {
  it('fenetre = 30 minutes', () => {
    expect(VISIT_UPSERT_WINDOW_MS).toBe(30 * 60 * 1000)
  })
})
