# CONTEXT.md — Intégration Sirene & PageSpeed

> **Handoff doc** pour développeur·euse non spécialiste reprenant le code.
> Couvre uniquement le périmètre du chantier *Sirene + PageSpeed*.
> Pour le périmètre général Sigweb, voir `CLAUDE.md`.

---

## Vue d'ensemble

Deux API externes intégrées au CRM pour mieux qualifier les prospects :

| Source | Rôle | Statut Lot 1 |
| --- | --- | --- |
| **INSEE Sirene** (via data.gouv.fr) | Sourcing par zone + activité + enrichissement légal (SIRET, NAF, date de création, état administratif) | ✅ Sourcing + import + dédup. Enrichissement fiche existante = Lot 2 |
| **Google PageSpeed Insights v5** | Score perf d'un site existant (mobile + desktop) | ✅ Adaptateur + cron batch. Branchement scoring = Lot 2 |

Toutes les fonctionnalités existantes (sourcing Google, scoring `score_besoin_web`) restent **strictement inchangées**.

---

## Variables d'environnement

| Nom | Obligatoire | Valeur par défaut | Rôle |
| --- | --- | --- | --- |
| `CRON_SECRET` | Pour les crons | — | Header `Authorization: Bearer …` exigé par `/api/cron/*` |
| `GOOGLE_PAGESPEED_API_KEY` | Pour PageSpeed | — | Clé API Google. Sans elle, l'adaptateur retourne `not_configured` |
| `SIGWEB_RECAP_TO_EMAIL` | Non | `siguenza.sebastien@gmail.com` | Destinataire récap quotidien CRM v3 (hors périmètre Sirene) |

Pas de clé pour Sirene : on utilise `recherche-entreprises.api.gouv.fr` (data.gouv.fr), sans authentification.

---

## Migration SQL à exécuter

Avant le merge en production, exécuter dans Supabase SQL Editor :

```sql
-- Voir le fichier exact : supabase/migrations/crm_sirene_pagespeed.sql
```

La migration est **idempotente** (toutes les commandes utilisent `IF NOT EXISTS` / `DROP+ADD CONSTRAINT`). Elle :

1. Ajoute à `prospects` les colonnes Sirene : `siret` (unique partiel), `code_naf`, `libelle_naf`, `date_creation`, `tranche_effectif`, `etat_administratif`, `sirene_raw jsonb`, `sirene_enriched_at`.
2. Étend la `CHECK source` avec `'sirene'` et `'both'`.
3. Ajoute les colonnes PageSpeed : `pagespeed_score_perf`, `pagespeed_score_mobile`, `pagespeed_analyzed_at`, `pagespeed_status`, `pagespeed_raw jsonb`.
4. Ajoute `dedup_warning text` pour signaler les doublons potentiels nom+CP à vérifier manuellement.

Aucune colonne existante n'est touchée.

---

## Architecture du code ajouté

```
lib/
├── sirene/
│   ├── sirene.ts             # Adaptateur API data.gouv.fr (search + enrich)
│   ├── sirene.test.ts        # 18 tests (mocks fetch, dégradation gracieuse)
│   ├── naf-mapping.ts        # ProspectCategorie → codes NAF rev2
│   ├── normalize-name.ts     # Normalisation nom pour dédup conservatrice
│   └── normalize-name.test.ts # 8 tests
├── enrichment/
│   ├── pagespeed.ts          # Adaptateur Google PageSpeed v5
│   └── pagespeed.test.ts     # 17 tests
├── actions/
│   └── sirene-sourcing.ts    # Server actions : run + import + dédup SIRET
└── crm/
    ├── canal-badge.ts        # Dérivation canal recommandé (joignabilité)
    └── canal-badge.test.ts   # 8 tests

app/
├── api/cron/
│   └── pagespeed-batch/      # Cron quotidien (3h UTC) qui traite les pending
└── admin/(protected)/crm/sourcing/
    ├── SourcingPage.tsx      # Container minimaliste avec onglets Google/Sirene
    ├── GoogleSourcingForm.tsx # Extraction 1:1 de l'ancien SourcingPage
    └── SireneSourcingForm.tsx # Nouveau formulaire Sirene + résultats + import

supabase/migrations/
└── crm_sirene_pagespeed.sql  # Migration idempotente unique

tests/stubs/
└── server-only.ts            # Stub inerte pour vitest (le vrai paquet throw en CSR)
```

