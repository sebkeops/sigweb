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

// ─── Fallback "nouveau commerce" (Lot 2 — complément Sirene) ──────────────
//
// Déclenché quand le prospect n'a AUCUNE donnée Google (note, avis ni photo).
// Cas typique : commerce neuf sourcé via Sirene.
//
// Ton :
//   - reconnaît le lancement
//   - valorise « être trouvable dès le départ »
//   - n'attaque PAS un « site actuel pas à la hauteur » (il n'y en a pas)
//   - ne mentionne PAS d'avis ni de note (il n'y en a pas)

const HIGHLIGHT_NOUVEAU_COMMERCE_HTML =
  `Vous venez de lancer votre {{categorie}}. Quand de nouveaux clients vous cherchent sur leur téléphone, ils ne trouvent <em>rien</em> — pas encore. C'est <em>exactement le moment</em> où une vraie présence en ligne fait toute la différence : être visible, paraître établi, donner envie dès les premiers clics.`

const HIGHLIGHT_NOUVEAU_COMMERCE_TEXT =
  `Vous venez de lancer votre {{categorie}}. Quand de nouveaux clients vous cherchent sur leur téléphone, ils ne trouvent rien — pas encore. C'est exactement le moment où une vraie présence en ligne fait toute la différence : être visible, paraître établi, donner envie dès les premiers clics.`

/**
 * Si rating ou nb_avis manquant, swap le contenu du highlight par le fallback
 * générique. À appliquer AVANT `interpolate`.
 *
 * Paramètre `isNouveauCommerce` (Lot 2) : si `true`, utilise le wording
 * « nouveau commerce » au lieu du fallback variant-aware. Déclenché par
 * `!hasGoogleReputation(prospect)` côté caller.
 */
export function applyHighlightFallback(
  template: string,
  variant: WebVariant,
  format: 'html' | 'text',
  isNouveauCommerce: boolean = false
): string {
  if (format === 'html') {
    const fallback = isNouveauCommerce
      ? HIGHLIGHT_NOUVEAU_COMMERCE_HTML
      : HIGHLIGHT_FALLBACK_HTML[variant]
    // Match le bloc <div class="highlight-fact">…</div> non-greedy.
    return template.replace(
      /<div class="highlight-fact">[\s\S]*?<\/div>/,
      `<div class="highlight-fact">${fallback}</div>`
    )
  }
  // Texte : la phrase highlight commence par "Avec {{nb_avis}} avis Google"
  // et se termine à la double newline (paragraphe suivant). Cible précise
  // qui survit aux variations mineures du seed.
  const fallback = isNouveauCommerce
    ? HIGHLIGHT_NOUVEAU_COMMERCE_TEXT
    : HIGHLIGHT_FALLBACK_TEXT[variant]
  return template.replace(
    /Avec \{\{nb_avis\}\}[\s\S]*?(\r?\n\r?\n)/,
    `${fallback}\n\n`
  )
}

// ─── Personnalisation dirigeant (Lot 2 PR D — Sirene) ────────────────────
//
// Si on a récupéré le prénom du dirigeant via Sirene ET qu'il est diffusible
// (statut INSEE = 'O'), on personnalise la salutation : "Bonjour," devient
// "Bonjour Sébastien,". Sinon le template reste tel quel (générique).
//
// Source du prénom : `prospects.dirigeant_prenom` rempli par
// `extractSireneAdditionalFields`, déjà filtré par diffusibilité côté
// extracteur (cf. règle Lot 2). Le caller passe une chaîne vide si
// l'info n'est pas disponible ou non diffusible.
//
// Format Sirene = MAJUSCULES (ex. "JEHANNA", "JEAN-PIERRE"). On convertit
// en titre case pour un rendu pro dans l'email (« Jehanna », « Jean-Pierre »).

