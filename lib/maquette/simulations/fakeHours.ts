import type { ProspectCategorie, GoogleOpeningHours } from '@/types'

/**
 * Profils d'horaires standards par catégorie de commerce.
 *
 * Sortie : structure `GoogleOpeningHours` (Google Places API v1 — celle
 * stockée dans `prospect.google_opening_hours` côté CRM, lue par
 * `Infos.tsx` qui n'utilise que le champ `weekdayDescriptions`).
 *
 * Pour les simulations, c'est `weekdayDescriptions` qui compte (la chaîne
 * "Lundi: 6:30 - 19:30" affichée telle quelle dans la page Infos).
 *
 * Pas de PRNG ici — ces profils sont strictement statiques par catégorie
 * (un boulanger ouvre toujours le matin tôt, un restaurant ouvre midi/soir,
 * etc.). Stabilité = crédibilité.
 */

/**
 * Helper qui construit un `weekdayDescriptions[]` au format Google Places :
 * `["Lundi: 06:30 – 19:30", "Mardi: ...", ...]` dans l'ordre lun→dim.
 *
 * `null` = fermé ce jour, sera rendu "Lundi: Fermé".
 */
function buildWeekdayDescriptions(
  schedule: readonly (readonly [
    /** Heures d'ouverture, ex: "06:30 – 19:30" ou "12:00 – 14:00 / 19:00 – 22:30". */
    string | null,
  ])[]
): string[] {
  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
  return jours.map((jour, i) => {
    const horaires = schedule[i]?.[0]
    return horaires === null || horaires === undefined
      ? `${jour}: Fermé`
      : `${jour}: ${horaires}`
  })
}

/**
 * Profil "commerce du quotidien" — typique boulangerie / boucherie /
 * primeur / fromager : ouverture matin tôt, fermé un jour en semaine
 * (souvent lundi), demi-journée le dimanche.
 */
function profilBoulanger(): GoogleOpeningHours {
  return {
    weekdayDescriptions: buildWeekdayDescriptions([
      [null],
      ['06:30 – 19:30'],
      ['06:30 – 19:30'],
      ['06:30 – 19:30'],
      ['06:30 – 19:30'],
      ['06:30 – 19:00'],
      ['07:00 – 13:00'],
    ]),
  }
}

/** Boucherie / fromager / primeur — fermé dim ap-midi + lundi. */
function profilBoucher(): GoogleOpeningHours {
  return {
    weekdayDescriptions: buildWeekdayDescriptions([
      [null],
      ['08:30 – 12:30 / 15:30 – 19:00'],
      ['08:30 – 12:30 / 15:30 – 19:00'],
      ['08:30 – 12:30 / 15:30 – 19:00'],
      ['08:30 – 12:30 / 15:30 – 19:00'],
      ['08:30 – 19:00'],
      ['08:30 – 13:00'],
    ]),
  }
}

/** Restaurant — fermé dim+lundi, service midi/soir mardi à samedi. */
function profilRestaurant(): GoogleOpeningHours {
  return {
    weekdayDescriptions: buildWeekdayDescriptions([
      [null],
      ['12:00 – 14:00 / 19:00 – 22:30'],
      ['12:00 – 14:00 / 19:00 – 22:30'],
      ['12:00 – 14:00 / 19:00 – 22:30'],
      ['12:00 – 14:00 / 19:00 – 22:30'],
      ['12:00 – 14:00 / 19:00 – 23:00'],
      [null],
    ]),
  }
}

/** Pizzeria — souvent ouverte aussi le dimanche soir. */
function profilPizzeria(): GoogleOpeningHours {
  return {
    weekdayDescriptions: buildWeekdayDescriptions([
      [null],
      ['18:30 – 22:30'],
      ['18:30 – 22:30'],
      ['18:30 – 22:30'],
      ['12:00 – 14:00 / 18:30 – 23:00'],
      ['12:00 – 14:00 / 18:30 – 23:00'],
      ['18:30 – 22:30'],
    ]),
  }
}

/** Bar / café — large amplitude, ouvert tous les jours. */
function profilBarCafe(): GoogleOpeningHours {
  return {
    weekdayDescriptions: buildWeekdayDescriptions([
      ['07:00 – 19:00'],
      ['07:00 – 19:00'],
      ['07:00 – 19:00'],
      ['07:00 – 22:00'],
      ['07:00 – 23:00'],
      ['08:00 – 23:00'],
      ['08:30 – 13:00'],
    ]),
  }
}

/** Coiffeur / esthétique — fermé lundi + dimanche, journée continue. */
function profilCoiffeur(): GoogleOpeningHours {
  return {
    weekdayDescriptions: buildWeekdayDescriptions([
      [null],
      ['09:00 – 19:00'],
      ['09:00 – 19:00'],
      ['09:00 – 19:00'],
      ['09:00 – 19:00'],
      ['09:00 – 18:00'],
      [null],
    ]),
  }
}

/** Praticien santé / bien-être — sur RDV, fermé week-end. */
function profilPraticien(): GoogleOpeningHours {
  return {
    weekdayDescriptions: buildWeekdayDescriptions([
      ['08:30 – 12:30 / 14:00 – 19:00'],
      ['08:30 – 12:30 / 14:00 – 19:00'],
      ['08:30 – 12:30 / 14:00 – 19:00'],
      ['08:30 – 12:30 / 14:00 – 19:00'],
      ['08:30 – 12:30 / 14:00 – 18:00'],
      ['09:00 – 13:00'],
      [null],
    ]),
  }
}

