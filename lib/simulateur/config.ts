export interface SimulateurAnswers {
  projectType: string
  activityType: string
  priority: string
  features: string[]
  content: string
  selfManage: string
  selfManageItems: string[]
  googleVisibility: string
}

export interface ChoiceOption {
  value: string
  label: string
  icon?: string
  hint?: string
}

// ── Question 1 ─────────────────────────────────────────────────
export const projectTypeOptions: ChoiceOption[] = [
  { value: 'Créer un site internet', label: 'Créer un site internet', icon: '✨' },
  { value: 'Refaire mon site actuel', label: 'Refaire mon site actuel', icon: '🔄' },
  { value: 'Améliorer un site existant', label: 'Améliorer un site existant', icon: '✏️' },
]

// ── Question 2 ─────────────────────────────────────────────────
export const activityTypeOptions: ChoiceOption[] = [
  { value: 'Boulangerie / pâtisserie', label: 'Boulangerie / pâtisserie', icon: '🥐' },
  { value: 'Pizzeria / restaurant', label: 'Pizzeria / restaurant', icon: '🍕' },
  { value: 'Boucherie / traiteur', label: 'Boucherie / traiteur', icon: '🥩' },
  { value: 'Salon de coiffure / esthétique', label: 'Salon de coiffure / esthétique', icon: '✂️' },
  {
    value: 'Artisan / entreprise artisanale',
    label: 'Artisan / entreprise artisanale',
    icon: '🔨',
    hint: 'Menuisier, plombier, électricien, peintre…',
  },
  { value: 'Autre commerce local', label: 'Autre commerce local', icon: '🏪' },
]

// ── Question 3 (adaptée selon l'activité) ─────────────────────
export const priorityOptionsDefault: ChoiceOption[] = [
  { value: 'Présenter mon activité', label: 'Présenter mon activité' },
  { value: 'Montrer mes produits ou services', label: 'Montrer mes produits ou services' },
  { value: 'Donner mes informations pratiques', label: 'Donner mes informations pratiques' },
  { value: 'Recevoir des demandes de contact', label: 'Recevoir des demandes de contact' },
  { value: 'Permettre la commande ou la réservation', label: 'Permettre la commande ou la réservation' },
  { value: 'Être plus visible sur Google', label: 'Être plus visible sur Google' },
]

export const priorityOptionsArtisan: ChoiceOption[] = [
  { value: 'Présenter mon activité', label: 'Présenter mon activité' },
  { value: 'Montrer mes réalisations', label: 'Montrer mes réalisations' },
  { value: 'Recevoir des demandes de devis', label: 'Recevoir des demandes de devis' },
  { value: 'Être trouvé sur Google', label: 'Être trouvé sur Google' },
  { value: 'Rassurer avec un site professionnel', label: 'Rassurer avec un site professionnel' },
]

// ── Question 4 (multi) ─────────────────────────────────────────
export const featuresOptions: ChoiceOption[] = [
  { value: "Une page d'accueil claire", label: "Une page d'accueil claire" },
  { value: "Une présentation de l'activité", label: "Une présentation de l'activité" },
  { value: 'Des photos', label: 'Des photos' },
  { value: 'Une page contact', label: 'Une page contact' },
  { value: "Les horaires et l'adresse", label: "Les horaires et l'adresse" },
  { value: 'Une carte ou liste de produits', label: 'Une carte ou liste de produits' },
  { value: 'Un formulaire de contact', label: 'Un formulaire de contact' },
  { value: 'Des avis clients', label: 'Des avis clients' },
  { value: 'Un système de commande simple', label: 'Un système de commande simple' },
  { value: 'Un système de réservation simple', label: 'Un système de réservation simple' },
]

// ── Question 5 ─────────────────────────────────────────────────
export const contentOptions: ChoiceOption[] = [
  { value: "Oui, j'ai déjà les textes et les photos", label: "Oui, j'ai déjà les textes et les photos" },
  { value: "J'ai seulement une partie", label: "J'ai seulement une partie" },
  { value: "Non, il faudra m'aider", label: "Non, il faudra m'aider" },
]

