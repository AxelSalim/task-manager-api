# 📋 Plan de Développement - Task Manager Desktop

> Application de gestion de tâches inspirée de TickTick, en version desktop exécutable

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
- [ ] Supprimer `firebase-admin` des dépendances
- [ ] Supprimer `backend/config/firebase.js`
- [ ] Supprimer `backend/services/firebaseService.js`
- [ ] Supprimer `backend/models/firebase/` (tous les fichiers)
- [ ] Adapter `backend/models/User.js` (Sequelize) pour utiliser SQLite
- [ ] Adapter `backend/models/Task.js` (Sequelize) pour utiliser SQLite
- [ ] Adapter `backend/models/PasswordReset.js` (Sequelize) pour utiliser SQLite
- [ ] Mettre à jour tous les contrôleurs pour utiliser les modèles Sequelize

#### 1.3 Remplacement de Cloudinary par Stockage Local
- [ ] Supprimer `cloudinary` des dépendances
- [ ] Supprimer `backend/config/cloudinary.js`
- [ ] Supprimer `backend/services/cloudinaryService.js`
- [ ] Créer `backend/services/storageService.js` pour le stockage local
- [ ] Créer la structure de dossiers `data/storage/avatars/`
- [ ] Adapter `backend/controllers/user.controller.js` pour le stockage local
- [ ] Adapter le middleware `backend/middlewares/upload.js` si nécessaire
- [ ] Tester l'upload et la suppression de fichiers locaux

#### 1.4 Enrichissement du Modèle Task (MVP)
- [ ] Ajouter le champ `description` (TEXT) à la table `tasks`
- [ ] Ajouter le champ `priority` (TEXT: 'low', 'normal', 'high', 'urgent') à la table `tasks`
- [ ] Ajouter le champ `dueDate` (DATETIME, nullable) à la table `tasks`
- [ ] Ajouter le champ `status` (TEXT: 'todo', 'in-progress', 'done') à la table `tasks`
- [ ] Créer une migration pour ces nouveaux champs
- [ ] Mettre à jour le modèle Sequelize `backend/models/Task.js`
- [ ] Mettre à jour `backend/controllers/task.controller.js` pour gérer ces champs

### Phase 2 : Setup Electron

#### 2.1 Configuration Electron de Base
- [ ] Installer `electron` et `electron-builder` (devDependencies)
- [ ] Créer `electron/main.js` (processus principal)
- [ ] Créer `electron/preload.js` (bridge sécurisé)
- [ ] Créer `electron/utils/database.js` (gestion SQLite côté Electron)
- [ ] Créer `electron/utils/storage.js` (gestion fichiers côté Electron)
- [ ] Configurer `package.json` avec les scripts Electron
- [ ] Configurer `electron-builder` pour le packaging
- [ ] Tester le lancement de l'application Electron

#### 2.2 Intégration Backend dans Electron
- [ ] Démarrer le serveur Express dans le processus principal Electron
- [ ] Configurer le port dynamique pour éviter les conflits
- [ ] Tester l'API locale depuis Electron
- [ ] Gérer l'arrêt propre du serveur à la fermeture de l'app

### Phase 3 : Frontend MVP

#### 3.1 Setup Frontend de Base
- [ ] Créer le dossier `frontend/` avec Next.js ou React + Vite
- [ ] Installer les dépendances : `shadcn/ui`, `formik`, `yup`, `lucide-react`
- [ ] Configurer Tailwind CSS
- [ ] Configurer shadcn/ui (initialiser)
- [ ] Créer la structure de dossiers frontend
- [ ] Configurer le routing

#### 3.2 Authentification Frontend
- [ ] Créer la page de connexion (`/login`)
- [ ] Créer la page d'inscription (`/register`)
- [ ] Créer le composant de formulaire avec Formik + Yup
- [ ] Implémenter la gestion du token JWT (localStorage)
- [ ] Créer un contexte d'authentification
- [ ] Créer un middleware de protection des routes
- [ ] Tester le flux d'authentification complet

#### 3.3 Interface Principale (Layout)
- [ ] Créer le composant `Header` (barre supérieure)
- [ ] Créer le composant `Sidebar` (menu latéral)
- [ ] Créer le layout principal avec Header + Sidebar + Content
- [ ] Ajouter la navigation entre les pages
- [ ] Implémenter le mode sombre/clair (optionnel pour MVP)

#### 3.4 Vue Liste des Tâches (MVP)
- [ ] Créer la page principale `/tasks`
- [ ] Créer le composant `TaskList` (liste des tâches)
- [ ] Créer le composant `TaskCard` (carte de tâche)
- [ ] Implémenter l'affichage des tâches (GET /api/tasks)
- [ ] Ajouter les filtres basiques (toutes, en cours, terminées)
- [ ] Implémenter le tri (par date, priorité)