/** Artisan bâtiment — lundi-vendredi 8-18 avec pause déjeuner, urgences 24/7. */
function profilArtisanBatiment(): GoogleOpeningHours {
  return {
    weekdayDescriptions: buildWeekdayDescriptions([
      ['08:00 – 12:00 / 14:00 – 18:00'],
      ['08:00 – 12:00 / 14:00 – 18:00'],
      ['08:00 – 12:00 / 14:00 – 18:00'],
      ['08:00 – 12:00 / 14:00 – 18:00'],
      ['08:00 – 12:00 / 14:00 – 17:00'],
      [null],
      [null],
    ]),
  }
}

/** Commerce généraliste — fleuriste, librairie, bijoutier — fermé dimanche. */
function profilCommerce(): GoogleOpeningHours {
  return {
    weekdayDescriptions: buildWeekdayDescriptions([
      [null],
      ['09:30 – 12:30 / 14:30 – 19:00'],
      ['09:30 – 12:30 / 14:30 – 19:00'],
      ['09:30 – 12:30 / 14:30 – 19:00'],
      ['09:30 – 12:30 / 14:30 – 19:00'],
      ['09:30 – 19:00'],
      [null],
    ]),
  }
}

/** Photographe — sur RDV, amplitudes plus larges en weekend (cérémonies). */
function profilPhotographe(): GoogleOpeningHours {
  return {
    weekdayDescriptions: buildWeekdayDescriptions([
      ['Sur rendez-vous'],
      ['Sur rendez-vous'],
      ['Sur rendez-vous'],
      ['Sur rendez-vous'],
      ['Sur rendez-vous'],
      ['Sur rendez-vous'],
      ['Sur rendez-vous'],
    ]),
  }
}

/** Garagiste — lundi-vendredi + samedi matin. */
function profilGaragiste(): GoogleOpeningHours {
  return {
    weekdayDescriptions: buildWeekdayDescriptions([
      ['08:00 – 12:00 / 14:00 – 18:00'],
      ['08:00 – 12:00 / 14:00 – 18:00'],
      ['08:00 – 12:00 / 14:00 – 18:00'],
      ['08:00 – 12:00 / 14:00 – 18:00'],
      ['08:00 – 12:00 / 14:00 – 17:30'],
      ['09:00 – 12:00'],
      [null],
    ]),
  }
}

/** Hébergement — check-in/out plutôt qu'horaires d'ouverture. */
function profilHebergement(): GoogleOpeningHours {
  return {
    weekdayDescriptions: buildWeekdayDescriptions([
      ['Check-in 15:00 – 19:00 · Check-out avant 11:00'],
      ['Check-in 15:00 – 19:00 · Check-out avant 11:00'],
      ['Check-in 15:00 – 19:00 · Check-out avant 11:00'],
      ['Check-in 15:00 – 19:00 · Check-out avant 11:00'],
      ['Check-in 15:00 – 19:00 · Check-out avant 11:00'],
      ['Check-in 15:00 – 19:00 · Check-out avant 11:00'],
      ['Check-in 15:00 – 19:00 · Check-out avant 11:00'],
    ]),
  }
}

/** Cabinet — généraliste praticien. */
function profilCabinet(): GoogleOpeningHours {
  return {
    weekdayDescriptions: buildWeekdayDescriptions([
      ['09:00 – 12:00 / 14:00 – 19:00'],
      ['09:00 – 12:00 / 14:00 – 19:00'],
      ['09:00 – 12:00 / 14:00 – 19:00'],
      ['09:00 – 12:00 / 14:00 – 19:00'],
      ['09:00 – 12:00 / 14:00 – 18:00'],
      ['09:00 – 13:00'],
      [null],
    ]),
  }
}

/**
 * Mapping catégorie → profil horaires. Couvre les 34 catégories.
 * Chaque profil est instancié à chaque appel (les structures retournées
 * sont libres de mutation côté caller mais on n'en a pas besoin).
 */
export const HOURS_PROFILES_BY_CATEGORIE: Record<ProspectCategorie, () => GoogleOpeningHours> = {
  // Famille bouche — variantes selon métier
  boulangerie:    profilBoulanger,
  boucherie:      profilBoucher,
  restaurant:     profilRestaurant,
  pizzeria:       profilPizzeria,
  primeur:        profilBoucher,
  fromager:       profilBoucher,
  caviste:        profilCommerce,
  bar_cafe:       profilBarCafe,
  traiteur:       profilBoucher,
  chocolatier:    profilCommerce,
  epicerie_fine:  profilCommerce,

  // Famille services à la personne
  coiffeur:             profilCoiffeur,
  esthetique:           profilCoiffeur,
  kine:                 profilPraticien,
  osteopathe:           profilPraticien,
  praticien_bien_etre:  profilPraticien,
  cabinet:              profilCabinet,

  // Famille bâtiment & artisanat
  menuisier:    profilArtisanBatiment,
  plombier:     profilArtisanBatiment,
  electricien:  profilArtisanBatiment,
  peintre:      profilArtisanBatiment,
  paysagiste:   profilArtisanBatiment,
  macon:        profilArtisanBatiment,
  couvreur:     profilArtisanBatiment,
  carreleur:    profilArtisanBatiment,
  piscinier:    profilArtisanBatiment,

  // Famille commerces & services
  photographe:  profilPhotographe,
  fleuriste:    profilCommerce,
  bijoutier:    profilCommerce,
  librairie:    profilCommerce,
  garagiste:    profilGaragiste,

  // Famille hébergement
  gite:     profilHebergement,
  camping:  profilHebergement,

  // Fallback
  autre: profilCommerce,
}

/**
 * Génère un objet `GoogleOpeningHours` pour la catégorie demandée.
 * Pas de PRNG : déterministe pour conserver la crédibilité métier.
 */
export function generateFakeHours(categoryId: ProspectCategorie): GoogleOpeningHours {
  const profile = HOURS_PROFILES_BY_CATEGORIE[categoryId] ?? profilCommerce
  return profile()
}