---

## Extension de la page sourcing

Le brief exigeait : « le sourcing Sirene vit *dans* la page sourcing existante, pas dans un nouvel écran ».

Implémentation : la page `/admin/crm/sourcing` est devenue un **container avec onglets**. Le composant historique a été extrait sans modification fonctionnelle dans `GoogleSourcingForm.tsx`. Le nouveau `SireneSourcingForm.tsx` est ajouté à côté. Bascule par clic d'onglet, state UI 100 % indépendant entre les deux flux.

**Sourcing Google : strictement aucun changement de comportement.**

---

## Logique de dédup (CRITIQUE)

À l'import depuis Sirene, on cherche un prospect existant en 2 passes :

### 1. Match SIRET fort

Si `prospects.siret = sirene.siret` → **UPDATE** de la fiche existante :
- Colonnes Sirene mises à jour (sirene_raw, code_naf, libelle_naf, etc.)
- `source` passe à `'both'` si elle était `'sourcing'`/`'enrichissement'` (vraie fusion cross-canal)
- `sirene_enriched_at = now()`
- Pas de doublon créé

### 2. Match conservateur nom+CP

Si pas de SIRET commun mais qu'un prospect avec **nom normalisé identique** ET **même code postal** existe, on **INSERT comme nouveau prospect** avec `dedup_warning` rempli :

> `"Doublon potentiel : nom + CP correspondent à <uuid>. À vérifier manuellement."`

L'admin peut filtrer cette liste pour fusionner à la main si pertinent. **Pas de fusion automatique** : éviter les faux positifs irréversibles.

La normalisation (`lib/sirene/normalize-name.ts`) est volontairement conservatrice :
- lowercase + trim
- Supprime les formes juridiques (SARL, SAS, EURL…) en **mots entiers**
- Apostrophes/tirets/virgules → espaces
- Pas de stemming, pas de Levenshtein, pas de suppression d'accents (« Dupont » ≠ « Dupond »)

---

## Badge canal recommandé (joignabilité)

Calcul **dynamique** dans `lib/crm/canal-badge.ts`, **pas de colonne BDD**. La logique se base sur la présence/absence de `email`, `telephone`, `site_existant_url`, `instagram_url`, `facebook_url`.

| Cas | Canal recommandé | Couleur | Affiché |
| --- | --- | --- | --- |
| Aucun contact | `terrain` | orange | ✅ (alerte) |
| Email présent | `distance` | vert | ❌ (cas normal) |
| Téléphone seul | `mixte` (appel) | bleu | ❌ |
| Web/social seul | `mixte` (à choisir) | gris | ❌ |