// ── Question 6 ─────────────────────────────────────────────────
export const selfManageOptions: ChoiceOption[] = [
  { value: 'Non, je préfère que vous vous en occupiez', label: 'Non, je préfère que vous vous en occupiez' },
  {
    value: 'Oui, pour quelques informations importantes',
    label: 'Oui, pour quelques informations importantes',
  },
  { value: 'Oui, je veux pouvoir modifier tout le site', label: 'Oui, je veux pouvoir modifier tout le site' },
]

// ── Question 6b (sous-question multi) ─────────────────────────
export const selfManageItemsOptions: ChoiceOption[] = [
  { value: 'Les horaires', label: 'Les horaires' },
  { value: 'Les photos', label: 'Les photos' },
  { value: 'Les produits / la carte', label: 'Les produits / la carte' },
  { value: 'Les actualités', label: 'Les actualités' },
  { value: 'Les promotions', label: 'Les promotions' },
]

// ── Question 7 ─────────────────────────────────────────────────
export const googleOptions: ChoiceOption[] = [
  { value: "Oui, c'est très important", label: "Oui, c'est très important" },
  { value: 'Oui, mais je ne sais pas comment faire', label: 'Oui, mais je ne sais pas comment faire' },
  { value: 'Pas forcément', label: 'Pas forcément' },
]

// ── Calcul de l'estimation ─────────────────────────────────────
const BASE_PRICES: Record<string, number> = {
  'Créer un site internet': 900,
  'Refaire mon site actuel': 1100,
  'Améliorer un site existant': 700,
}

const FEATURE_PRICES: Record<string, number> = {
  'Des photos': 150,
  'Une carte ou liste de produits': 150,
  'Des avis clients': 80,
  'Un formulaire de contact': 80,
  'Un système de commande simple': 400,
  'Un système de réservation simple': 300,
}

export function calculateEstimate(answers: Partial<SimulateurAnswers>): { low: number; high: number } {
  let total = BASE_PRICES[answers.projectType ?? ''] ?? 900

  for (const feature of answers.features ?? []) {
    total += FEATURE_PRICES[feature] ?? 0
  }

  if (answers.content === "Non, il faudra m'aider") total += 250
  else if (answers.content === "J'ai seulement une partie") total += 125

  if (answers.selfManage === 'Oui, pour quelques informations importantes') total += 200
  else if (answers.selfManage === 'Oui, je veux pouvoir modifier tout le site') total += 400

  if (answers.googleVisibility && answers.googleVisibility !== 'Pas forcément') total += 250

  const low = Math.round((total - 100) / 50) * 50
  const high = Math.round((total + 200) / 50) * 50

  return { low, high }
}

// ── Résumé textuel pour la BDD contacts ───────────────────────
export function buildAnswerSummary(answers: Partial<SimulateurAnswers>): string {
  const lines: string[] = ['[Simulateur] Récapitulatif du projet estimé', '']

  if (answers.projectType) lines.push(`Projet : ${answers.projectType}`)
  if (answers.activityType) lines.push(`Activité : ${answers.activityType}`)
  if (answers.priority) lines.push(`Objectif principal : ${answers.priority}`)
  if (answers.features?.length) lines.push(`Fonctionnalités souhaitées : ${answers.features.join(', ')}`)
  if (answers.content) lines.push(`Contenu disponible : ${answers.content}`)
  if (answers.selfManage) lines.push(`Modifications en autonomie : ${answers.selfManage}`)
  if (answers.selfManageItems?.length) lines.push(`Éléments à gérer : ${answers.selfManageItems.join(', ')}`)
  if (answers.googleVisibility) lines.push(`Visibilité Google : ${answers.googleVisibility}`)

  const { low, high } = calculateEstimate(answers)
  lines.push('', `Estimation indicative : entre ${low} € et ${high} €`)

  return lines.join('\n')
}
