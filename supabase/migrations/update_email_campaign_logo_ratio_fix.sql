-- ============================================================
-- Patch v2.1 : ratio du logo SIGWEB dans le header email.
--
-- Problème : `width="32" height="32"` force le logo (qui est paysage,
-- pas carré) en 32×32 → écrasement horizontal. Solution : `width="32"`
-- + `height: auto` (via inline style) → conservation du ratio natif.
--
-- À exécuter UNE FOIS dans l'éditeur SQL Supabase. Idempotent : si la
-- chaîne cible n'existe plus (déjà patchée), `replace()` est un no-op.
-- ============================================================

UPDATE email_campaigns SET
  variant_sans_site_body_html = replace(
    variant_sans_site_body_html,
    '<img src="{{logo_url}}" alt="SIGWEB" width="32" height="32" style="display:block;border:0;" />',
    '<img src="{{logo_url}}" alt="SIGWEB" width="32" style="display:block;border:0;max-width:32px;height:auto;" />'
  ),
  variant_avec_site_body_html = replace(
    variant_avec_site_body_html,
    '<img src="{{logo_url}}" alt="SIGWEB" width="32" height="32" style="display:block;border:0;" />',
    '<img src="{{logo_url}}" alt="SIGWEB" width="32" style="display:block;border:0;max-width:32px;height:auto;" />'
  ),
  updated_at = now()
WHERE is_default = true;
