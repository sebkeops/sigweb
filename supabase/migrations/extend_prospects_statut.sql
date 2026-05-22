-- ============================================================
-- Migration : ajoute le statut prospect "maquette_prete".
--
-- Placé dans le pipeline commercial entre "qualifie" et
-- "contacte" : la maquette de démonstration est prête à être
-- envoyée avant la prise de contact.
--
-- À exécuter dans l'éditeur SQL Supabase.
-- ============================================================

ALTER TABLE prospects
  DROP CONSTRAINT IF EXISTS prospects_statut_check;

ALTER TABLE prospects
  ADD CONSTRAINT prospects_statut_check CHECK (statut IN (
    'a_qualifier','qualifie','maquette_prete','contacte',
    'relance_1','relance_2','relance_3',
    'repondu','rdv_pris','devis_envoye','signe','perdu','ecarte'
  ));
