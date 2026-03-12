# CLAUDE.md

## Projet

Nom du projet : Sigweb

Sigweb est un site vitrine / portfolio pour une activité de création de sites internet à destination de petits commerces locaux :
- boulangeries
- pâtisseries
- boucheries
- salons de coiffure
- commerces de proximité
- artisans locaux

Le site doit aussi servir de démonstration commerciale :
- montrer un design clair, rassurant et professionnel
- montrer que les contenus peuvent être administrables
- prouver qu'un commerçant peut rester autonome sur certains contenus

## Objectifs métier

Le site doit :
1. présenter l'activité Sigweb
2. rassurer des commerçants peu techniques
3. mettre en avant des simulations et réalisations
4. valoriser la possibilité de rendre le contenu administrable
5. permettre une prise de contact simple
6. être évolutif sans refonte complète

## Cible

La cible n'est pas une startup ni une entreprise tech.
La cible est composée de commerçants et artisans qui ont peu de temps.

Le ton, le design et les textes doivent être :
- simples
- concrets
- rassurants
- pédagogiques
- sans jargon technique inutile

Toujours éviter :
- vocabulaire startup
- formulations trop premium
- discours trop abstrait
- effets visuels trop agressifs

## Promesse produit

Sigweb crée des sites :
- beaux
- simples
- utiles
- administrables
- pensés pour des petits commerces

Le site doit clairement faire comprendre qu'un commerçant peut, selon le projet, rester autonome pour modifier :
- horaires
- actualités
- photos
- produits
- prestations
- informations pratiques

## Stack imposée

- Next.js récent avec App Router
- TypeScript
- Tailwind CSS
- Supabase
- Supabase Auth pour l'admin
- architecture propre et maintenable

## Contraintes d'architecture

Toujours privilégier :
- composants réutilisables
- séparation claire entre UI, data et logique
- code lisible
- noms explicites
- fichiers bien organisés
- base saine pour évoluer

Éviter :
- sur-ingénierie
- patterns inutilement complexes
- dépendances superflues
- duplication de logique
- composants gigantesques

## Architecture attendue

Le projet doit contenir :
- une partie publique
- une partie admin protégée
- une intégration Supabase propre
- une gestion de contenu simple

Arborescence cible recommandée :
- app/
- components/
- lib/
- types/
- public/

## Contenus administrables

Pour la V1, rendre administrable en priorité :
- simulations
- réalisations
- messages de contact côté lecture admin

Ne pas chercher à rendre tout le site administrable dès le départ.

Le contenu statique initial peut rester codé en dur si cela simplifie la V1 :
- hero
- bénéfices
- méthode
- présentation activité

## Données attendues

### Table projects
Doit permettre de gérer simulations et réalisations.

Champs minimum :
- id
- title
- slug
- business_type
- short_description
- content
- cover_image_url
- external_url
- project_kind
- published
- created_at
- updated_at

project_kind doit permettre au minimum :
- simulation
- realisation

### Table contacts
Champs minimum :
- id
- name
- business_name
- email
- phone
- business_type
- message
- is_read
- created_at

## Pages publiques attendues

- /
- /simulations
- /realisations
- /methode
- /contact

## Attentes UI

Le design doit être :
- chaleureux
- simple
- crédible
- artisanal moderne
- lisible rapidement

### Palette
- primaire : #2f6f4f
- secondaire : #d98a3d
- fond : #f6f3eb
- texte : #1e1e1e
- CTA : #e26d2f

### Typographies
- titres : Nunito
- texte : Inter

### Style visuel
- coins arrondis
- cartes douces
- ombres légères
- sections aérées
- hiérarchie claire
- pas de look startup agressif
- pas de luxe inutile
- pas d'interface froide

## Règles de copywriting

Toujours écrire pour un artisan/commerçant.

Préférer :
- "site simple à gérer"
- "informations faciles à trouver"
- "présenter vos produits ou prestations"
- "site administrable pour rester autonome"
- "commande simple" / "click & collect" expliqué sans jargon

Éviter :
- "stack moderne"
- "scalable"
- "écosystème digital"
- "transformation numérique"
- "solution omnicanale"

Le ton doit rester :
- clair
- direct
- professionnel
- accessible

## Sécurité

La cybersécurité est un prérequis systématique.

Tout formulaire ou input utilisateur doit intégrer :
- validation stricte
- sanitation des inputs
- protection XSS
- aucune confiance excessive accordée au client
- logique sensible côté serveur
- protection anti-spam simple
- bonnes pratiques sur auth et accès admin

Toujours vérifier :
- permissions
- validation
- accès admin
- robustesse des mutations
- exposition minimale des données

## Formulaire de contact

Le formulaire doit :
- être simple visuellement
- être stocké en base
- être validé proprement
- gérer les erreurs proprement
- afficher un succès clair
- intégrer un honeypot anti-spam simple

## Admin

L'admin doit être :
- protégé par authentification
- simple
- clair
- pratique

Fonctions minimum :
- lister les projets
- créer un projet
- modifier un projet
- supprimer un projet
- publier / dépublier si simple à faire
- consulter les demandes de contact

## SEO / accessibilité / performance

Toujours inclure :
- balises title et description cohérentes
- HTML sémantique
- responsive mobile propre
- alt text sur les images
- composants accessibles de base
- structure propre pour le SEO

## Méthode de travail attendue

Quand tu interviens sur ce projet :
1. respecte l'architecture existante
2. ne réorganise pas tout sans nécessité
3. n'ajoute pas de dépendance inutile
4. explique brièvement les choix si nécessaire
5. privilégie une V1 stable et lisible
6. propose des améliorations réalistes, pas théoriques

## Priorités absolues

Priorité 1 :
- clarté métier
- simplicité
- crédibilité commerciale

Priorité 2 :
- contenu administrable sur les éléments utiles
- sécurité
- maintenabilité

Priorité 3 :
- élégance technique

En cas d'arbitrage, toujours privilégier :
- simplicité
- lisibilité
- utilité concrète
- cohérence avec la cible artisan/commerçant