import { stripItalicMarkers } from '@/lib/maquette/render/parseItalicMarkers'
import { formatTelHref } from '@/lib/maquette/render/palette'
import type { Prospect } from '@/types'
import styles from '../styles.module.css'

interface Props {
  prospect: Prospect
  brandTagline: string
}

const currentYear = () => new Date().getFullYear()

export default function Footer({ prospect, brandTagline }: Props) {
  const tel = formatTelHref(prospect.telephone)
  const cleanName = stripItalicMarkers(prospect.nom_commerce)
  const addressLine = [prospect.adresse, prospect.ville].filter(Boolean).join(' · ')

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
            {tel && <li><a href={`tel:${tel}`}>{prospect.telephone}</a></li>}
            {prospect.email && <li><a href={`mailto:${prospect.email}`}>{prospect.email}</a></li>}
            {addressLine && <li><a href="#infos">{addressLine}</a></li>}
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
