-- ============================================================
-- Sigweb — Schéma Supabase V1
-- À exécuter dans l'éditeur SQL du projet Supabase
-- ============================================================

-- Type enum pour la catégorie de projet
create type project_kind as enum ('simulation', 'realisation');

-- ── Table projects ────────────────────────────────────────────

create table projects (
  id                uuid        primary key default gen_random_uuid(),
  title             text        not null,
  slug              text        not null unique,
  business_type     text,
  short_description text,
  content           text,
  cover_image_url   text,
  external_url      text,
  project_kind      project_kind not null,
  published         boolean     not null default false,
  featured_home     boolean     not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Trigger : mise à jour automatique de updated_at
create or replace function set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on projects
  for each row
  execute function set_updated_at();

-- ── Table contacts ────────────────────────────────────────────

create table contacts (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  business_name text,
  email         text        not null,
  phone         text,
  business_type text,
  message       text        not null,
  is_read       boolean     not null default false,
  created_at    timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────────

alter table projects enable row level security;
alter table contacts  enable row level security;

-- Projets publiés : lecture publique (site vitrine)
create policy "public_read_published_projects"
  on projects
  for select
  using (published = true);

-- Admin : accès complet sur les projets (utilisateur authentifié)
create policy "admin_all_projects"
  on projects
  for all
  using (auth.role() = 'authenticated');

-- Contact : insert public (formulaire de contact)
create policy "public_insert_contact"
  on contacts
  for insert
  with check (true);

-- Admin : lecture des messages de contact
create policy "admin_read_contacts"
  on contacts
  for select
  using (auth.role() = 'authenticated');

-- Admin : mise à jour des messages (marquer comme lu)
create policy "admin_update_contacts"
  on contacts
  for update
  using (auth.role() = 'authenticated');

-- ── Index ─────────────────────────────────────────────────────

create index projects_slug_idx        on projects (slug);
create index projects_published_idx   on projects (published);
create index projects_kind_idx        on projects (project_kind);
create index projects_created_at_idx  on projects (created_at desc);
create index projects_featured_home_idx on projects (featured_home) where featured_home = true;
create index contacts_is_read_idx     on contacts (is_read);
create index contacts_created_at_idx  on contacts (created_at desc);
