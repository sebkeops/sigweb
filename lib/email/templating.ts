import 'server-only'
import type { WebVariant } from '@/types'

/**
 * Moteur de templating minimaliste pour les emails de prospection.
 *
 * Fonctionnalités :
 *   - `interpolate(template, vars)` — remplace `{{var}}` par sa valeur
 *   - `applyHighlightFallback(template, variant, format)` — remplace le bloc
 *     highlight par un fallback générique si données Google manquantes
 *   - `applyPreviewBlock(html, url, nomCommerce)` — remplace le placeholder
 *     `<div class="preview-fake">…</div>` par un `<img>` cliquable
 *
 * Pas de logique conditionnelle inline (pas de `{{#if}}` etc.) — on garde
 * le templating volontairement simple. Les transformations structurelles
 * sont appliquées AVANT l'interpolation, sur le template raw.
 */

// ─── Fallback "données Google manquantes" ─────────────────────────────────
//
// Stocké en code (pas en BDD) pour ne pas alourdir le seed. Si le ton doit
// évoluer, on modifie ces constantes ; le HTML reste cohérent avec le style
// inline du body principal.

const HIGHLIGHT_FALLBACK_HTML: Record<WebVariant, string> = {
  'sans-site':
    `Quand vos clients cherchent une {{categorie}} sur leur téléphone, <em>ils ne tombent que sur votre fiche Google</em> — et beaucoup repartent sans avoir vu vos spécialités, vos horaires détaillés, ou pu commander à l'avance.`,
  'avec-site':
    `J'ai jeté un œil à votre site actuel — il a le mérite d'exister, mais je crois honnêtement qu'il ne rend pas justice à la qualité de votre {{categorie}} aujourd'hui.`,
}

const HIGHLIGHT_FALLBACK_TEXT: Record<WebVariant, string> = {
  'sans-site':
    `Quand vos clients cherchent une {{categorie}} sur leur téléphone, ils ne tombent que sur votre fiche Google — et beaucoup repartent sans avoir vu vos spécialités, vos horaires détaillés, ou pu commander à l'avance.`,
  'avec-site':
    `J'ai jeté un œil à votre site actuel — il a le mérite d'exister, mais je crois honnêtement qu'il ne rend pas justice à la qualité de votre {{categorie}} aujourd'hui.`,
}

/**
 * Si rating ou nb_avis manquant, swap le contenu du highlight par le fallback
 * générique. À appliquer AVANT `interpolate`.
 */
export function applyHighlightFallback(
  template: string,
  variant: WebVariant,
  format: 'html' | 'text'
): string {
  if (format === 'html') {
    // Match le bloc <div class="highlight-fact">…</div> non-greedy.
    return template.replace(
      /<div class="highlight-fact">[\s\S]*?<\/div>/,
      `<div class="highlight-fact">${HIGHLIGHT_FALLBACK_HTML[variant]}</div>`
    )
  }
  // Texte : la phrase highlight commence par "Avec {{nb_avis}} avis Google"
  // et se termine à la double newline (paragraphe suivant). Cible précise
  // qui survit aux variations mineures du seed.
  return template.replace(
    /Avec \{\{nb_avis\}\}[\s\S]*?(\r?\n\r?\n)/,
    `${HIGHLIGHT_FALLBACK_TEXT[variant]}\n\n`
  )
}

/**
 * Remplace le placeholder `<div class="preview-box">…</div>` par un bloc
 * équivalent contenant un `<img>` cliquable. On reconstruit tout le bloc
 * (incluant le `<a href>` parent) car le placeholder a 4 `<div>` imbriqués
 * et une regex non-greedy `</div>` ne matche que le premier — les 3 autres
 * deviendraient orphelins et casseraient toute la structure aval.
 *
 * Le `{{maquette_url}}` injecté ici sera interpolé par `interpolate()`
 * appelé juste après.
 *
 * Si pas d'URL preview (ScreenshotOne KO), on n'appelle pas cette fonction
 * et le placeholder reste tel quel — fallback gracieux.
 */
export function applyPreviewBlock(
  htmlTemplate: string,
  previewImageUrl: string,
  nomCommerce: string
): string {
  const altText = `Aperçu de la simulation pour ${escapeHtml(nomCommerce)}`
  const replacement = `<div class="preview-box"><a href="{{maquette_url}}"><img src="${escapeAttr(previewImageUrl)}" alt="${altText}" style="width:100%;max-width:100%;height:auto;display:block;border-radius:4px;border:1px solid #D4DDD7;" /></a></div>`

  // Match : `<div class="preview-box">` jusqu'au `</a></div>` qui le ferme.
  return htmlTemplate.replace(
    /<div class="preview-box">[\s\S]*?<\/a>\s*<\/div>/,
    replacement
  )
}

/**
 * Substitue les `{{var}}` par leur valeur. Une variable absente du `vars`
 * est remplacée par une chaîne vide (pas d'erreur — on suppose que le
 * caller a fourni toutes les variables nécessaires).
 */
export function interpolate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

// ─── Helpers d'échappement (uniquement pour les valeurs injectées dynamiquement
// dans le HTML — pas pour le template lui-même qui est trusted) ────────────

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' :
    c === '<' ? '&lt;' :
    c === '>' ? '&gt;' :
    c === '"' ? '&quot;' : '&#39;'
  )
}

function escapeAttr(s: string): string {
  return s.replace(/["<>]/g, (c) =>
    c === '"' ? '&quot;' : c === '<' ? '&lt;' : '&gt;'
  )
}
