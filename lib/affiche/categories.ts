import type { ProspectCategorie } from '@/types'

/**
 * Libellé humanisé d'une catégorie pour insertion dans les phrases de
 * l'affiche : "Et si votre {boulangerie} avait enfin son site ?"
 *
 * On utilise des minuscules systématiques car le terme est toujours
 * inséré au milieu d'une phrase. Les catégories Famille 2 ont un libellé
 * dédié validé éditorialement, les autres tombent sur la valeur enum
 * brute (qui est déjà en minuscules dans `ProspectCategorie`).
 *
 * Cas particuliers :
 *   - 'autre' → fallback générique "commerce"
 *   - 'cabinet' → "cabinet" (médical / dentaire)
 */
const CATEGORIE_LABELS_AFFICHE: Record<ProspectCategorie, string> = {
  // V1
  boulangerie:  'boulangerie',
  boucherie:    'boucherie',
  restaurant:   'restaurant',
  pizzeria:     'pizzeria',
  primeur:      'épicerie',
  fromager:     'fromagerie',
  caviste:      'cave',
  coiffeur:     'salon',
  esthetique:   'institut',
  kine:         'cabinet',
  cabinet:      'cabinet',
  menuisier:    'atelier',
  plombier:     'entreprise',
  electricien:  'entreprise',
  peintre:      'entreprise',
  paysagiste:   'entreprise',
  photographe:  'studio',
  // V2 — affiche-friendly (stubs ; à affiner si nécessaire après les annexes)
  bar_cafe:            'établissement',
  traiteur:            'traiteur',
  chocolatier:         'chocolaterie',
  epicerie_fine:       'épicerie fine',
  macon:               'entreprise',
  couvreur:            'entreprise',
  carreleur:           'entreprise',
  piscinier:           'entreprise',
  osteopathe:          'cabinet',
  praticien_bien_etre: 'cabinet',
  fleuriste:           'boutique',
  bijoutier:           'boutique',
  librairie:           'librairie',
  garagiste:           'garage',
  gite:                'gîte',
  camping:             'camping',
  // Fallback
  autre:        'commerce',
}

export function getCategorieLabel(categorie: ProspectCategorie): string {
  return CATEGORIE_LABELS_AFFICHE[categorie] ?? 'commerce'
}
