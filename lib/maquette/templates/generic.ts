import { METIER_PRESETS, type MetierPreset } from '@/lib/maquette/presets/metiers'
import type { TemplateConfig } from '../types'
import { buildTemplate } from './_buildFromPreset'

/**
 * Construit un template depuis un preset métier. Les 11 champs `defaults`
 * (Hero / Histoire / CTA + 5 cartes univers) sont lus directement dans
 * `preset.defaults`. Aucune valeur narrative externe n'est passée à la
 * factory : le preset est la source de vérité unique par catégorie.
 *
 * Depuis l'intégration complète des annexes A → F du brief "Consolidation
 * finale", chaque preset porte ses valeurs spécifiques (plus de
 * `NEUTRAL_DEFAULTS` mutualisé). Les 4 templates Famille 2 (boulangerie,
 * boucherie, restaurant, pizzeria) sont importés depuis leurs fichiers
 * dédiés ; les 30 autres sont construits ici à partir de leur preset.
 */
function buildFromPreset(preset: MetierPreset): TemplateConfig {
  return buildTemplate({ preset })
}

// 14 templates V1 non Famille 2.

export const primeur      = buildFromPreset(METIER_PRESETS.primeur)
export const fromager     = buildFromPreset(METIER_PRESETS.fromager)
export const caviste      = buildFromPreset(METIER_PRESETS.caviste)
export const coiffeur     = buildFromPreset(METIER_PRESETS.coiffeur)
export const esthetique   = buildFromPreset(METIER_PRESETS.esthetique)
export const kine         = buildFromPreset(METIER_PRESETS.kine)
export const cabinet      = buildFromPreset(METIER_PRESETS.cabinet)
export const menuisier    = buildFromPreset(METIER_PRESETS.menuisier)
export const plombier     = buildFromPreset(METIER_PRESETS.plombier)
export const electricien  = buildFromPreset(METIER_PRESETS.electricien)
export const peintre      = buildFromPreset(METIER_PRESETS.peintre)
export const paysagiste   = buildFromPreset(METIER_PRESETS.paysagiste)
export const photographe  = buildFromPreset(METIER_PRESETS.photographe)
export const autre        = buildFromPreset(METIER_PRESETS.autre)

// 16 templates V2 — annexes du brief "Consolidation finale" toutes intégrées
// (Annexes A à F). Plus aucun stub, chacun porte ses valeurs spécifiques.

export const bar_cafe            = buildFromPreset(METIER_PRESETS.bar_cafe)
export const traiteur            = buildFromPreset(METIER_PRESETS.traiteur)
export const chocolatier         = buildFromPreset(METIER_PRESETS.chocolatier)
export const epicerie_fine       = buildFromPreset(METIER_PRESETS.epicerie_fine)
export const macon               = buildFromPreset(METIER_PRESETS.macon)
export const couvreur            = buildFromPreset(METIER_PRESETS.couvreur)
export const carreleur           = buildFromPreset(METIER_PRESETS.carreleur)
export const piscinier           = buildFromPreset(METIER_PRESETS.piscinier)
export const osteopathe          = buildFromPreset(METIER_PRESETS.osteopathe)
export const praticien_bien_etre = buildFromPreset(METIER_PRESETS.praticien_bien_etre)
export const fleuriste           = buildFromPreset(METIER_PRESETS.fleuriste)
export const bijoutier           = buildFromPreset(METIER_PRESETS.bijoutier)
export const librairie           = buildFromPreset(METIER_PRESETS.librairie)
export const garagiste           = buildFromPreset(METIER_PRESETS.garagiste)
export const gite                = buildFromPreset(METIER_PRESETS.gite)
export const camping             = buildFromPreset(METIER_PRESETS.camping)
