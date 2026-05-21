import { z } from 'zod'

const CATEGORIES = [
  // V1
  'boulangerie', 'boucherie', 'restaurant', 'pizzeria',
  'primeur', 'fromager', 'caviste',
  'coiffeur', 'esthetique', 'kine', 'cabinet',
  'menuisier', 'plombier', 'electricien', 'peintre', 'paysagiste',
  'photographe',
  // V2 — stubs (brief "Consolidation finale" — exposition admin gérée par
  // `CATEGORIES_EXPOSED_IN_ADMIN`, pas par cette validation côté serveur).
  'bar_cafe', 'traiteur', 'chocolatier', 'epicerie_fine',
  'macon', 'couvreur', 'carreleur', 'piscinier',
  'osteopathe', 'praticien_bien_etre',
  'fleuriste', 'bijoutier', 'librairie', 'garagiste',
  'gite', 'camping',
  // Fallback
  'autre',
] as const

const CANAUX = ['a_definir', 'terrain', 'email', 'reseaux', 'telephone', 'ecarte'] as const

const STATUTS = [
  'a_qualifier', 'qualifie', 'contacte', 'relance_1', 'relance_2', 'relance_3',
  'repondu', 'rdv_pris', 'devis_envoye', 'signe', 'perdu', 'ecarte',
] as const

const optionalText = (max: number) =>
  z.string().trim().max(max).optional()

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || (z.string().url().safeParse(v).success && /^https?:\/\//i.test(v)),
    { message: "L'URL doit commencer par http:// ou https://" }
  )
  .optional()

const optionalEmail = z
  .string()
  .trim()
  .refine((v) => v === '' || z.string().email().safeParse(v).success, {
    message: 'Adresse email invalide.',
  })
  .optional()

const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), {
    message: 'Date invalide.',
  })
  .optional()

export const prospectSchema = z.object({
  nom_commerce: z.string().trim().min(2, 'Le nom du commerce est requis.').max(200),
  categorie: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Catégorie invalide.' }) }),

  adresse: optionalText(300),
  ville: optionalText(120),
  code_postal: optionalText(20),
  distance_km: z
    .preprocess(
      (v) => (v === undefined || v === '' ? undefined : Number(v)),
      z.number().min(0, 'Distance invalide.').max(9999).optional()
    ),

  telephone: optionalText(40),
  email: optionalEmail,
  site_existant_url: optionalUrl,
  instagram_url: optionalUrl,
  facebook_url: optionalUrl,

  // `score` n'est plus saisi via le formulaire : il est calculé automatiquement
  // par `lib/scoring/` à partir des champs factuels (distance, site, avis Google,
  // statut). Pour un override manuel, voir setManualScoreOverride dans actions/score.ts.
  canal: z.enum(CANAUX),
  statut: z.enum(STATUTS),

  notes: z.string().trim().max(5000).optional(),
  date_dernier_contact: optionalDate,
  date_relance_prevue: optionalDate,
})

export type ProspectFormData = z.infer<typeof prospectSchema>
