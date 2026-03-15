-- Migration : ajout du champ featured_home sur la table projects
-- À exécuter dans l'éditeur SQL Supabase

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS featured_home boolean NOT NULL DEFAULT false;

-- Index partiel pour accélérer les requêtes home page
CREATE INDEX IF NOT EXISTS projects_featured_home_idx
  ON projects (featured_home)
  WHERE featured_home = true;
