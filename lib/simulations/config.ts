// ── Thèmes visuels par famille ────────────────────────────────────────────────

export interface ThemeVars {
  primary: string
  primaryDark: string
  primaryLight: string
  bg: string
  heroBgColor: string
}

export const themes: Record<string, ThemeVars> = {
  'artisan-boulangerie': {
    primary: '#b85c2a',
    primaryDark: '#8f4520',
    primaryLight: '#f5e8db',
    bg: '#f8f4ee',
    heroBgColor: '#7a4020',
  },
  'artisan-pizzeria': {
    primary: '#c0392b',
    primaryDark: '#922b21',
    primaryLight: '#fdecea',
    bg: '#fdf6f0',
    heroBgColor: '#5a1a10',
  },
  'artisan-boucherie': {
    primary: '#8b2635',
    primaryDark: '#6b1c28',
    primaryLight: '#fce8ec',
    bg: '#fdf4f5',
    heroBgColor: '#4a1020',
  },
  'artisan-coiffure': {
    primary: '#2d6a4f',
    primaryDark: '#1b4332',
    primaryLight: '#e8f5ee',
    bg: '#f0f7f4',
    heroBgColor: '#1a3a2a',
  },
}

// ── Config textuelle par type de commerce ─────────────────────────────────────

export interface BusinessConfig {
  cardsLabel: string
  cardsTitle: string
  cardsSectionId: string
  galleryLabel: string
  heroCta1: string
  heroCta2: string
  ctaTitle: string
  ctaSubtitle: string
}

export const businessConfigs: Record<string, BusinessConfig> = {
  boulangerie: {
    cardsLabel: 'Nos produits',
    cardsTitle: 'Ce qui fait notre réputation',
    cardsSectionId: 'produits',
    galleryLabel: 'Notre boulangerie',
    heroCta1: 'Découvrir nos produits',
    heroCta2: '📞 Nous appeler',
    ctaTitle: 'Une question ? Passez nous voir.',
    ctaSubtitle: 'Ouvert du mardi au dimanche.',
  },
  pizzeria: {
    cardsLabel: 'Nos pizzas',
    cardsTitle: 'Les incontournables de la carte',
    cardsSectionId: 'carte',
    galleryLabel: 'Notre pizzeria',
    heroCta1: 'Voir la carte',
    heroCta2: '📞 Commander',
    ctaTitle: "Envie d'une pizza ? Appelez-nous.",
    ctaSubtitle: 'Sur place ou à emporter, du mardi au dimanche.',
  },
  boucherie: {
    cardsLabel: 'Nos produits',
    cardsTitle: 'Ce qui fait notre réputation',
    cardsSectionId: 'produits',
    galleryLabel: 'Notre boucherie',
    heroCta1: 'Découvrir nos produits',
    heroCta2: '📞 Nous appeler',
    ctaTitle: 'Une question ? Passez nous voir.',
    ctaSubtitle: 'Ouvert du mardi au dimanche.',
  },
  'salon-coiffure': {
    cardsLabel: 'Nos prestations',
    cardsTitle: 'Ce que nous vous proposons',
    cardsSectionId: 'prestations',
    galleryLabel: 'Notre salon',
    heroCta1: 'Nos prestations',
    heroCta2: '📞 Prendre rendez-vous',
    ctaTitle: 'Envie de changer de tête ?',
    ctaSubtitle: 'Prenez rendez-vous du mardi au samedi.',
  },
}

export const fallbackConfig: BusinessConfig = {
  cardsLabel: 'Nos produits',
  cardsTitle: 'Ce qui fait notre réputation',
  cardsSectionId: 'produits',
  galleryLabel: 'Notre boutique',
  heroCta1: 'Découvrir',
  heroCta2: '📞 Nous appeler',
  ctaTitle: 'Une question ? Contactez-nous.',
  ctaSubtitle: '',
}
