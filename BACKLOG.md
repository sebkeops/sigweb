# BACKLOG SIGWEB

### Statuts
🔴 À faire · 🟡 En cours · 🟢 Terminé · ⚫ Abandonné

### Priorités
🔥 P1 critique · ⚠️ P2 important · 💡 P3 améliorable · 🌱 P4 idée

---

## ⚖️ Conformité légale / RGPD

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | 🔥 P1 | Créer page `/mentions-legales` (nom, statut, hébergeur) + lien footer | `app/mentions-legales/page.tsx` · `Footer.tsx` |
| 🔴 | 🔥 P1 | Créer page `/politique-confidentialite` (finalité, durée, droits) + lien footer | `app/politique-confidentialite/page.tsx` · `Footer.tsx` |
| 🔴 | 🔥 P1 | Ajouter mention consentement RGPD dans le formulaire contact (juste avant le bouton submit) | `components/sections/ContactForm.tsx` |

---

## 🛡️ Sécurité

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | 🔥 P1 | Valider les magic bytes du fichier uploadé (pas juste le MIME client) | `lib/actions/upload.ts` |
| 🔴 | 🔥 P1 | Ajouter security headers HTTP (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) | `next.config.ts` |
| 🔴 | ⚠️ P2 | Restreindre les RLS Supabase à l'UUID admin précis (pas `authenticated` générique) | `supabase/schema.sql` |
| 🔴 | ⚠️ P2 | Rate limiting serverside sur le formulaire contact (anti-flood) | `lib/actions/contact.ts` |
| 🔴 | ⚠️ P2 | Whitelist protocole `external_url` — n'accepter que `https://` et `http://` | `lib/validations/project.ts` |
| 🔴 | ⚠️ P2 | Supprimer le log email en production dans AdminLayout | `app/admin/(protected)/layout.tsx` |

---

## 📬 Notifications

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | ⚠️ P2 | Intégrer Resend pour envoyer un email de notification à chaque nouveau message de contact | `lib/actions/contact.ts` · `.env.local` |

---

## 🔄 Robustesse fonctionnelle

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | ⚠️ P2 | Bloquer double soumission ContactForm — ajouter `disabled={pending}` sur le bouton submit | `components/sections/ContactForm.tsx` |
| 🔴 | ⚠️ P2 | Ajouter fallbacks `?? []` sur `reviews`, `highlights`, `featuredCards` dans SimulationPage | `components/simulations/SimulationPage.tsx` |
| 🔴 | 💡 P3 | Déplacer `markContactRead` de `project.ts` vers `contact.ts` | `lib/actions/project.ts` → `contact.ts` |
| 🔴 | 💡 P3 | Reset `e.target.value = ''` même en cas d'erreur upload (pas seulement en succès) | `components/admin/ProjectForm.tsx` |

---

## 📈 Conversion commerciale

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | ⚠️ P2 | Ajouter CTA de conversion en fin de page `/simulations` et `/realisations` | `app/simulations/page.tsx` · `app/realisations/page.tsx` |
| 🔴 | ⚠️ P2 | Ajouter CTA contact à la fin de chaque page simulation ("Ce site vous plaît ?") | `components/simulations/SimulationPage.tsx` |
| 🔴 | 💡 P3 | Rendre la section Autonomy concrète avec des exemples d'actions réelles ("Changer horaires en 30 sec") | `components/sections/Autonomy.tsx` |
| 🔴 | 💡 P3 | Enrichir la section Trust avec des chiffres concrets (sites créés, délai de réponse) | `components/sections/Trust.tsx` |

---

## 🔧 Maintenabilité

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | ⚠️ P2 | Extraire `themes` et `businessConfigs` de SimulationPage vers `lib/simulations/config.ts` | `components/simulations/SimulationPage.tsx` |
| 🔴 | ⚠️ P2 | Créer schéma Zod pour les JSON simulations — validation à l'import, typage auto | `lib/data/simulations/index.ts` · `lib/validations/simulation.ts` |
| 🔴 | 💡 P3 | Factoriser les sections home répétitives (Constat, Benefits, LocalVisibility…) en composant `<SectionBlock>` | `components/sections/` |
| 🔴 | 💡 P3 | Créer `.env.example` avec les variables d'environnement nécessaires | racine |

---

## ♿ Accessibilité

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | ⚠️ P2 | Ajouter `aria-invalid` + `aria-describedby` sur les champs avec erreurs | `ContactForm.tsx` · `ProjectForm.tsx` |
| 🔴 | ⚠️ P2 | Fermeture menu mobile à la touche Escape | `components/layout/MobileMenu.tsx` |
| 🔴 | 💡 P3 | Ajouter un "skip to content" link pour navigation clavier | `app/layout.tsx` |
| 🔴 | 💡 P3 | Alt fallback sur `PageHero` si `imageAlt` non fourni | `components/ui/PageHero.tsx` |
| 🔴 | 💡 P3 | Respecter `prefers-reduced-motion` pour les animations | `app/globals.css` |

---

## 🔍 SEO

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | 🔥 P1 | Remplacer `https://sigweb.fr` par le vrai domaine en prod | `layout.tsx` · `page.tsx` · `sitemap.ts` · `robots.ts` |
| 🔴 | ⚠️ P2 | Redimensionner `hero-home.webp` à 1200×630 px pour l'Open Graph | `public/images/` |
| 🔴 | 💡 P3 | Ajouter `canonical` explicite sur les pages simulations dynamiques | `app/simulations/[slug]/page.tsx` |

---

## 🗄️ Base de données

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | 🔥 P1 | Exécuter la migration `add_featured_home.sql` dans l'éditeur SQL Supabase | `supabase/migrations/` |
| 🔴 | ⚠️ P2 | Vider `external_url` des simulations existantes + cocher `featured_home` sur les projets à mettre en avant | Admin Supabase |

---

## ⚡ Performance

| Statut | Priorité | Tâche | Fichier(s) |
|--------|----------|-------|------------|
| 🔴 | 💡 P3 | Migrer les images simulations vers `next/image` (actuellement `<img>` brut) | `components/simulations/SimulationPage.tsx` |

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
