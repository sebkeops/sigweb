-- ============================================================
-- Patch : réaligne le `status` des lignes email_sends qui ont été
-- régressées par des events Resend arrivés dans le désordre (un
-- `email.delivered` retenté qui arrive APRÈS un `email.clicked`
-- déjà traité, écrasant le statut 'clicked' en 'delivered').
--
-- Le webhook a été corrigé (cf. pickHigherStatus dans
-- app/api/webhooks/resend/route.ts) → plus de régression future.
--
-- Ce script ré-aligne les données EXISTANTES en se basant sur les
-- compteurs (qui, eux, n'ont jamais été régressés — seul le status
-- l'était).
--
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase. Idempotent.
-- ============================================================

-- 1. click_count > 0 → le statut doit être au moins 'clicked'
--    (sauf si déjà bounced/complained, qui sont prioritaires).
UPDATE email_sends
SET status = 'clicked'
WHERE click_count > 0
  AND status IN ('pending', 'sent', 'delivered', 'opened');

-- 2. open_count > 0 (et pas de clic) → le statut doit être au moins 'opened'.
UPDATE email_sends
SET status = 'opened'
WHERE open_count > 0
  AND click_count = 0
  AND status IN ('pending', 'sent', 'delivered');

-- 3. delivered_at non nul → le statut doit être au moins 'delivered'
--    (utile si l'event delivered a été perdu mais opened/clicked sont passés).
UPDATE email_sends
SET status = 'delivered'
WHERE delivered_at IS NOT NULL
  AND status IN ('pending', 'sent');
