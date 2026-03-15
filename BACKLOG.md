# BACKLOG SIGWEB

### Statuts
🔴 À faire · 🟡 En cours · 🟢 Terminé · ⚫ Abandonné

### Priorités
🔥 P1 critique · ⚠️ P2 important · 💡 P3 améliorable · 🌱 P4 idée

---

## 🛡️ Sécurité — Actions manuelles restantes

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | ⚠️ P2 | Exécuter `rls_admin_uuid.sql` dans Supabase après avoir remplacé l'UUID placeholder | `supabase/migrations/rls_admin_uuid.sql` |

---

## 📱 Mobile — Actions manuelles restantes

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | ⚠️ P2 | Renseigner `NEXT_PUBLIC_PHONE` et `NEXT_PUBLIC_PHONE_DISPLAY` sur Vercel | `.env.example` · Vercel dashboard |

---

## 📊 Analytics — Actions manuelles restantes

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | 💡 P3 | Créer un compte Plausible/Umami et renseigner `NEXT_PUBLIC_ANALYTICS_DOMAIN` + `NEXT_PUBLIC_ANALYTICS_SCRIPT` sur Vercel | `.env.example` · Vercel dashboard |

---

## 📬 Notifications — Actions manuelles restantes

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | ⚠️ P2 | Créer compte Resend, vérifier domaine, remplacer `from:` dans contact.ts, renseigner `RESEND_API_KEY` + `RESEND_TO_EMAIL` sur Vercel | `lib/actions/contact.ts` · Vercel dashboard |

---

## 🔍 SEO — Actions manuelles restantes

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | 🔥 P1 | Renseigner `NEXT_PUBLIC_SITE_URL=https://votre-domaine.fr` sur Vercel avant mise en ligne | Vercel dashboard |
| 🔴 | ⚠️ P2 | Ajouter `favicon.ico` (32×32 px) et `apple-touch-icon.png` (180×180 px) dans `public/` | `public/` |
| 🔴 | ⚠️ P2 | Redimensionner `hero-home.webp` à 1200×630 px pour l'Open Graph | `public/images/` |

---

## 🗄️ Base de données — Actions manuelles restantes

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | 🔥 P1 | Exécuter `add_featured_home.sql` dans l'éditeur SQL Supabase | `supabase/migrations/` |
| 🔴 | ⚠️ P2 | Vider `external_url` des simulations existantes + cocher `featured_home` sur les projets à mettre en avant | Admin Supabase |

---

## ⚖️ Légal — Contenu à compléter manuellement

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | 🔥 P1 | Remplacer les placeholders dans mentions légales (nom, statut, SIRET, adresse, email, téléphone) | `app/mentions-legales/page.tsx` |
| 🔴 | 🔥 P1 | Remplacer les placeholders dans politique de confidentialité (nom, email contact) | `app/politique-confidentialite/page.tsx` |
| 🔴 | ⚠️ P2 | Remplacer l'adresse `from:` Resend par votre domaine vérifié | `lib/actions/contact.ts` |

---

## 🌱 Évolutions futures

| Statut | Priorité | Tâche |
|--------|----------|-------|
| 🔴 | 💡 P3 | Ajouter de nouvelles simulations (menuiserie, plomberie, fleuriste…) |
| 🔴 | 💡 P3 | Page contact — ajouter un champ "Votre ville" pour qualifier les prospects |
| 🔴 | 🌱 P4 | Image OG dédiée par simulation |
| 🔴 | 🌱 P4 | Ajouter les réalisations réelles quand elles existent (section déjà prête) |
| 🔴 | 🌱 P4 | Pages de landing par zone géographique ou par type de commerce (SEO local avancé) |
| 🔴 | 🌱 P4 | Quiz "Estimez votre site" sur /contact (type commerce → exemple similaire + fourchette de prix) |

---

## 🟢 Terminé

| Tâche |
|-------|
| Architecture Next.js App Router + Supabase |
| Pages publiques : `/`, `/simulations`, `/simulations/[slug]`, `/realisations`, `/methode`, `/contact` |
| Admin protégé : gestion projets (CRUD), consultation contacts |
| Simulations dynamiques via JSON (boulangerie, pizzeria, boucherie, coiffure) |
| Champ `featured_home` — schema + migration + admin + home |
| Upload image vers Supabase Storage depuis l'admin |
| SEO local : metadata globales, par page, par simulation — Toulouse – Gers – Occitanie |
| JSON-LD `ProfessionalService` dans le layout |
| Sitemap `/sitemap.xml` et robots `/robots.txt` |
| Images hero WebP locales sur toutes les pages |
| Cartes projets alignées en hauteur (flex column + mt-auto) |
| Section simulations avant réalisations en home, centrage des vignettes (max 3) |
| Bandeau intro SEO + boutons navigation sur les pages simulations |
| Formulaire admin : `business_type` en texte libre, champ `content` supprimé |
| Champ `external_url` masqué pour les projets de type simulation |
| Audit cybersécurité / SEO / performance / accessibilité — 2026-03-15 |
| Audit conversion / RGPD / robustesse / maintenabilité — 2026-03-15 |
| Page 404 personnalisée (`app/not-found.tsx`) |
| Gestion d'erreur globale (`app/error.tsx`) |
| Barre sticky contact mobile (`StickyContactBar`) — téléphone via env var |
| Script analytics conditionnel (production uniquement) dans layout |
| Favicon + apple-touch-icon + theme-color dans metadata |
| `robots: noindex` sur les pages admin (login + protected layout) |
| Security headers HTTP (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) |
| Magic bytes validation sur l'upload d'image |
| Whitelist protocole `external_url` (https/http uniquement) |
| Suppression du log email en production dans AdminLayout |
| Pages `/mentions-legales` et `/politique-confidentialite` créées (placeholders à compléter) |
| Liens footer vers pages légales |
| Mention consentement RGPD dans le formulaire contact |
| `aria-invalid` + `aria-describedby` sur les champs en erreur du formulaire contact |
| Rate limiting serverside sur le formulaire contact (3 req / 10 min par IP) |
| Intégration Resend pour notifications email (actif si RESEND_API_KEY défini) |
| Migration RLS UUID-spécifique préparée (à exécuter manuellement dans Supabase) |
| `markContactRead` déplacé de `project.ts` vers `contact.ts` |
| CTA conversion en fin de page `/simulations` et `/realisations` |
| CTA Sigweb "Ce site vous plaît ?" en fin de chaque page simulation |
| Fallbacks `?? []` sur `reviews`, `highlights`, `featuredCards` dans SimulationPage |
| Extraction `themes` + `businessConfigs` de SimulationPage vers `lib/simulations/config.ts` |
| Schéma Zod pour les JSON simulations — validation à l'import |
| Fermeture menu mobile à la touche Escape |
| Skip-to-content link pour navigation clavier |
| `prefers-reduced-motion` respecté pour les animations |
| `canonical` explicite sur les pages simulations dynamiques |
| Alt fallback sur `PageHero` (utilise `title` si `imageAlt` absent) |
| Section Autonomy enrichie avec exemples concrets |
| Section Trust enrichie avec délais concrets (réponse 24h, mise en ligne 2–4 semaines) |
| `NEXT_PUBLIC_SITE_URL` env var pour le domaine (sitemap, robots, OG, JSON-LD) |
| `.env.example` créé avec toutes les variables nécessaires |
| `resend` installé dans les dépendances |
