# 📋 Plan de Développement - Task Manager Desktop

> **Vision** : Application type [Blitzit](https://www.blitzit.app/) — to-do list + timer, mode focus, Pomodoro, listes, notes, planification, rapports — **100 % gratuite**, sans abonnement ni limitation.

---

## 🎯 Alignement avec Blitzit (tout gratuit)

| Fonctionnalité Blitzit | Statut projet | Phase / Note |
|------------------------|---------------|--------------|
| To-do list + checklist satisfaisante | ✅ Fait (sous-tâches) | Phase 5.1 |
| **Estimer et suivre le temps** (Est: X min, Done: Y min) | ❌ À faire | Phase 5.7 (nouveau) |
| **Mode focus** (une tâche, timer visible) | ❌ À faire | Phase 6.4 |
| **Timer flottant** (toujours visible pendant le focus) | ❌ À faire | Phase 6.4 + Electron |
| **Pomodoro** (sprint travail / pause) | ❌ À faire | Phase 7 |
| Listes / catégories | 🔶 Partiel (tags) | Phase 5.2, listes dédiées optionnel |
| Notes sur les tâches (liens, texte) | ✅ Fait (description) | Phase 5.5 (markdown) |
| Planification (dates, récurrence) | ✅ Fait | Phase 5.3, 5.4 |
| Rappels / alertes | ✅ Fait (reminderDate) | Phase 5.3 |
| **Rapports** (temps par liste, ponctualité) | ❌ À faire | Phase 11 |
| Raccourcis clavier | ❌ À faire | Phase 13.1 |
| Thème sombre / clair | ❌ Optionnel MVP | Phase 12.1 |
| Export (PDF/rapports) | ❌ À faire | Phase 11 + 12.2 |

*Pas de monétisation : tout est gratuit, pas de version “pro” ou payante.*

---

## 🎯 MVP (Minimum Viable Product)

**Objectif** : Application fonctionnelle avec les fonctionnalités essentielles pour gérer des tâches localement.

### Phase 1 : Migration Base de Données et Stockage

#### 1.1 Migration vers SQLite
- [x] Installer `sqlite3` et adapter Sequelize pour SQLite
- [x] Modifier `backend/config/database.js` pour utiliser SQLite
- [x] Créer le fichier de base de données `data/task-manager.db`
- [x] Adapter les migrations existantes pour SQLite
- [x] Tester la connexion à la base de données

#### 1.2 Suppression de Firebase
- [x] Supprimer `firebase-admin` des dépendances
- [x] Supprimer `backend/config/firebase.js`
- [x] Supprimer `backend/services/firebaseService.js`
- [x] Supprimer `backend/models/firebase/` (tous les fichiers)
- [x] Adapter `backend/models/User.js` (Sequelize) pour utiliser SQLite
- [x] Adapter `backend/models/Task.js` (Sequelize) pour utiliser SQLite
- [x] Adapter `backend/models/PasswordReset.js` (Sequelize) pour utiliser SQLite
- [x] Mettre à jour tous les contrôleurs pour utiliser les modèles Sequelize

#### 1.3 Remplacement de Cloudinary par Stockage Local
- [x] Supprimer `cloudinary` des dépendances
- [x] Supprimer `backend/config/cloudinary.js`
- [x] Supprimer `backend/services/cloudinaryService.js`
- [x] Créer `backend/services/storageService.js` pour le stockage local
- [x] Créer la structure de dossiers `data/storage/avatars/`
- [x] Adapter `backend/controllers/user.controller.js` pour le stockage local
- [x] Adapter le middleware `backend/middlewares/upload.js` si nécessaire
- [x] Tester l'upload et la suppression de fichiers locaux

#### 1.4 Enrichissement du Modèle Task (MVP)
- [x] Ajouter le champ `description` (TEXT) à la table `tasks`
- [x] Ajouter le champ `priority` (TEXT: 'low', 'normal', 'high', 'urgent') à la table `tasks`
- [x] Ajouter le champ `dueDate` (DATETIME, nullable) à la table `tasks`
- [x] Ajouter le champ `status` (TEXT: 'todo', 'in-progress', 'done') à la table `tasks` (déjà présent)
- [x] Créer une migration pour ces nouveaux champs
- [x] Mettre à jour le modèle Sequelize `backend/models/Task.js`
- [x] Mettre à jour `backend/controllers/task.controller.js` pour gérer ces champs

### Phase 2 : Setup Electron

#### 2.1 Configuration Electron de Base
- [x] Installer `electron` et `electron-builder` (devDependencies)
- [x] Créer `electron/main.js` (processus principal)
- [x] Créer `electron/preload.js` (bridge sécurisé)
- [x] Créer `electron/utils/database.js` (gestion SQLite côté Electron)
- [x] Créer `electron/utils/storage.js` (gestion fichiers côté Electron)
- [x] Configurer `package.json` avec les scripts Electron
- [x] Configurer `electron-builder` pour le packaging
- [x] Tester le lancement de l'application Electron

#### 2.2 Intégration Backend dans Electron
- [x] Démarrer le serveur Express dans le processus principal Electron
- [x] Configurer le port dynamique pour éviter les conflits
- [x] Tester l'API locale depuis Electron
- [x] Gérer l'arrêt propre du serveur à la fermeture de l'app

### Phase 3 : Frontend MVP

#### 3.1 Setup Frontend de Base
- [x] Créer le dossier `frontend/` avec Next.js ou React + Vite
- [x] Installer les dépendances : `shadcn/ui`, `formik`, `yup`, `lucide-react`
- [x] Configurer Tailwind CSS
- [x] Configurer shadcn/ui (initialiser)
- [x] Créer la structure de dossiers frontend
- [x] Configurer le routing

#### 3.2 Authentification Frontend (mode desktop)
- [x] **Onboarding** : premier lancement → page « Comment vous appelez-vous ? » → création du profil (nom uniquement)
- [x] **Session desktop** : ouverture automatique si pas de PIN ; sinon écran de verrouillage
- [x] **Verrouillage PIN** : écran de déverrouillage (saisie PIN), option « Verrouiller maintenant » et définition du PIN dans le profil
- [x] Endpoints backend : `GET /profile/status`, `POST /setup`, `POST /desktop-session`, `POST /verify-pin`, `PATCH /profile/pin`
- [x] Contexte d’authentification (statuts : onboarding, locked, authenticated)
- [x] Protection des routes (redirection vers onboarding ou écran PIN si non authentifié)
- [x] Pages `/login` et `/register` redirigent vers `/` (flux desktop uniquement)
- [ ] Tester le flux complet (onboarding → Kanban → PIN → verrouiller → déverrouiller)

#### 3.3 Interface Principale (Layout)
- [x] Créer le composant `Header` (barre supérieure)
- [x] Créer le composant `Sidebar` (menu latéral)
- [x] Créer le layout principal avec Header + Sidebar + Content
- [x] **Navigation actuelle** : Kanban (vue principale), Calendrier ; pas de liens « Aujourd’hui », « Tâches » ni « Tags » (les tags se gèrent dans le Kanban)
- [x] La route `/tasks` redirige vers `/kanban`
- [ ] Implémenter le mode sombre/clair (optionnel pour MVP)

#### 3.4 Vue principale : Kanban (MVP)
- [x] La vue principale des tâches est le **Kanban** (`/kanban`) ; `/tasks` redirige vers `/kanban`
- [x] Créer le composant `TaskList` / listes utilisées dans le Kanban
- [x] Créer le composant `TaskCard` (carte de tâche, utilisé dans Kanban)
- [x] Implémenter l'affichage des tâches (GET /api/tasks)
- [x] Filtres et tri disponibles dans le Kanban (colonnes par statut)

#### 3.5 CRUD Tâches Frontend
- [x] Créer le formulaire de création de tâche (modal ou page)
- [x] Créer le formulaire d'édition de tâche
- [x] Implémenter la création (POST /api/tasks)
- [x] Implémenter la mise à jour (PUT /api/tasks/:id)
- [x] Implémenter la suppression (DELETE /api/tasks/:id)
- [x] Implémenter le changement de statut (rapide)
- [x] Ajouter la validation avec Formik + Yup
- [x] Gérer les erreurs et les messages de succès

#### 3.6 Profil Utilisateur (MVP)
- [x] Créer la page `/profile`
- [x] Afficher les informations utilisateur
- [x] Permettre la modification du nom
- [x] Permettre le changement d'avatar (upload local)
- [x] Tester l'upload d'avatar

### Phase 4 : Tests et Finalisation MVP

#### 4.1 Tests Fonctionnels
- [ ] Tester l'authentification complète
- [ ] Tester le CRUD des tâches
- [ ] Tester l'upload d'avatar
- [ ] Tester la persistance des données (redémarrage app)
- [ ] Tester sur différentes tailles d'écran

#### 4.2 Packaging et Distribution
- [ ] Configurer `electron-builder` pour Windows
- [ ] Tester la génération de l'exécutable (.exe)
- [ ] Vérifier que toutes les données sont incluses
- [ ] Tester l'installation et le lancement de l'exécutable
- [ ] Créer un README pour l'utilisation

---

## 🚀 Fonctionnalités Complètes (Post-MVP)

### Phase 5 : Fonctionnalités Avancées des Tâches

#### 5.1 Sous-tâches (Checklist)
- [x] Ajouter le champ `subtasks` (JSON) à la table `tasks`
- [x] Créer une migration pour `subtasks`
- [x] Mettre à jour le modèle Task
- [x] Créer l'endpoint API pour gérer les sous-tâches
- [x] Créer le composant `SubtaskList` dans le frontend
- [x] Implémenter l'ajout/suppression de sous-tâches
- [x] Implémenter le toggle (cocher/décocher)
- [x] Afficher la progression (X/Y sous-tâches complétées)

#### 5.2 Tags et Catégorisation
- [ ] Créer la table `tags` (id, userId, name, color)
- [ ] Créer le modèle Sequelize `Tag.js`
- [ ] Créer les endpoints API pour les tags (CRUD)
- [ ] Créer la relation many-to-many entre tasks et tags
- [ ] Créer la table de liaison `task_tags`
- [ ] Créer le composant `TagSelector` dans le frontend
- [ ] Créer le composant `TagBadge` (affichage)
- [ ] Implémenter l'ajout/suppression de tags sur une tâche
- [ ] Créer la page de gestion des tags (`/tags`)
- [ ] Implémenter le filtrage par tag

#### 5.3 Dates et Rappels
- [ ] Améliorer la gestion des `dueDate` (sélecteur de date)
- [ ] Ajouter le champ `reminderDate` à la table `tasks`
- [ ] Créer une migration pour `reminderDate`
- [ ] Implémenter le système de rappels (notifications système)
- [ ] Créer `electron/utils/notifications.js`
- [ ] Créer un service de rappels en arrière-plan
- [ ] Tester les notifications système

#### 5.4 Répétition de Tâches
- [ ] Ajouter le champ `repeatPattern` (TEXT) à la table `tasks`
- [ ] Créer une migration pour `repeatPattern`
- [ ] Créer le modèle de données pour les patterns (daily, weekly, monthly, etc.)
- [ ] Créer l'endpoint API pour gérer la répétition
- [ ] Créer le composant `RepeatSelector` dans le frontend
- [ ] Implémenter la logique de génération de tâches récurrentes
- [ ] Créer un service de génération automatique

#### 5.5 Notes et Descriptions Enrichies
- [ ] Améliorer l'éditeur de description (markdown)
- [ ] Installer `react-markdown` ou `marked`
- [ ] Créer le composant `MarkdownEditor`
- [ ] Créer le composant `MarkdownPreview`
- [ ] Implémenter l'édition en temps réel

#### 5.6 Pièces Jointes
- [x] ~~Phase non nécessaire - ignorée~~

#### 5.7 Estimation et suivi du temps (type Blitzit)
- [x] Ajouter le champ `estimatedMinutes` (INTEGER, nullable) à la table `tasks`
- [ ] Ajouter le champ `spentMinutes` (INTEGER, défaut 0) ou table `task_time_entries` pour cumul
- [x] Créer une migration pour ces champs
- [ ] Mettre à jour le modèle Task et le contrôleur (CRUD + PATCH pour temps)
- [x] Dans le frontend : afficher "Est: X min" et "Done: Y min" sur chaque tâche
- [x] Permettre de saisir l'estimation à la création/édition
- [ ] Incrémenter le temps passé quand on marque "en cours" / "terminé" ou via le timer (Phase 7)

### Phase 6 : Vues Multiples

#### 6.1 Vue Kanban
- [ ] Installer `react-beautiful-dnd` ou `@dnd-kit/core`
- [ ] Créer la page `/kanban`
- [ ] Créer le composant `KanbanBoard`
- [ ] Créer le composant `KanbanColumn`
- [ ] Implémenter le drag & drop entre colonnes
- [ ] Implémenter la mise à jour du statut via drag & drop
- [ ] Ajouter les compteurs par colonne
- [ ] Ajouter les animations fluides

#### 6.2 Vue Calendrier
- [ ] Installer `react-calendar` ou `date-fns`
- [ ] Créer la page `/calendar`
- [ ] Créer le composant `CalendarView`
- [ ] Implémenter l'affichage mensuel
- [ ] Implémenter l'affichage hebdomadaire
- [ ] Afficher les tâches sur les dates correspondantes
- [ ] Permettre la création rapide depuis le calendrier
- [ ] Implémenter la navigation (mois précédent/suivant)

#### 6.3 Vue Timeline
- [ ] Créer la page `/timeline`
- [ ] Créer le composant `TimelineView`
- [ ] Implémenter l'affichage chronologique
- [ ] Grouper par date
- [ ] Ajouter les filtres par période

#### 6.4 Focus Mode (cœur Blitzit)
- [ ] Créer la page `/focus` ou vue dédiée
- [ ] Créer le composant `FocusView` (une tâche à la fois, plein écran ou fenêtre épurée)
- [ ] **Timer flottant** : fenêtre ou panneau toujours visible avec compte à rebours (Electron : fenêtre secondaire "always on top" optionnelle)
- [ ] Masquer les distractions (sidebar, liste complète)
- [ ] Intégrer le timer Pomodoro (Phase 7) dans la vue focus
- [ ] Au démarrage du focus : lancer le timer (estimation ou Pomodoro)
- [ ] Permettre la navigation entre les tâches sans quitter le mode focus

### Phase 7 : Pomodoro Timer

#### 7.1 Timer de Base
- [ ] Créer la table `pomodoro_sessions` (id, userId, taskId, duration, completedAt)
- [ ] Créer le modèle Sequelize `PomodoroSession.js`
- [ ] Créer le composant `PomodoroTimer`
- [ ] Implémenter le timer (25/5/15 minutes)
- [ ] Implémenter le son de notification
- [ ] Implémenter la pause/reprise
- [ ] Sauvegarder les sessions en base de données

#### 7.2 Intégration avec les Tâches
- [ ] Permettre de lancer un Pomodoro depuis une tâche (bouton "Focus" / "Démarrer" sur TaskCard)
- [ ] Afficher le timer dans la vue Focus (et en fenêtre flottante si Electron)
- [ ] Afficher le timer dans la TaskCard (optionnel : mini timer ou "en cours")
- [ ] **Lier le temps Pomodoro au temps passé** : ajouter les minutes complétées à `spentMinutes` de la tâche (Phase 5.7)
- [ ] Afficher les statistiques de sessions par tâche

#### 7.3 Statistiques Pomodoro
- [ ] Créer la page `/pomodoro/stats`
- [ ] Afficher le nombre de sessions par jour/semaine/mois
- [ ] Afficher le temps total de focus
- [ ] Créer des graphiques (Chart.js ou Recharts)

### Phase 8 : Templates de Tâches

#### 8.1 Modèle et API
- [ ] Créer la table `templates` (id, userId, name, taskData)
- [ ] Créer le modèle Sequelize `Template.js`
- [ ] Créer les endpoints API (CRUD templates)
- [ ] Tester l'API

#### 8.2 Interface Frontend
- [ ] Créer la page `/templates`
- [ ] Créer le composant `TemplateList`
- [ ] Créer le formulaire de création de template
- [ ] Implémenter l'application d'un template à une nouvelle tâche
- [ ] Permettre la duplication de tâches existantes en template

### Phase 9 : Habitudes

#### 9.1 Modèle et API
- [x] Créer la table `habits` (implémenté : `Habits` avec id, userId, name, order)
- [x] Créer la table des complétions (implémenté : `HabitCompletions` avec habitId, userId, date)
- [x] Créer les modèles Sequelize `Habit.js` et `HabitCompletion.js`
- [x] Créer les endpoints API (CRUD habits, getCompletions, setCompletion)
- [ ] Implémenter le calcul automatique des streaks

#### 9.2 Interface Frontend
- [x] Créer la page `/habits`
- [x] Créer la liste d'habitudes (tableau avec lignes par habitude)
- [x] Créer l'affichage par habitude avec actions (édition, suppression)
- [ ] Implémenter l'affichage des streaks
- [x] Implémenter la complétion d'une habitude (toggle par jour)
- [x] Créer un calendrier de complétion (grille hebdomadaire)
- [x] Afficher les statistiques d'habitudes (complétées cette semaine, progression %, % par jour)

### Phase 10 : Recherche et Filtres Avancés

#### 10.1 Recherche
- [ ] Créer le composant `SearchBar`
- [ ] Implémenter la recherche par titre/description
- [ ] Implémenter la recherche par tag
- [ ] Implémenter la recherche par date
- [ ] Ajouter la recherche dans toutes les vues

#### 10.2 Filtres Avancés
- [ ] Créer le composant `FilterPanel`
- [ ] Implémenter le filtrage par statut
- [ ] Implémenter le filtrage par priorité
- [ ] Implémenter le filtrage par tag
- [ ] Implémenter le filtrage par date (échéance)
- [ ] Implémenter le filtrage combiné (multi-critères)
- [ ] Sauvegarder les filtres préférés

### Phase 11 : Statistiques et Analytics

#### 11.1 Dashboard de Statistiques
- [ ] Créer la page `/stats` ou `/dashboard`
- [ ] Afficher le nombre total de tâches
- [ ] Afficher le nombre de tâches par statut
- [ ] Afficher le nombre de tâches par priorité
- [ ] Afficher le taux de complétion
- [ ] Afficher les tâches en retard

#### 11.2 Graphiques et Visualisations
- [ ] Installer `recharts` ou `chart.js`
- [ ] Créer un graphique de complétion par jour/semaine/mois
- [ ] Créer un graphique de répartition par priorité
- [ ] Créer un graphique de répartition par tag
- [ ] Créer un graphique de productivité (Pomodoro)

### Phase 12 : Paramètres et Personnalisation

#### 12.1 Paramètres Utilisateur
- [ ] Créer la page `/settings`
- [ ] Permettre la modification du thème (sombre/clair)
- [ ] Permettre la modification des couleurs d'accent
- [ ] Permettre la modification des préférences de notification
- [ ] Permettre la modification des préférences de Pomodoro
- [ ] Sauvegarder les préférences en base de données

#### 12.2 Export/Import de Données
- [ ] Créer l'endpoint API pour export (JSON)
- [ ] Créer l'endpoint API pour import (JSON)
- [ ] Créer l'interface frontend pour export
- [ ] Créer l'interface frontend pour import
- [ ] Valider les données importées
- [ ] Gérer les conflits lors de l'import

#### 12.3 Gestion du Compte
- [x] **Mode desktop** : pas de mot de passe (profil minimal + PIN) ; script `backend/scripts/reset-password.js` pour secours si besoin
- [ ] Permettre la suppression du compte
- [ ] Implémenter la confirmation avant suppression
- [ ] Nettoyer toutes les données associées (tâches, tags, données finance si implémenté)

### Phase 13 : Améliorations UX/UI

#### 13.1 Raccourcis Clavier
- [ ] Implémenter les raccourcis globaux (Ctrl+N pour nouvelle tâche, etc.)
- [ ] Créer un composant d'aide pour afficher les raccourcis
- [ ] Documenter tous les raccourcis

#### 13.2 Animations et Transitions
- [ ] Installer `framer-motion`
- [ ] Ajouter des animations aux transitions de pages
- [ ] Ajouter des animations aux modals
- [ ] Ajouter des animations au drag & drop
- [ ] Ajouter des micro-interactions

#### 13.3 Responsive Design
- [ ] Adapter l'interface pour les petits écrans
- [ ] Implémenter un menu hamburger pour la sidebar
- [ ] Optimiser les vues pour différentes résolutions

#### 13.4 Accessibilité
- [ ] Ajouter les attributs ARIA
- [ ] Implémenter la navigation au clavier
- [ ] Tester avec un lecteur d'écran
- [ ] Améliorer les contrastes de couleurs

### Phase 14 : Optimisations et Performance

#### 14.1 Optimisation Base de Données
- [ ] Ajouter les index sur les colonnes fréquemment utilisées
- [ ] Optimiser les requêtes SQL
- [ ] Implémenter la pagination pour les grandes listes
- [ ] Implémenter le lazy loading

#### 14.2 Optimisation Frontend
- [ ] Implémenter la mise en cache avec SWR ou React Query
- [ ] Optimiser les re-renders (React.memo, useMemo, useCallback)
- [ ] Implémenter le code splitting
- [ ] Optimiser les images et assets

#### 14.3 Gestion de la Mémoire
- [ ] Vérifier les fuites de mémoire
- [ ] Optimiser le stockage des fichiers
- [ ] Implémenter le nettoyage automatique des fichiers orphelins

### Phase 15 : Tests et Documentation

#### 15.1 Tests
- [ ] Écrire les tests unitaires pour les modèles
- [ ] Écrire les tests unitaires pour les contrôleurs
- [ ] Écrire les tests d'intégration pour l'API
- [ ] Écrire les tests E2E pour le frontend (optionnel)
- [ ] Configurer un pipeline CI/CD (optionnel)

#### 15.2 Documentation
- [ ] Documenter l'API (Swagger)
- [ ] Créer un guide d'utilisation utilisateur
- [ ] Créer un guide de développement
- [ ] Documenter l'architecture
- [ ] Créer des captures d'écran pour le README

### Phase 16 : Packaging Final

#### 17.1 Configuration Electron Builder
- [ ] Configurer pour Windows (.exe)
- [ ] Configurer pour macOS (.dmg) si nécessaire
- [ ] Configurer pour Linux (.AppImage) si nécessaire
- [ ] Ajouter une icône d'application
- [ ] Configurer les métadonnées (version, description, etc.)

#### 17.2 Tests de Distribution
- [ ] Tester l'installation sur une machine vierge
- [ ] Vérifier que toutes les dépendances sont incluses
- [ ] Tester la mise à jour de l'application
- [ ] Vérifier la taille de l'exécutable
- [ ] Optimiser la taille si nécessaire

#### 17.3 Finalisation
- [ ] Créer un fichier CHANGELOG
- [ ] Créer un fichier LICENSE
- [ ] Préparer les notes de version
- [ ] Créer un guide de déploiement

---

## 📊 Estimation du Temps

### MVP
- **Phase 1** : 2-3 jours
- **Phase 2** : 1-2 jours
- **Phase 3** : 4-5 jours
- **Phase 4** : 1 jour
- **Total MVP** : **8-11 jours** (environ 2 semaines)

### Fonctionnalités Complètes
- **Phases 5-16** : 6-8 semaines supplémentaires

---

## 🎯 Priorités (orientées Blitzit, tout gratuit)

1. **MVP** : Fonctionnalités essentielles pour une utilisation de base (déjà bien avancé)
2. **Phase 5.7 + 6.4 + 7** : **Cœur Blitzit** — estimation/suivi temps, mode focus + timer flottant, Pomodoro
3. **Phase 5 (tags, rappels, récurrence, notes)** : Déjà en place ou en cours ; finaliser si besoin
4. **Phase 11** : Rapports (temps par liste/tag, ponctualité) — comme Blitzit "Reports"
5. **Phase 6 (Kanban, Calendrier)** : Vues multiples déjà prévues
6. **Phase 16** : Suivi Financier (voir `docs/SUIVI_FINANCIER_IMPLEMENTATION.md`)
7. **Phase 12-13** : Paramètres (thème sombre/clair), raccourcis clavier
8. **Phase 10, 14-15, 17** : Recherche, perf, tests, packaging

---

## 📝 Notes

- **Vision** : équivalent Blitzit, **100 % gratuit** — pas d’abonnement, pas de fonctionnalités payantes.
- Cocher les cases `[ ]` au fur et à mesure de l'avancement.
- Priorité après MVP : **estimation/suivi temps (5.7)** → **mode focus + timer flottant (6.4)** → **Pomodoro (7)** → rapports (11).
- Tester régulièrement pour éviter l'accumulation de bugs.

---

**Dernière mise à jour** : 2026-03-11

**Phase 9 Habitudes** : Modèle et API (Habits, HabitCompletions, CRUD + complétions) et interface (/habits, grille hebdo, stats basiques) marqués comme faits. Reste : calcul/affichage des streaks.

**Alignement Blitzit** : Vision et tableau de fonctionnalités ajoutés ; Phase 5.7 (estimation/suivi temps), priorités et Focus Mode (6.4) précisés pour un produit type Blitzit entièrement gratuit.

**Mode desktop** : Authentification simplifiée (onboarding au premier lancement + PIN optionnel) ; navigation réduite à Kanban et Calendrier ; vue principale = Kanban. Module Suivi Financier prévu (Phase 16, voir `docs/SUIVI_FINANCIER_IMPLEMENTATION.md`).