/**
 * Title case « pro » : majuscule sur la 1ère lettre de chaque mot, y
 * compris après un tiret ou une apostrophe. Exemples :
 *   "JEHANNA"     → "Jehanna"
 *   "JEAN-PIERRE" → "Jean-Pierre"
 *   "MARIE LOUISE" → "Marie Louise"
 *   "SÉBASTIEN"   → "Sébastien"  (préservation des accents)
 *
 * On n'utilise PAS `\b\w` parce que `\b` est ASCII-only en regex JS et
 * traite les accents (é, à…) comme des frontières de mot — ce qui
 * mettrait à tort une majuscule sur la lettre qui suit. À la place, on
 * matche explicitement les séparateurs connus + Unicode property `\p{L}`.
 *
 * Exporté pour permettre au sender.ts de formater le prénom/nom du
 * dirigeant dans les variables `dirigeant_prenom` / `dirigeant_nom`
 * sans dupliquer la logique.
 */
export function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s\-'])(\p{L})/gu, (_, sep, letter: string) => sep + letter.toUpperCase())
}

/**
 * Remplace la salutation générique « Bonjour, » par « Bonjour {{Prénom}}, »
 * si le prénom du dirigeant est fourni (et diffusible — décision côté
 * caller). Sans effet si `prenom` est vide.
 *
 * Format gère HTML (`<p>Bonjour,</p>`) ET texte brut (`Bonjour,` en début
 * de ligne). Le regex est volontairement strict pour ne PAS toucher
 * d'autres « bonjour » qui pourraient apparaître ailleurs dans le corps.
 *
 * Contrat : le `prenom` passé est censé être déjà formaté (title case).
 * Le caller fait la transformation via `toTitleCase()` avant — pas dupliqué
 * ici, pour ne pas faire un double passage si la valeur vient des variables
 * `dirigeant_prenom` déjà formatées côté sender.
 */
export function applyDirigeantPersonalization(
  template: string,
  prenom: string,
  format: 'html' | 'text'
): string {
  const trimmed = prenom.trim()
  if (!trimmed) return template

  if (format === 'html') {
    // Match le <p>Bonjour,</p> exact des templates v2 (seed migration).
    return template.replace(
      /<p>Bonjour,<\/p>/,
      `<p>Bonjour ${escapeHtml(trimmed)},</p>`
    )
  }
  // Texte : match « Bonjour, » en début de ligne (ou début de chaîne)
  // pour ne pas attraper un « bonjour » plus loin dans le corps.
  return template.replace(/^Bonjour,/m, `Bonjour ${trimmed},`)
}

// ─── Swap d'intro maquette pour « nouveau commerce » (Lot 2 corrigé) ──────
//
// Le bloc « highlight-fact » n'est pas la SEULE référence Google dans les
// templates email. La phrase d'intro du bloc maquette mentionne aussi
// « vos vraies photos » et « vos vrais avis Google » :
//
//   sans-site : « …spécialement pour {{nom_commerce}}, avec vos vraies
//                photos et vos vrais avis Google : »
//   avec-site : « …spécialement pour {{nom_commerce}}, avec vos photos
//                et vos vrais avis Google : »
//
// Pour un prospect sans aucune donnée Google (cas Sirene), ces phrases
// sont incorrectes : l'image utilisée est ILLUSTRATIVE (univers métier
// hérité de la simulation), pas la vraie boutique. Et il n'y a pas d'avis.
//
// On swap pour une formulation neutre et honnête, à appliquer AVANT
// interpolation des {{var}}.

const INTRO_NOUVEAU_COMMERCE_REPLACEMENT =
  ', pour vous montrer concrètement ce que ça pourrait donner dès vos débuts'

/**
 * Swap les fragments d'intro de maquette qui mentionnent les vraies
 * photos / avis Google. Sans effet si les fragments ne sont pas présents
 * (templates futurs sans ces mentions).
 *
 * À appliquer AVANT `interpolate`, après `applyHighlightFallback`.
 */
export function applyNouveauCommerceIntroSwap(template: string): string {
  return template
    .replace(
      /, avec vos vraies photos et vos vrais avis Google/g,
      INTRO_NOUVEAU_COMMERCE_REPLACEMENT
    )
    .replace(
      /, avec vos photos et vos vrais avis Google/g,
      INTRO_NOUVEAU_COMMERCE_REPLACEMENT
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
