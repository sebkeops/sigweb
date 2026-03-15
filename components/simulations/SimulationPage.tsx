import type { SimulationData } from '@/types'

// ── Thème par famille ─────────────────────────────────────────────────────────
interface ThemeVars {
  primary: string
  primaryDark: string
  primaryLight: string
  bg: string
  heroBgColor: string
}

const themes: Record<string, ThemeVars> = {
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

// ── Config textuelle par type ─────────────────────────────────────────────────
interface BusinessConfig {
  cardsLabel: string
  cardsTitle: string
  cardsSectionId: string
  galleryLabel: string
  heroCta1: string
  heroCta2: string
  ctaTitle: string
  ctaSubtitle: string
}

const businessConfigs: Record<string, BusinessConfig> = {
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

const fallbackConfig: BusinessConfig = {
  cardsLabel: 'Nos produits',
  cardsTitle: 'Ce qui fait notre réputation',
  cardsSectionId: 'produits',
  galleryLabel: 'Notre boutique',
  heroCta1: 'Découvrir',
  heroCta2: '📞 Nous appeler',
  ctaTitle: 'Une question ? Contactez-nous.',
  ctaSubtitle: '',
}

// ── Composant ─────────────────────────────────────────────────────────────────
interface Props {
  data: SimulationData
}

export default function SimulationPage({ data }: Props) {
  const theme = themes[data.theme] ?? themes['artisan-boulangerie']
  const config = businessConfigs[data.businessType] ?? fallbackConfig
  const phoneRaw = data.contact.phone.replace(/\s+/g, '')

  const cssVars = {
    '--primary': theme.primary,
    '--primary-dark': theme.primaryDark,
    '--primary-light': theme.primaryLight,
    '--bg': theme.bg,
    '--hero-bg-color': theme.heroBgColor,
    '--text': '#1e1e1e',
    '--muted': '#6b6358',
    '--surface': '#ffffff',
    '--border': '#e2d9ce',
    '--radius': '12px',
    '--shadow-sm': '0 2px 10px rgba(0,0,0,0.08)',
    '--shadow': '0 6px 24px rgba(0,0,0,0.12)',
  } as React.CSSProperties

  return (
    <>
      <div className="border-b border-border bg-surface">
        <div className="container-wide px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {data.intro && (
              <p className="font-body text-sm text-muted">
                <span className="font-semibold text-ink">Simulation SIGWEB — </span>
                {data.intro}
              </p>
            )}
            <div className="flex shrink-0 flex-wrap gap-3">
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-sm border border-border bg-white px-4 py-2 font-body text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
              >
                ← Accueil
              </a>
              <a
                href="/simulations"
                className="inline-flex items-center justify-center rounded-sm bg-primary px-4 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Voir toutes les simulations
              </a>
            </div>
          </div>
        </div>
      </div>
      <div id="sim" style={cssVars}>

      {/* BADGE SIGWEB */}
      <div className="sim-badge">Simulation réalisée par Sigweb</div>

      {/* HEADER */}
      <header className="sim-header">
        <div className="sim-container">
          <div className="sim-header-inner">
            <span className="sim-site-name">{data.name}</span>
            <a href={`tel:${phoneRaw}`} className="sim-header-phone">
              📞 {data.contact.phone}
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="sim-hero">
        <div
          className="sim-hero-bg"
          style={{ backgroundImage: `url('${data.heroImage}')` }}
        />
        <div className="sim-hero-body">
          <div className="sim-container">
            <span className="sim-hero-label">{data.tagline}</span>
            <h1>{data.name}</h1>
            <p className="sim-hero-desc">{data.description}</p>
            <div className="sim-hero-actions">
              <a href={`#${config.cardsSectionId}`} className="sim-btn-primary">
                {config.heroCta1}
              </a>
              <a href={`tel:${phoneRaw}`} className="sim-btn-ghost">
                {config.heroCta2}
              </a>
            </div>
          </div>
        </div>
        <div className="sim-hero-strip">
          <div className="sim-container">
            <div className="sim-hero-strip-inner">
              <div className="sim-hero-strip-item">
                📍 <span>{data.contact.address}, {data.contact.city}</span>
              </div>
              <div className="sim-hero-strip-item">
                📞 <a href={`tel:${phoneRaw}`}>{data.contact.phone}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="sim-about">
        <div className="sim-container">
          <div className="sim-about-inner">
            <span className="sim-section-label">Qui sommes-nous</span>
            <h2 className="sim-section-title">{data.name}</h2>
            <p className="sim-about-desc">{data.description}</p>
            <div className="sim-highlights-row">
              {data.highlights.map((h) => (
                <span key={h} className="sim-highlight-pill">{h}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED CARDS */}
      <section className="sim-cards" id={config.cardsSectionId}>
        <div className="sim-container">
          <div className="sim-section-header">
            <span className="sim-section-label">{config.cardsLabel}</span>
            <h2 className="sim-section-title">{config.cardsTitle}</h2>
          </div>
          <div className="sim-cards-grid">
            {data.featuredCards.map((card) => (
              <div key={card.title} className="sim-card">
                <div className="sim-card-img-wrap">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="sim-card-img"
                    loading="lazy"
                  />
                </div>
                <div className="sim-card-body">
                  <h3 className="sim-card-title">{card.title}</h3>
                  <p className="sim-card-text">{card.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="sim-gallery">
        <div className="sim-container">
          <div className="sim-section-header">
            <span className="sim-section-label">{config.galleryLabel}</span>
            <h2 className="sim-section-title">Un aperçu de notre univers</h2>
          </div>
          <div className="sim-gallery-grid">
            {data.gallery.map((url, i) => (
              <div key={i} className="sim-gallery-item">
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="sim-gallery-img"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="sim-reviews">
        <div className="sim-container">
          <div className="sim-section-header">
            <span className="sim-section-label">Avis clients</span>
            <h2 className="sim-section-title">Ce que disent nos clients</h2>
          </div>
          <div className="sim-reviews-grid">
            {data.reviews.map((review, i) => (
              <div key={i} className="sim-review-card">
                <span className="sim-review-quote">&ldquo;</span>
                <p className="sim-review-text">{review}</p>
                <div className="sim-review-stars">★★★★★</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INFOS PRATIQUES */}
      <section className="sim-info">
        <div className="sim-container">
          <div className="sim-section-header">
            <span className="sim-section-label">Informations</span>
            <h2 className="sim-section-title">Infos pratiques</h2>
          </div>
          <div className="sim-info-grid">
            <div>
              <span className="sim-info-box-title">Horaires d&apos;ouverture</span>
              <ul className="sim-hours-list">
                {data.hours.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="sim-info-box-title">Nous trouver</span>
              <div className="sim-contact-rows">
                <div className="sim-contact-row">
                  <div className="sim-contact-icon">📍</div>
                  <div className="sim-contact-detail">
                    <span className="sim-contact-label">Adresse</span>
                    <span className="sim-contact-value">
                      {data.contact.address}<br />{data.contact.city}
                    </span>
                  </div>
                </div>
                <div className="sim-contact-row">
                  <div className="sim-contact-icon">📞</div>
                  <div className="sim-contact-detail">
                    <span className="sim-contact-label">Téléphone</span>
                    <span className="sim-contact-value">
                      <a href={`tel:${phoneRaw}`}>{data.contact.phone}</a>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="sim-cta">
        <div className="sim-container">
          <h2>{config.ctaTitle}</h2>
          <p>
            {data.contact.address} — {data.contact.city}<br />
            {config.ctaSubtitle}
          </p>
          <a href={`tel:${phoneRaw}`} className="sim-btn-white">
            📞 {data.contact.phone}
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="sim-footer">
        <p>
          &copy; {data.name} — {data.contact.address}, {data.contact.city}
        </p>
      </footer>
    </div>
    </>
  )
}
