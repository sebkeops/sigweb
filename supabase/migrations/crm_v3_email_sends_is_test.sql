-- ============================================================
-- Migration : pilotage commercial CRM v3 — fixup email_sends.is_test.
--
-- Ajoute une colonne `is_test` a `email_sends` pour distinguer les
-- envois TEST (bouton 'Envoyer un test' qui force toOverride vers
-- une adresse @sigweb.fr) des envois REELS au prospect.
--
-- Set automatiquement a true par `sendProspectEmail` quand le
-- destinataire est detecte comme un domaine de test
-- (`isTestEmailRecipient(finalTo)` — meme fonction qui controle deja
-- le garde-fou progression statut + tracking maquette).
--
-- Sert a :
--   - Afficher un badge 'TEST' sur la carte email dans la timeline
--     pour que Sebastien distingue visuellement ses tests Resend
--     de ses vrais envois prospect
--   - Filtrer eventuellement les emails test du dashboard Phase 6
--
-- Idempotent : ADD COLUMN IF NOT EXISTS.
-- ============================================================

ALTER TABLE email_sends
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;
