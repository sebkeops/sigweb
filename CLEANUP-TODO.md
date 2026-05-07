# Cleanup TODO

> Dettes techniques de transition à nettoyer une fois les nouveautés bien stabilisées.
> Chaque entrée précise la condition d'éligibilité au cleanup.

---

## Photos maquette — anciens champs (Session 3.0)

**Date d'introduction** : 2026-05-06

**Contexte** : la Session 3.0 a restructuré la gestion des photos d'une maquette.
On est passé d'un trio de colonnes :

- `maquettes.hero_photo_url`
- `maquettes.histoire_photo_url`
- `maquettes.univers_photos_urls`

vers un modèle pool + assignations :

- `maquettes.available_photos` (jsonb)
- `maquettes.photo_assignments` (jsonb)

Pour sécuriser la transition, **les anciennes colonnes sont conservées** en BDD.
La page publique et l'éditeur utilisent uniquement le nouveau modèle.

**À faire au cleanup** :

1. Vérifier qu'aucune query côté code (`grep -r "hero_photo_url\|histoire_photo_url\|univers_photos_urls"`) ne lit ces colonnes.
2. Migration SQL : `ALTER TABLE maquettes DROP COLUMN hero_photo_url, DROP COLUMN histoire_photo_url, DROP COLUMN univers_photos_urls;`
3. Retirer les champs `@deprecated` correspondants dans `types/index.ts` (interface `Maquette`).
4. Retirer le double-fill dans `generateInitialMaquette` (s'il est encore en place).
5. Retirer le bouton + route handler de migration `/api/admin/migrate-maquettes-photos` (one-shot, plus utile une fois la BDD migrée).
6. Retirer la fonction `migrateLegacyPhotos` dans `lib/maquette/photos/build.ts` et ses tests.

**Condition d'éligibilité** : 2 à 3 mois après la mise en production du nouveau modèle, et après confirmation visuelle qu'au moins 5 maquettes utilisent correctement le nouveau modèle (idéalement avec uploads manuels mêlés aux photos Google).

**Risque si on traîne** : faible. La duplication coûte ~3 colonnes JSONB nullables par maquette et un peu de complexité dans `generateInitialMaquette`.

---

## Alerte avant publication — slots univers sans photo (Session 3.4+)

**Date d'introduction** : 2026-05-06

**Contexte** : depuis la Session 3.1, la page publique `/demos/[slug]` rend
les 5 cartes Univers même quand la photo correspondante n'est pas assignée
(slot vide → placeholder neutre cream). C'est volontaire pour ne pas casser
la mise en page si l'admin oublie une assignation.

**À faire en Session 3.4 (PhotoManager) ou 3.5 (Polish)** :

Avant de cliquer "Publier" dans l'éditeur, afficher un avertissement non
bloquant si un ou plusieurs slots `univers_1..5` ont `photo_id: null` :

> ⚠️ **3 cartes Univers sont sans photo** (Univers 2, 4, 5).
> La maquette s'affichera avec des placeholders neutres à ces emplacements.
> Tu peux publier quand même, ou compléter les assignations dans la section Photos.

L'avertissement doit être :

- Non bloquant : l'admin garde la main sur la publication
- Visible à proximité du bouton "Publier" (pas dans une modale séparée)
- Précis : citer les slots manquants, pas juste "il manque des photos"

**Condition d'éligibilité** : à coder dès la Session 3.4 (PhotoManager) en
même temps que le drag & drop.