#### 3.5 CRUD Tâches Frontend
- [ ] Créer le formulaire de création de tâche (modal ou page)
- [ ] Créer le formulaire d'édition de tâche
- [ ] Implémenter la création (POST /api/tasks)
- [ ] Implémenter la mise à jour (PUT /api/tasks/:id)
- [ ] Implémenter la suppression (DELETE /api/tasks/:id)
- [ ] Implémenter le changement de statut (rapide)
- [ ] Ajouter la validation avec Formik + Yup
- [ ] Gérer les erreurs et les messages de succès

#### 3.6 Profil Utilisateur (MVP)
- [ ] Créer la page `/profile`
- [ ] Afficher les informations utilisateur
- [ ] Permettre la modification du nom
- [ ] Permettre le changement d'avatar (upload local)
- [ ] Tester l'upload d'avatar

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
- [ ] Ajouter le champ `subtasks` (JSON) à la table `tasks`
- [ ] Créer une migration pour `subtasks`
- [ ] Mettre à jour le modèle Task
- [ ] Créer l'endpoint API pour gérer les sous-tâches
- [ ] Créer le composant `SubtaskList` dans le frontend
- [ ] Implémenter l'ajout/suppression de sous-tâches
- [ ] Implémenter le toggle (cocher/décocher)
- [ ] Afficher la progression (X/Y sous-tâches complétées)

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
- [ ] Ajouter le champ `attachments` (JSON) à la table `tasks`
- [ ] Créer la structure de dossiers `data/storage/attachments/`
- [ ] Créer l'endpoint API pour upload de pièces jointes
- [ ] Créer l'endpoint API pour suppression de pièces jointes
- [ ] Créer le composant `AttachmentList` dans le frontend
- [ ] Implémenter l'upload multiple
- [ ] Implémenter la prévisualisation (images)
- [ ] Implémenter le téléchargement

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

#### 6.4 Focus Mode
- [ ] Créer la page `/focus`
- [ ] Créer le composant `FocusView`
- [ ] Implémenter l'affichage d'une seule tâche en plein écran
- [ ] Masquer les distractions
- [ ] Ajouter le timer Pomodoro intégré (voir Phase 7)
- [ ] Permettre la navigation entre les tâches

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
- [ ] Permettre de lancer un Pomodoro depuis une tâche
- [ ] Afficher le timer dans la vue Focus
- [ ] Afficher le timer dans la TaskCard
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
- [ ] Créer la table `habits` (id, userId, name, description, frequency, streak, lastCompleted)
- [ ] Créer la table `habit_logs` (id, habitId, completedAt, notes)
- [ ] Créer les modèles Sequelize `Habit.js` et `HabitLog.js`
- [ ] Créer les endpoints API (CRUD habits, log completion)
- [ ] Implémenter le calcul automatique des streaks

#### 9.2 Interface Frontend
- [ ] Créer la page `/habits`
- [ ] Créer le composant `HabitList`
- [ ] Créer le composant `HabitCard`
- [ ] Implémenter l'affichage des streaks
- [ ] Implémenter la complétion d'une habitude
- [ ] Créer un calendrier de complétion (heatmap)
- [ ] Afficher les statistiques d'habitudes

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
- [ ] Permettre le changement de mot de passe
- [ ] Permettre la suppression du compte
- [ ] Implémenter la confirmation avant suppression
- [ ] Nettoyer toutes les données associées

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

#### 16.1 Configuration Electron Builder
- [ ] Configurer pour Windows (.exe)
- [ ] Configurer pour macOS (.dmg) si nécessaire
- [ ] Configurer pour Linux (.AppImage) si nécessaire
- [ ] Ajouter une icône d'application
- [ ] Configurer les métadonnées (version, description, etc.)

#### 16.2 Tests de Distribution
- [ ] Tester l'installation sur une machine vierge
- [ ] Vérifier que toutes les dépendances sont incluses
- [ ] Tester la mise à jour de l'application
- [ ] Vérifier la taille de l'exécutable
- [ ] Optimiser la taille si nécessaire

#### 16.3 Finalisation
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

## 🎯 Priorités

1. **MVP** : Fonctionnalités essentielles pour une utilisation de base
2. **Phase 5-6** : Enrichissement des tâches et vues multiples (haute valeur)
3. **Phase 7-9** : Pomodoro, Templates, Habitudes (valeur ajoutée)
4. **Phase 10-12** : Recherche, Stats, Paramètres (amélioration UX)
5. **Phase 13-16** : Polish, Tests, Packaging (finalisation)

---

## 📝 Notes

- Cocher les cases `[ ]` au fur et à mesure de l'avancement
- Prioriser le MVP pour avoir une version fonctionnelle rapidement
- Itérer sur les fonctionnalités complètes selon les besoins
- Tester régulièrement pour éviter l'accumulation de bugs

---

**Dernière mise à jour** : 2025-01-16

