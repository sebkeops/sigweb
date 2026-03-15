-- ============================================================
-- Migration : Restreindre les RLS admin à l'UUID admin précis
-- À exécuter dans l'éditeur SQL Supabase APRÈS avoir remplacé
-- 'REMPLACER_PAR_VOTRE_UUID_ADMIN' par le vrai UUID de votre
-- utilisateur admin (visible dans Authentication > Users)
-- ============================================================

-- TODO: Remplacer 'REMPLACER_PAR_VOTRE_UUID_ADMIN' par le vrai UUID

-- Supprimer les politiques génériques existantes
drop policy if exists "admin_all_projects" on projects;
drop policy if exists "admin_read_contacts" on contacts;
drop policy if exists "admin_update_contacts" on contacts;

-- Recréer avec UUID précis
create policy "admin_all_projects"
  on projects
  for all
  using (auth.uid() = 'REMPLACER_PAR_VOTRE_UUID_ADMIN'::uuid);

create policy "admin_read_contacts"
  on contacts
  for select
  using (auth.uid() = 'REMPLACER_PAR_VOTRE_UUID_ADMIN'::uuid);

create policy "admin_update_contacts"
  on contacts
  for update
  using (auth.uid() = 'REMPLACER_PAR_VOTRE_UUID_ADMIN'::uuid);

create policy "admin_delete_contacts"
  on contacts
  for delete
  using (auth.uid() = 'REMPLACER_PAR_VOTRE_UUID_ADMIN'::uuid);
