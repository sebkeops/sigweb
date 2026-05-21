import { stripItalicMarkers } from '@/lib/maquette/render/parseItalicMarkers'
import { formatTelHref } from '@/lib/maquette/render/palette'
import { resolveInfos } from '@/lib/maquette/render/resolveInfos'
import type { Maquette, MaquetteInfosOverrides, Prospect } from '@/types'
import styles from '../styles.module.css'

interface Props {
  prospect: Prospect
  /**
   * `brand_tagline`, `nav_*_label` et `footer_colonne_label` sont lus
   * directement depuis cet objet ; le `_default*` suivant sert de fallback
   * si la valeur en BDD est NULL (maquette pré-migration).
   */
  maquette: Maquette
  /** Tagline par défaut depuis le template. */
  defaultBrandTagline: string
  /** Labels de nav par défaut depuis le template. */
  defaultNavHistoireLabel: string
  defaultNavUniversLabel: string
  /** Label H4 de la colonne d'ancrage par défaut depuis le template. */
  defaultFooterColonneLabel: string
  overrides: MaquetteInfosOverrides | null
}

const currentYear = () => new Date().getFullYear()

export default function Footer({
  prospect,
  maquette,
  defaultBrandTagline,
  defaultNavHistoireLabel,
  defaultNavUniversLabel,
  defaultFooterColonneLabel,
  overrides,
}: Props) {
  const tagline = maquette.brand_tagline ?? defaultBrandTagline
  const navHistoire = maquette.nav_histoire_label ?? defaultNavHistoireLabel
  const navUnivers = maquette.nav_univers_label ?? defaultNavUniversLabel
  const colonneLabel = maquette.footer_colonne_label ?? defaultFooterColonneLabel
  const resolved = resolveInfos(prospect, overrides)
  const tel = formatTelHref(resolved.telephone)
  const cleanName = stripItalicMarkers(prospect.nom_commerce)
  // Ligne courte pour le footer (pas de retour à la ligne) : on prend la
  // première ligne de l'adresse résolue + ville si disponible.
  const addressShort = resolved.adresseLine
    ? resolved.adresseLine.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 2).join(' · ')
    : null

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <div className={styles.footerBrandName}>{cleanName}</div>
          <p className={styles.footerBrandText}>
            {tagline}
            {prospect.ville ? ` · ${prospect.ville}` : ''}.
          </p>
        </div>
        <div className={styles.footerCol}>
          <h4>{colonneLabel}</h4>
          <ul className={styles.footerList}>
            <li><a href="#histoire">{navHistoire}</a></li>
            <li><a href="#univers">{navUnivers}</a></li>
            <li><a href="#avis">Avis clients</a></li>
          </ul>
        </div>
        <div className={styles.footerCol}>
          <h4>Nous contacter</h4>
          <ul className={styles.footerList}>
            {tel && <li><a href={`tel:${tel}`}>{resolved.telephone}</a></li>}
            {resolved.email && <li><a href={`mailto:${resolved.email}`}>{resolved.email}</a></li>}
            {addressShort && <li><a href="#infos">{addressShort}</a></li>}
          </ul>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>© {currentYear()} {cleanName}{prospect.ville ? ` · ${prospect.ville}` : ''}</span>
        {/*
          Mention démo non éditable : c'est un garde-fou pour rappeler à
          tout visiteur que la page est une maquette de démonstration.
          Ne JAMAIS rendre ce label éditable depuis l'éditeur.
        */}
        <span className={styles.demoMention}>Maquette de démonstration · Sigweb</span>
      </div>
    </footer>
  )
}