Le badge n'apparaît que dans le cas `terrain` pour ne pas surcharger l'UI sur les prospects classiques. Présent dans : la liste CRM desktop (picto 📍 à côté du nom), la carte mobile (Badge orange), la fiche prospect (encadré orange dédié avec suggestion d'action).

**Distinction NON FUSIONNABLE rappelée par le brief :**
- `score_besoin_web` = BESOIN (potentiel commercial)
- Badge canal = JOIGNABILITÉ (comment l'aborder)
- Un commerce neuf Sirene peut avoir un fort besoin ET aucune joignabilité distance.

---

## Cron PageSpeed batch

`/api/cron/pagespeed-batch` — déclaré dans `vercel.json` à `0 3 * * *` (3h UTC, choisi pour ne pas concurrencer le `daily-recap` à 8h UTC ni l'usage en journée).

Traitement :
1. SELECT prospects WHERE `pagespeed_status='pending'` AND `site_existant_url IS NOT NULL`, ORDER BY `pagespeed_analyzed_at NULLS FIRST`, LIMIT 20
2. Pour chaque ligne : `analyzeUrl(url)` (mobile puis desktop, perf = min)
3. UPDATE `pagespeed_status='done'/'error'` + scores + `pagespeed_raw`
4. Délai de 1 s entre chaque appel (respect rate limit Google)

**Économies :**
- Si mobile échoue → pas d'appel desktop (économise 1 appel Google)
- Si pas de clé `GOOGLE_PAGESPEED_API_KEY` → status reset à `null` (pas d'erreur facturée)
- Cache 30 jours côté logique applicative (à appliquer dans le déclencheur de `pending`, prévu Lot 2)

---

## Dégradation gracieuse

Garantie sur tous les chemins externes :
- **Sirene** : tous les chemins de `sirene.ts` retournent `{ok: true, data}` ou `{ok: false, reason: 'network'|'http'|'timeout'|'parse'|'rate_limited'|'not_found'}`. Aucun throw vers le caller.
- **PageSpeed** : idem + `'not_configured'` (pas de clé) et `'invalid_url'`.
- **Server actions** : les `reason` sont traduits en libellés humains côté UI (« Service indisponible. Réessaye dans quelques minutes. »). Aucune stack trace exposée.
- **Layout admin** : `buildDailyRecap()` enveloppé dans try/catch (n'a rien à voir avec Sirene mais même principe pour le récap quotidien).
- **Le CRM tourne à l'identique si les API sont absentes ou en panne.** Les colonnes Sirene/PageSpeed restent `null`, signalées dans l'UI comme « non analysé ».

---

## Hors périmètre Lot 1 (Lot 2 à venir)

1. **Branchement scoring** dans `score_besoin_web` :
   - Sirene : `etat_administratif != 'A'` → exclu / score nul. Commerce récent + sans site → +1 point « besoin première présence web ».
   - PageSpeed : signal PARTIEL, pas un verdict. Malus modéré sur `pagespeed_score_perf` seul. Pondérer `pagespeed_score_mobile` (plus révélateur pour les commerces locaux). **Un site rapide peut être visuellement dépassé et mériter quand même une refonte** (cas Sabathé). Garder besoin ≠ joignabilité.
2. **Enrichissement Sirene d'un prospect existant** : bouton « Enrichir Sirene » sur la fiche (utilise `enrichBySiret`).
3. **Bouton « Analyser le site »** sur la fiche prospect : pose `pagespeed_status='pending'`, le cron prend.
4. **Filtre liste CRM** : afficher uniquement les `dedup_warning IS NOT NULL` pour traiter les doublons potentiels.

---

## Tests

545 tests verts (76 nouveaux : 18 Sirene + 17 PageSpeed + 8 normalize-name + 8 canal-badge + autres).

Stub `server-only` pour vitest : `tests/stubs/server-only.ts`, mappé via `vitest.config.ts`. Le vrai paquet throw dès qu'il est importé en CSR ; le stub est un module vide pour le runner uniquement. **La garde production reste assurée par Next.js à la build**.

---

## Photos maquettes — refs Google qui expirent (PR #43 + PR de reprise)

### Symptôme

Certaines maquettes envoyées au prospect (ex. `/demos/le-joug`) finissent par afficher des trous ou des placeholders à la place du hero et des photos d'univers, alors qu'elles étaient parfaites à la génération.

Le proxy live `/api/demos/photo?ref=places/X/photos/Y` renvoie **502 "Photo unavailable"** quand on le sollicite plusieurs semaines après la création.

### Root cause

Les refs Google Places (`places/X/photos/Y`) renvoyées par `getPlaceDetails(placeId)` au moment du sourcing **ne sont pas permanentes**. Elles expirent au bout de quelques semaines/mois. Google n'offre aucune garantie de durée.

Jusqu'à PR #43, `buildInitialPhotoData` stockait ces refs **telles quelles** dans `available_photos[].reference` avec `source: 'google'`. Le rendu (`Hero.tsx`, galerie) routait toute ref Google vers `/api/demos/photo` (le proxy live). Quand la ref expirait, l'image cassait.

Seules les photos uploadées **manuellement** par l'admin via le PhotoManager étaient persistées sur Supabase Storage (`uploadMaquettePhoto` → bucket `maquettes-assets/photos/`), donc seules celles-là survivaient au temps.

### Parade — Bascule "tout Supabase" à la génération (PR #43)

À la création d'une maquette (`createMaquetteFromProspect` dans `lib/actions/maquette.ts`), juste après l'INSERT :

1. On parcourt `available_photos` et pour chaque entrée `source: 'google'` :
   - Téléchargement du buffer via `fetchGooglePhotoBuffer(ref)`
   - Conversion WebP via `sharp` (max 1920px, qualité 82, EXIF auto-rotate)
   - Upload dans `maquettes-assets/photos/{maquetteId}/{photoId}.webp`
   - Mutation de l'entrée : `source: 'upload'`, `reference: <URL Supabase publique>`
2. Si au moins une photo a été persistée, UPDATE de `maquettes.available_photos` (+ champs legacy `hero_photo_url`, `histoire_photo_url`, `univers_photos_urls` pour cohérence).

Logique dans `lib/maquette/photos/persist-google-refs.ts`. **Best-effort** : un échec sur une photo (timeout, ref déjà invalide, etc.) garde l'entrée Google d'origine — la maquette est créée quoi qu'il arrive, juste avec une fragilité résiduelle sur les photos en échec. Idempotent (`upsert: true` côté Storage).

À l'affichage d'une maquette générée après PR #43 : aucune requête `/api/demos/photo`. Les `reference` pointent directement vers `https://*.supabase.co/storage/...webp`.

### Reprise des maquettes existantes (PR Persist Google Photos)

Pour réparer le passif (maquettes créées avant PR #43), route admin :

```
POST /api/admin/maquettes/persist-google-photos?dryRun=1
```

Implémentée dans `app/api/admin/maquettes/persist-google-photos/route.ts`. Pilotée depuis `/admin/crm` via le bouton **"Persister photos Google (N)"** (composant `PersistGooglePhotosButton.tsx`).

Par maquette :
1. **Tentative directe** sur les refs Google présentes dans le pool.
2. **Re-fetch fresh refs** : pour les entrées qui échouent ET si le prospect a un `google_place_id`, on appelle `getPlaceDetails(placeId)` **une seule fois** par maquette pour obtenir des refs fraîches, puis on tente celles-ci sur les entrées en échec (dans l'ordre).
3. **Échec irréversible** : l'entrée Google d'origine reste dans le pool — la maquette n'est jamais cassée par la reprise.

Garde-fous :
- **Dry-run via `?dryRun=1`** : aucune écriture (BDD ni Storage). ⚠️ Les fetch Google sont quand même exécutés (coût identique) pour produire un aperçu fiable du taux de succès.
- **Idempotent** : les entrées `source: 'upload'` sont ignorées.
- **Lock optimiste** sur `maquettes.updated_at` pour ne pas écraser un admin en édition simultanée.
- **Throttling** : 250ms entre maquettes (politesse Google).
- **Streaming NDJSON** : suivi temps réel côté UI (slug + compteur).

### Choix de design notés au passage

- Le champ legacy `hero_photo_url`/`histoire_photo_url`/`univers_photos_urls` n'est **plus lu côté rendu** (commenté explicitement dans `Hero.tsx`) mais on continue de l'aligner pour ne pas surprendre un import legacy hypothétique. Suppression possible en même temps que la cleanup générale (cf. `CLEANUP-TODO.md`).
- On utilise `sharp` directement (pas `processPhotoBuffer`) parce que ce dernier est **strict** (refus 4MB+, < 400px, formats non JPEG/PNG/WebP…) — adapté aux uploads admin mais pas à ce que Google peut renvoyer.
- Le proxy live `/api/demos/photo` n'est PAS supprimé : il reste utile pour les rares maquettes en échec irréversible où la ref Google tient encore.
