// Usage : node build-devis.js <numero>
// Ex.   : node build-devis.js D-2026-004
//
// Fusionne data/<numero>.json + _commun/config.private.json dans template-devis.html,
// écrit out/<numero>.html, puis génère out/<numero>.pdf via _commun/generate-pdf.js.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const numero = process.argv[2];
if (!numero) {
  console.error('Usage: node build-devis.js <numero>   (ex: node build-devis.js D-2026-004)');
  process.exit(1);
}

const ROOT = __dirname; // documents-admin/devis
const COMMUN = path.resolve(ROOT, '..', '_commun');

const dataPath = path.join(ROOT, 'data', `${numero}.json`);
const templatePath = path.join(ROOT, 'template-devis.html');
const outHtml = path.join(ROOT, 'out', `${numero}.html`);
const outPdf = path.join(ROOT, 'out', `${numero}.pdf`);

// --- Config sensible (IBAN/BIC) : privée si dispo, sinon exemple ---
const privatePath = path.join(COMMUN, 'config.private.json');
const examplePath = path.join(COMMUN, 'config.example.json');
let config;
if (fs.existsSync(privatePath)) {
  config = JSON.parse(fs.readFileSync(privatePath, 'utf8'));
} else {
  config = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
  console.warn('⚠  config.private.json introuvable — utilisation des valeurs factices de config.example.json.');
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
let template = fs.readFileSync(templatePath, 'utf8');

// ---------------------------------------------------------------- helpers
const NBSP = ' ';

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 1900 -> "1 900 €" (espace insécable comme séparateur de milliers)
function euros(n) {
  const s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${s}${NBSP}€`;
}

function isNumeric(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function humanDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : esc(iso || '');
}

function ul(items) {
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

// ---------------------------------------------------------------- calcul total
const total = data.prestations
  .filter((p) => isNumeric(p.montant))
  .reduce((sum, p) => sum + p.montant, 0);
const tva = 0;
const totalTTC = total + tva;

// Récurrence (ex. "par an") : suffixe affiché sur les totaux → "200 € / an".
const recSuffix = data.recurrence
  ? ` / ${String(data.recurrence).replace(/^par\s+/i, '')}`
  : '';

// ---------------------------------------------------------------- blocs HTML

// Bloc méta (haut droite)
const META = `<div class="meta-block">
  <div class="row"><span class="label">Devis n°</span><span>${esc(data.numero)}</span></div>
  <div class="row"><span class="label">Date</span><span>${humanDate(data.date)}</span></div>
  <div class="row"><span class="label">Validité</span><span>${esc(data.validite)}</span></div>
  <div class="row total"><span class="label">Total TTC</span><span>${euros(totalTTC)}${recSuffix}</span></div>
</div>`;

// Client
const c = data.client;
const clientLines = [];
clientLines.push(`<p class="name">${esc(c.nom)}</p>`);
if (c.formeJuridique) clientLines.push(`<p>${esc(c.formeJuridique)}</p>`);
if (c.gerant) clientLines.push(`<p>Gérant : ${esc(c.gerant)}</p>`);
if (c.contact) clientLines.push(`<p>Contact : ${esc(c.contact)}</p>`);
(c.adresse || []).forEach((l) => clientLines.push(`<p>${esc(l)}</p>`));
if (c.telephone) clientLines.push(`<p>${esc(c.telephone)}</p>`);
if (c.email) clientLines.push(`<p>${esc(c.email)}</p>`);
if (c.siret) clientLines.push(`<p>SIRET : ${esc(c.siret)}${c.rcs ? ' — ' + esc(c.rcs) : ''}</p>`);
if (c.naf) clientLines.push(`<p>Code NAF : ${esc(c.naf)}</p>`);
const CLIENT = `<div class="card">${clientLines.join('')}</div>`;

// Objet
const o = data.objet;
const OBJET = `<p>${esc(o.intitule)}</p>
<p><strong>Activité :</strong> ${esc(o.activite)}</p>
<p><strong>Objectif :</strong> ${esc(o.objectif)}</p>`;

// Colonne droite du bloc PROJET : « Cadre » (devis récurrent) ou « Planning ».
let PROJET_RIGHT;
if (data.cadre && data.cadre.length) {
  PROJET_RIGHT = `<h3 class="subsection">Cadre</h3>${ul(data.cadre)}`;
} else {
  PROJET_RIGHT = `<h3 class="subsection">Planning</h3>${ul(data.planning || [])}`;
}

// Tableau prestations
const PRESTATIONS_ROWS = data.prestations
  .map((p) => {
    const montant = isNumeric(p.montant) ? euros(p.montant) : esc(p.montant);
    return `<tr>
    <td class="presta-title">${esc(p.intitule)}</td>
    <td class="presta-desc">${esc(p.description)}</td>
    <td class="col-montant">${montant}</td>
  </tr>`;
  })
  .join('\n');

// Totaux
const TOTALS = `<div class="totals no-break">
  <div class="row"><span>Total</span><span>${euros(total)}${recSuffix}</span></div>
  <div class="row"><span>TVA (non applicable)</span><span>${euros(tva)}</span></div>
  <div class="row grand"><span>Total TTC</span><span>${euros(totalTTC)}${recSuffix}</span></div>
</div>`;

// Abonnement (optionnel)
let ABONNEMENT = '';
if (data.abonnement) {
  const a = data.abonnement;
  const montant = isNumeric(a.montant) ? `${euros(a.montant).replace(NBSP + '€', '')}${NBSP}${a.unite || '€'}` : esc(a.montant);
  ABONNEMENT = `<h2 class="section">Abonnement annuel</h2>
<div class="subblock no-break">
  <div class="head">
    <strong>${esc(a.intitule)}</strong>
    <span class="amount">${montant}</span>
  </div>
  <p class="desc">${esc(a.description)}</p>
  <p class="hint">Montant récurrent, non inclus dans le total de création ci-dessus.</p>
</div>`;
}

// Options (optionnel)
let OPTIONS = '';
if (data.options && data.options.length) {
  const rows = data.options
    .map((op) => {
      const montant = isNumeric(op.montant) ? euros(op.montant) : esc(op.montant);
      return `<div class="subblock no-break">
  <div class="head">
    <strong>${esc(op.intitule)}</strong>
    <span class="amount">${montant}</span>
  </div>
  <p class="desc">${esc(op.description)}</p>
</div>`;
    })
    .join('\n');
  OPTIONS = `<h2 class="section">Options (à valider)</h2>
<p class="hint">Postes non inclus dans le total de création.</p>
${rows}`;
}

// Inclus / Conditions
const INCLUS = ul(data.inclus);
const CONDITIONS = ul(data.conditions);

// Paiement
const PAIEMENT = `<p><strong>Modes de règlement :</strong> ${esc(data.paiement.modes)}</p>
<p><strong>Échéancier :</strong> ${esc(data.paiement.echeancier)}</p>`;

// Coordonnées de règlement (IBAN/BIC depuis config)
const COORDS = `Ordre / bénéficiaire : Sébastien SIGUENZA
Adresse : 33 impasse de l'Autan, 32600 Ségoufielle
IBAN : ${esc(config.iban)}
BIC  : ${esc(config.bic)}`;

// Offre complémentaire (texte libre, optionnel)
let OFFRE_COMPLEMENTAIRE = '';
if (data.offreComplementaire) {
  OFFRE_COMPLEMENTAIRE = `<h2 class="section">Offre complémentaire</h2>
<div class="banner"><p style="margin:0">${esc(data.offreComplementaire)}</p></div>`;
}

// Mentions
const MENTIONS = ul(data.mentionsSpecifiques);

// Validation (bon pour accord)
const VALIDATION = `<div class="validation no-break">Devis établi le ${humanDate(data.date)} — valable ${esc(data.validite)}.

<strong>Bon pour accord (à retourner daté et signé) :</strong>

Fait à ……………………, le …/…/……
Nom, prénom et qualité du signataire : ………………………………
Mention manuscrite « Bon pour accord » + signature :
<div class="note">Retour possible par email : PDF signé (scan/photo), ou simple réponse « Bon pour accord, le [date], [Nom + qualité] ».</div></div>`;

// ---------------------------------------------------------------- injection
const replacements = {
  // out/ est un niveau plus profond que le template : _commun est donc à ../../
  '{{COMMUN}}': '../../_commun',
  '{{NUMERO}}': esc(data.numero),
  '{{TITRE}}': esc(data.titre),
  '{{DESCRIPTION}}': esc(data.description),
  '{{META}}': META,
  '{{CLIENT}}': CLIENT,
  '{{OBJET}}': OBJET,
  '{{PROJET_RIGHT}}': PROJET_RIGHT,
  '{{PRESTATIONS_ROWS}}': PRESTATIONS_ROWS,
  '{{TOTALS}}': TOTALS,
  '{{ABONNEMENT}}': ABONNEMENT,
  '{{OPTIONS}}': OPTIONS,
  '{{INCLUS}}': INCLUS,
  '{{CONDITIONS}}': CONDITIONS,
  '{{OFFRE_COMPLEMENTAIRE}}': OFFRE_COMPLEMENTAIRE,
  '{{PAIEMENT}}': PAIEMENT,
  '{{COORDS}}': COORDS,
  '{{MENTIONS}}': MENTIONS,
  '{{VALIDATION}}': VALIDATION,
};

for (const [token, value] of Object.entries(replacements)) {
  template = template.split(token).join(value);
}

// Contrôle : aucun token résiduel
const leftover = template.match(/{{[^}]+}}/g);
if (leftover) {
  console.error('❌ Tokens non remplacés :', [...new Set(leftover)].join(', '));
  process.exit(1);
}

fs.mkdirSync(path.dirname(outHtml), { recursive: true });
fs.writeFileSync(outHtml, template, 'utf8');
console.log('HTML généré :', outHtml);
console.log(`Contrôle → Total: ${euros(total)} | TVA: ${euros(tva)} | Total TTC: ${euros(totalTTC)}`);

// Génération PDF via le script générique
execFileSync('node', [path.join(COMMUN, 'generate-pdf.js'), outHtml, outPdf], {
  stdio: 'inherit',
});
