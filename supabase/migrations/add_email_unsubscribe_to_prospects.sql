-- ============================================================
-- Migration : ajout des champs de désabonnement email sur prospects
-- À exécuter dans l'éditeur SQL Supabase
--
-- Un prospect désabonné ne doit JAMAIS recevoir d'email — la vérification
-- est faite côté server action AVANT tout appel Resend, et le bouton
-- "Envoyer email" sur la fiche est désactivé si email_unsubscribed = true.
-- ============================================================

ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS email_unsubscribed     boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_unsubscribed_at  timestamptz;

-- Index partiel pour filtrer rapidement les prospects désabonnés
-- (utilisé par les écrans CRM et la garde-fou côté envoi).
CREATE INDEX IF NOT EXISTS prospects_email_unsubscribed_idx
  ON prospects (email_unsubscribed)
  WHERE email_unsubscribed = true;
