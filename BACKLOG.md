# BACKLOG SIGWEB

### Statuts
🔴 À faire · 🟡 En cours · 🟢 Terminé · ⚫ Abandonné

### Priorités
🔥 P1 critique · ⚠️ P2 important · 💡 P3 améliorable · 🌱 P4 idée

---

## ⚖️ Légal — À compléter

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | ⚠️ P2 | Ajouter le SIRET dès obtention | `app/mentions-legales/page.tsx` ligne 24 |

---

## 📊 Analytics — À faire

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | 💡 P3 | Créer un compte Plausible/Umami et renseigner `NEXT_PUBLIC_ANALYTICS_DOMAIN` + `NEXT_PUBLIC_ANALYTICS_SCRIPT` sur Vercel | `.env.example` · Vercel dashboard |

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
| `icon.svg` favicon + `apple-touch-icon.png` (180×180) dans `app/` |
| `robots: noindex` sur les pages admin (login + protected layout) |
| Security headers HTTP (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) |
| Magic bytes validation sur l'upload d'image |
| Whitelist protocole `external_url` (https/http uniquement) |
| Suppression du log email en production dans AdminLayout |
| Pages `/mentions-legales` et `/politique-confidentialite` complétées (nom, adresse, email, téléphone) |
| Liens footer vers pages légales |
| Mention consentement RGPD dans le formulaire contact |
| `aria-invalid` + `aria-describedby` sur les champs en erreur du formulaire contact |
| Formulaire contact — valeurs conservées en cas d'erreur (inputs contrôlés) |
| Rate limiting serverside sur le formulaire contact (3 req / 10 min par IP) |
| Intégration Resend — compte créé, domaine vérifié, `from:` configuré, clés Vercel renseignées |
| Migration RLS UUID-spécifique exécutée dans Supabase |
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
| `NEXT_PUBLIC_SITE_URL` renseigné sur Vercel (domaine de production) |
| `NEXT_PUBLIC_PHONE` et `NEXT_PUBLIC_PHONE_DISPLAY` renseignés sur Vercel |
| `.env.example` créé avec toutes les variables nécessaires |
| `resend` installé dans les dépendances |
| `hero-home.webp` redimensionné à 1200×630 px pour l'Open Graph |
| `add_featured_home.sql` exécuté dans Supabase — `featured_home` actif en production |
| `external_url` vidé sur les simulations + `featured_home` coché sur les projets mis en avant |
| Site déployé en production sur sigweb.fr (Vercel + domaine personnalisé) |
