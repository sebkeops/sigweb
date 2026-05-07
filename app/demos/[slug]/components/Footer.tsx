import { stripItalicMarkers } from '@/lib/maquette/render/parseItalicMarkers'
import { formatTelHref } from '@/lib/maquette/render/palette'
import { resolveInfos } from '@/lib/maquette/render/resolveInfos'
import type { MaquetteInfosOverrides, Prospect } from '@/types'
import styles from '../styles.module.css'

interface Props {
  prospect: Prospect
  brandTagline: string
  overrides: MaquetteInfosOverrides | null
}

const currentYear = () => new Date().getFullYear()

export default function Footer({ prospect, brandTagline, overrides }: Props) {
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
            {brandTagline}
            {prospect.ville ? ` · ${prospect.ville}` : ''}.
          </p>
        </div>
        <div className={styles.footerCol}>
          <h4>Le commerce</h4>
          <ul className={styles.footerList}>
            <li><a href="#histoire">La maison</a></li>
            <li><a href="#univers">Nos créations</a></li>
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
