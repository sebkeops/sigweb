import type { ProspectCategorie } from '@/types'

/**
 * Variante de l'affiche selon l'état web du prospect.
 *   - 'sans-site' : pas de site (ou réseaux sociaux uniquement)
 *   - 'avec-site' : site existant (vrai site OU plateforme générique)
 */
export type AfficheVariant = 'sans-site' | 'avec-site'

/**
 * Données prêtes à injecter dans le rendu PDF.
 *
 * Construit côté serveur depuis un Prospect par `buildAfficheData()`.
 * Toutes les substitutions textuelles (variante, fallbacks données
 * Google manquantes, libellé catégorie) sont déjà résolues — le composant
 * de rendu n'a plus qu'à mettre en page.
 *
 * Les chaînes peuvent contenir :
 *   - `*mot*`  → italique (couleur d'accent)
 *   - `**mot**` → gras (couleur ink)
 * Le rendu PDF (Phase 3) parse ces marqueurs.
 */
export interface AfficheData {
  variant: AfficheVariant
  prospect: {
    nomCommerce: string
    /** Libellé humanisé pour insertion dans les phrases : "boulangerie", "restaurant"... */
    categorieLabel: string
    ville: string | null
  }

  /** Header (zone 1) — eyebrow contextuel à droite, sur 2 lignes. */
  headerEyebrow: { line1: string; line2: string }

  /** Hero (zone 2). */
  hero: {
    eyebrow: string       // "Nom commerce · Ville"
    title: string         // peut contenir *italique*
    photoUrl: string | null   // null = placeholder dégradé
  }

  /** Pitch (zone 3). */
  pitch: {
    eyebrow: string
    title: string         // peut contenir *italique*, peut avoir un `\n`
    text: string          // peut contenir **gras**
  }

  /** Bénéfices (zone 4). 4 items exactement. */
  benefits: string[]      // peut contenir **gras**

  /** CTA QR (zone 5). */
  cta: {
    title: string         // peut contenir *italique*
    description: string
    urlDisplay: string    // version texte courte affichée sous le titre
    qrDataUrl: string     // dataURL PNG du QR code
    qrTargetUrl: string   // URL réelle encodée dans le QR (debug/log)
  }

  /** Footer (zone 6). */
  footer: {
    contactName: string
    contactRole: string         // ex: "SIGWEB · Ségoufielle, Gers"
    phoneDisplay: string
    phoneHref: string           // tel: URI
    email: string
    siteDisplay: string         // ex: "sigweb.fr"
    logoUrl: string             // logo SIGWEB (utilisé dans le HeaderBand)
    avatarUrl: string           // photo de Sébastien (utilisée en avatar rond dans la signature footer)
  }
}

/**
 * Catégories CRM acceptées par le générateur d'affiche.
 * Pour les catégories Famille 2, on a un libellé humanisé soigné. Pour les
 * autres, fallback sur le libellé CRM brut (minuscules).
 */
export type AfficheCategorie = ProspectCategorie
