import type { ProspectStatut } from '@/types'

/**
 * Helpers purs pour la progression automatique des statuts CRM v3.
 *
 * Pourquoi un module dédié et pas inline dans `sender.ts` ?
 *   - Logique testable unitairement sans mocker Resend ni Supabase
 *   - Réutilisable côté ajout d'événements timeline manuels (Phase 4)
 *   - Évite que `sender.ts` (déjà gros) absorbe une concern CRM
 *
 * Pas de dépendance Next/Supabase : ce module est `'server-only'`-safe
 * mais pas tagué comme tel — utilisable depuis n'importe quel contexte.
 */

/**
 * Calcule le **nouveau statut** d'un prospect après envoi d'un email,
 * selon la règle de progression validée (CRM v3 Phase 1) :
 *
 *   a_qualifier   ┐
 *   qualifie      ├─→ contacte    (1er contact)
 *   maquette_prete┘
 *
 *   contacte      ─→ relance_1    (2e envoi = 1ère relance)
 *   relance_1     ─→ relance_2    (3e envoi)
 *   relance_2     ─→ relance_3    (4e envoi)
 *
 *   relance_3     ─→ inchangé     (plafond, décision manuelle ensuite)
 *   repondu       ─→ inchangé     (on ne régresse jamais un statut avancé)
 *   rdv_pris      ─→ inchangé
 *   devis_envoye  ─→ inchangé
 *   signe         ─→ inchangé
 *   perdu         ─→ inchangé
 *   ecarte        ─→ inchangé
 *
 * Pure fonction : aucun side effect, déterministe, testable.
 *
 * @returns Le nouveau statut, ou `null` si aucune progression n'est due
 *          (statut déjà avancé ou plafond `relance_3` atteint). Le caller
 *          peut court-circuiter le UPDATE BDD dans ce cas.
 */
export function nextStatutAfterEmailSent(
  current: ProspectStatut
): ProspectStatut | null {
  switch (current) {
    case 'a_qualifier':
    case 'qualifie':
    case 'maquette_prete':
      return 'contacte'
    case 'contacte':
      return 'relance_1'
    case 'relance_1':
      return 'relance_2'
    case 'relance_2':
      return 'relance_3'
    // Plafond + statuts terminaux : pas de progression auto.
    case 'relance_3':
    case 'repondu':
    case 'rdv_pris':
    case 'devis_envoye':
    case 'signe':
    case 'perdu':
    case 'ecarte':
      return null
  }
}

/**
 * Détermine si une adresse email destinataire doit être considérée comme
 * un envoi de **test** plutôt qu'un vrai envoi de prospection.
 *
 * Sert au garde-fou validé (CRM v3 Phase 1) : un email vers `@sigweb.fr`
 * (ou autre domaine configuré) ne doit ni faire progresser le statut du
 * prospect, ni polluer les KPIs dashboard (Phase 6).
 *
 * Configuration via `SIGWEB_TEST_EMAIL_DOMAINS` (CSV de domaines) — par
 * défaut, seul `sigweb.fr` est considéré test. Insensible à la casse.
 *
 * Exemples :
 *   - `contact@sigweb.fr`              → true (domaine par défaut)
 *   - `Sebastien@SIGWEB.FR`            → true (casse ignorée)
 *   - `vrai-prospect@boulangerie.fr`   → false
 *   - `xxx@autre-domaine-test.com`     → true si présent dans env
 */
export function isTestEmailRecipient(toEmail: string): boolean {
  const lc = toEmail.trim().toLowerCase()
  const at = lc.lastIndexOf('@')
  if (at < 0) return false
  const domain = lc.slice(at + 1)
  if (!domain) return false

  const configured = process.env.SIGWEB_TEST_EMAIL_DOMAINS
  const domains = configured
    ? configured.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)
    : ['sigweb.fr']

  return domains.includes(domain)
}
