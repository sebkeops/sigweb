-- ============================================================
-- Migration : extension Sirene Lot 2 — dirigeant + ancienneté + forme juridique
--
-- Persiste les champs déjà renvoyés par l'API data.gouv.fr Sirene au
-- moment du sourcing, mais jusqu'ici jetés. Cf. brief Lot 2 :
--   "Identifier précisément les champs déjà présents dans la réponse
--    Sirene au sourcing et les persister dans des colonnes typées."
--
-- Champs ajoutés :
--   - dirigeant_nom / dirigeant_prenom : extraits de `dirigeants[]` quand
--     type_dirigeant='personne physique'. Pour les SAS/SARL à dirigeant
--     personne morale, ces champs restent NULL.
--   - dirigeant_nom_diffusible : true UNIQUEMENT si `statut_diffusion='O'`
--     (Ouverte) ET dirigeant personne physique présent. Permet le filtrage
--     côté code applicatif avant d'afficher / utiliser le nom (cf. règle
--     de diffusibilité INSEE depuis 2023).
--   - date_creation_entreprise : `unite_legale.date_creation`, distincte
--     de la date de création de l'établissement (déjà stockée en
--     `date_creation`). L'UL existe depuis cette date (utile pour le
--     pitch « depuis AAAA »).
--   - forme_juridique_code : code INSEE brut (5710, 5410, 1000…).
--   - forme_juridique_label : libellé humanisé pour l'admin (« SAS »,
--     « SARL », « Entrepreneur Individuel »…). Calculé côté code à
--     l'insertion via `mapNatureJuridique()`.
--
-- Idempotent : ADD COLUMN IF NOT EXISTS.
-- ============================================================

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS dirigeant_nom              text,
  ADD COLUMN IF NOT EXISTS dirigeant_prenom           text,
  ADD COLUMN IF NOT EXISTS dirigeant_nom_diffusible   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS date_creation_entreprise   date,
  ADD COLUMN IF NOT EXISTS forme_juridique_code       text,
  ADD COLUMN IF NOT EXISTS forme_juridique_label      text;

-- Index pour filtrer les prospects légalement fermés (filtre qualité de lead)
CREATE INDEX IF NOT EXISTS prospects_etat_admin_actifs_idx
  ON prospects (etat_administratif)
  WHERE etat_administratif IS NOT NULL;
