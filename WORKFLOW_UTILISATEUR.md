# 📋 Workflow d'Utilisation - Task Manager Desktop

Ce document décrit le processus complet d'utilisation du système Task Manager Desktop, depuis le premier lancement jusqu'à la gestion quotidienne des tâches.

---

## 🎯 Vue d'ensemble

**Task Manager Desktop** est une **application desktop** (exécutable) de gestion de tâches inspirée de TickTick, permettant aux utilisateurs de :
- Créer et gérer leurs tâches personnelles **localement** sur leur machine
- Suivre l'état d'avancement de leurs tâches
- Recevoir des mises à jour en temps réel via WebSocket (communication interne)
- Gérer leur profil utilisateur
- Exporter ou supprimer leurs données (conformité RGPD)
- **Fonctionner entièrement hors ligne** - toutes les données sont stockées localement

### Architecture Technique
- **Application Desktop** : Construite avec Electron
- **Backend Local** : Serveur Express intégré qui démarre automatiquement avec l'application
- **Base de Données** : SQLite locale (`data/task-manager.db`)
- **Stockage** : Fichiers stockés localement dans `data/storage/`
- **Frontend** : Interface React/Next.js affichée dans la fenêtre Electron
- **Communication** : API REST locale + WebSocket pour les mises à jour en temps réel

---

## 🚀 0. PREMIER LANCEMENT DE L'APPLICATION

### 0.1 Installation et Démarrage

**Workflow** :
1. L'utilisateur installe l'application depuis l'exécutable (.exe sur Windows)
2. Au premier lancement :
   - L'application Electron démarre
   - Le serveur Express backend démarre automatiquement en arrière-plan (port local)
   - La base de données SQLite est créée/initialisée dans `data/task-manager.db`
   - La fenêtre principale de l'application s'ouvre
3. L'utilisateur voit l'interface de l'application (fenêtre desktop)

**Note** : Le backend tourne localement, aucune connexion Internet n'est requise.

---

## 🔐 1. PROCESSUS D'AUTHENTIFICATION

### 1.1 Inscription (Register)

**Endpoint Local** : `POST http://localhost:<port>/api/users/register`

**Workflow** :
1. L'utilisateur ouvre l'application desktop
2. Il accède à la fenêtre d'inscription depuis l'interface
3. Il remplit le formulaire avec :
   - **Nom** (obligatoire)
   - **Email** (obligatoire, doit être unique)
   - **Mot de passe** (obligatoire)
   - **Avatar** (optionnel - fichier image)
   - **Consentement politique de confidentialité** (obligatoire - checkbox)
   - **Consentement conditions d'utilisation** (obligatoire - checkbox)

3. Le système valide les données :
   - Vérifie que tous les champs obligatoires sont remplis
   - Vérifie que l'email n'existe pas déjà dans la base SQLite locale
   - Vérifie que les consentements RGPD sont acceptés

4. Si l'avatar est fourni :
   - Sauvegarde du fichier localement dans `data/storage/avatars/`
   - Génération d'un chemin relatif vers l'avatar

5. Création du compte :
   - Hash du mot de passe avec bcrypt
   - Création de l'utilisateur dans la base SQLite locale
   - Enregistrement des consentements RGPD avec version et date

6. Réponse : Retourne les informations utilisateur (id, name, email, avatar)

**Résultat** : Compte créé localement, utilisateur peut se connecter

**Note** : Toutes les données sont stockées sur la machine de l'utilisateur, aucune donnée n'est envoyée vers un serveur distant.

---

### 1.2 Connexion (Login)

**Endpoint Local** : `POST http://localhost:<port>/api/users/login`

**Workflow** :
1. L'utilisateur ouvre l'application desktop
2. Il accède à la fenêtre de connexion depuis l'interface
3. Il saisit :
   - **Email**
   - **Mot de passe**

4. Le système vérifie (localement dans SQLite) :
   - Si l'email existe dans la base de données locale
   - Si le mot de passe correspond (comparaison avec hash bcrypt)

5. Si les identifiants sont valides :
   - Génération d'un token JWT (valide 7 jours)
   - Le token contient : `{ id: userId, email: email }`
   - Le token est stocké localement dans le localStorage de l'application

6. Réponse : Retourne le token JWT et les informations utilisateur

**Résultat** : Utilisateur authentifié, interface principale de l'application s'affiche

**Note** : 
- Rate limiting appliqué pour éviter les attaques par force brute
- Toute l'authentification se fait localement, aucune connexion Internet requise

---

### 1.3 Récupération du Profil (Get Me)

**Endpoint Local** : `GET http://localhost:<port>/api/users/me`

**Workflow** :
1. L'utilisateur fait une requête depuis l'interface desktop avec le token JWT dans le header `Authorization: Bearer <token>`
2. Le middleware d'authentification vérifie le token (localement)
3. Le système récupère les informations utilisateur depuis la base SQLite locale
4. Réponse : Retourne les informations utilisateur (id, name, email, avatar)

**Utilisation** : Vérifier l'authentification au démarrage de l'app, récupérer les infos utilisateur après connexion, afficher le profil dans l'interface

---

### 1.4 Réinitialisation du Mot de Passe

#### Étape 1 : Demande de réinitialisation
**Endpoint Local** : `POST http://localhost:<port>/api/users/forgot-password`

**Workflow** :
1. L'utilisateur accède à la fenêtre "Mot de passe oublié" dans l'application desktop
2. Il saisit son email
3. Le système vérifie si l'email existe dans la base SQLite locale (sans révéler l'existence ou non)
4. Génération d'un code OTP à 6 chiffres
5. Hash du code OTP et sauvegarde dans la base SQLite locale avec expiration (15 minutes)
6. Envoi d'un email avec le code OTP (nécessite une connexion Internet pour l'envoi d'email)
7. Réponse : Message générique (sécurité)

**Note** : Cette fonctionnalité nécessite une connexion Internet pour l'envoi d'email, mais le reste de l'application fonctionne hors ligne.

#### Étape 2 : Vérification du code OTP
**Endpoint Local** : `POST http://localhost:<port>/api/users/verify-otp`

**Workflow** :
1. L'utilisateur saisit son email et le code OTP reçu par email dans l'interface desktop
2. Le système vérifie localement dans SQLite :
   - Vérifie le format du code (6 chiffres)
   - Récupère le code le plus récent pour cet email
   - Vérifie qu'il n'est pas expiré
   - Compare le code fourni avec le hash stocké
3. Si valide :
   - Marque le code comme utilisé dans la base locale
   - Génère un token de réinitialisation temporaire (30 minutes)
4. Réponse : Retourne le token de réinitialisation

#### Étape 3 : Réinitialisation du mot de passe
**Endpoint Local** : `POST http://localhost:<port>/api/users/reset-password`

**Workflow** :
1. L'utilisateur envoie depuis l'interface desktop :
   - Le token de réinitialisation
   - Le nouveau mot de passe (minimum 6 caractères)
2. Le système traite localement :
   - Vérifie la validité du token
   - Hash le nouveau mot de passe
   - Met à jour le mot de passe dans la base SQLite locale
   - Supprime tous les codes OTP pour cet email
   - Envoie un email de confirmation (nécessite Internet)
3. Réponse : Confirmation de réinitialisation

**Résultat** : Mot de passe modifié localement, utilisateur peut se connecter avec le nouveau mot de passe

**Note** : Rate limiting appliqué à chaque étape pour éviter les abus. Seul l'envoi d'email nécessite Internet.

---

## 📝 2. GESTION DES TÂCHES

### 2.1 Créer une Tâche

**Endpoint Local** : `POST http://localhost:<port>/api/tasks`

**Workflow** :
1. L'utilisateur authentifié ouvre l'application desktop
2. Il accède au formulaire de création de tâche dans l'interface
3. Il saisit :
   - **Titre** (obligatoire)
   - **Statut** (optionnel, par défaut "todo")
4. Le système traite localement :
   - Valide que le titre est fourni
   - Crée la tâche dans la base SQLite locale avec :
     - ID généré automatiquement
     - userId (ID de l'utilisateur depuis le JWT)
     - title
     - status ("todo", "in-progress", "done")
     - createdAt, updatedAt (timestamps)
5. Émission d'un événement WebSocket local `task:created` vers l'utilisateur (communication interne)
6. Réponse : Retourne la tâche créée
7. L'interface se met à jour automatiquement pour afficher la nouvelle tâche

**Résultat** : Nouvelle tâche créée localement et visible immédiatement dans la liste

**Note** : Toute l'opération se fait localement, aucune connexion Internet requise.

---

### 2.2 Récupérer Toutes les Tâches

**Endpoint Local** : `GET http://localhost:<port>/api/tasks`

**Workflow** :
1. L'utilisateur authentifié ouvre l'application desktop
2. Au démarrage ou lors du rafraîchissement, l'interface fait une requête locale
3. Le système :
   - Récupère toutes les tâches de l'utilisateur depuis la base SQLite locale
   - Ajoute les informations utilisateur à chaque tâche
4. Réponse : Liste de toutes les tâches de l'utilisateur
5. L'interface affiche la liste des tâches

**Utilisation** : Charger la liste des tâches au démarrage de l'app, rafraîchir la liste après modifications

**Note** : Les données sont lues depuis le disque local, très rapide et fonctionne hors ligne.

---

### 2.3 Récupérer une Tâche Spécifique

**Endpoint Local** : `GET http://localhost:<port>/api/tasks/:id`

**Workflow** :
1. L'utilisateur authentifié clique sur une tâche dans l'interface desktop
2. L'interface fait une requête locale avec l'ID de la tâche
3. Le système vérifie localement dans SQLite :
   - Vérifie que la tâche existe
   - Vérifie que la tâche appartient à l'utilisateur
   - Récupère la tâche avec les informations utilisateur
4. Réponse : Détails de la tâche
5. L'interface affiche les détails dans une fenêtre/modal

**Utilisation** : Afficher les détails d'une tâche, éditer une tâche, voir les informations complètes

---

### 2.4 Mettre à Jour une Tâche

**Endpoint Local** : `PUT http://localhost:<port>/api/tasks/:id`

**Workflow** :
1. L'utilisateur authentifié modifie une tâche existante depuis l'interface desktop
2. Il peut modifier :
   - **Titre**
   - **Statut** ("todo", "in-progress", "done")
3. Le système traite localement dans SQLite :
   - Vérifie que la tâche existe et appartient à l'utilisateur
   - Met à jour uniquement les champs fournis dans la base locale
   - Met à jour le timestamp `updatedAt`
4. Émission d'un événement WebSocket local `task:updated` vers l'utilisateur (communication interne)
5. Réponse : Retourne la tâche mise à jour
6. L'interface se met à jour automatiquement pour refléter les changements

**Résultat** : Tâche modifiée localement, mise à jour immédiate dans l'interface

**Cas d'usage** :
- Modifier le titre d'une tâche
- Changer le statut (marquer comme terminée, mettre en cours, etc.)
- Mise à jour instantanée visible dans toute l'interface

**Note** : Toutes les modifications sont sauvegardées localement sur le disque.

---

### 2.5 Supprimer une Tâche

**Endpoint Local** : `DELETE http://localhost:<port>/api/tasks/:id`

**Workflow** :
1. L'utilisateur authentifié demande la suppression d'une tâche depuis l'interface desktop
2. Confirmation de suppression (dialog dans l'interface)
3. Le système traite localement :
   - Vérifie que la tâche existe et appartient à l'utilisateur
   - Supprime la tâche de la base SQLite locale
4. Émission d'un événement WebSocket local `task:deleted` vers l'utilisateur (communication interne)
5. Réponse : Confirmation de suppression
6. L'interface retire immédiatement la tâche de la liste

**Résultat** : Tâche supprimée définitivement de la base locale, mise à jour immédiate dans l'interface

**Note** : La suppression est définitive et locale, aucune synchronisation cloud.

---

## 👤 3. GESTION DU PROFIL UTILISATEUR

### 3.1 Mettre à Jour l'Avatar

**Endpoint Local** : `PUT http://localhost:<port>/api/users/updateavatar`

**Workflow** :
1. L'utilisateur authentifié accède aux paramètres du profil dans l'interface desktop
2. Il sélectionne une nouvelle image depuis son ordinateur (sélecteur de fichier système)
3. Upload du fichier (multipart/form-data) vers le backend local
4. Le système traite localement :
   - Supprime l'ancien avatar du dossier `data/storage/avatars/` s'il existe
   - Sauvegarde le nouvel avatar dans `data/storage/avatars/`
   - Met à jour le chemin de l'avatar dans la base SQLite locale
5. Réponse : Retourne le chemin relatif vers le nouvel avatar
6. L'interface affiche immédiatement le nouvel avatar

**Résultat** : Avatar mis à jour localement, visible immédiatement dans l'interface

**Note** : L'avatar est stocké sur le disque local, aucune connexion Internet requise.

---

## 🔄 4. MISE À JOUR EN TEMPS RÉEL (WebSocket Local)

**Connexion** : `ws://localhost:<port>` (communication interne locale)

**Workflow** :
1. Au démarrage de l'application desktop, le frontend se connecte automatiquement au WebSocket local
2. L'utilisateur se connecte avec son token JWT (stocké localement)
3. Le middleware WebSocket vérifie l'authentification (localement)
4. L'utilisateur rejoint automatiquement sa room personnalisée : `user_<userId>`
5. Le système émet des événements en temps réel (communication interne) :

**Événements émis** :
- `task:created` : Quand une tâche est créée
- `task:updated` : Quand une tâche est mise à jour
- `task:deleted` : Quand une tâche est supprimée

**Utilisation** :
- Mise à jour automatique de l'interface sans rafraîchissement
- Synchronisation entre différentes parties de l'interface (si plusieurs vues ouvertes)
- Notifications en temps réel dans l'application
- Communication interne uniquement (pas de serveur distant)

**Note** : Le WebSocket fonctionne uniquement en local, aucune connexion Internet requise. Il permet une communication bidirectionnelle rapide entre le frontend et le backend intégrés dans l'application Electron.

---

## 📊 5. CONFORMITÉ RGPD

### 5.1 Exporter ses Données (Droit d'accès)

**Endpoint Local** : `GET http://localhost:<port>/api/users/me/export`

**Workflow** :
1. L'utilisateur authentifié accède aux paramètres dans l'interface desktop
2. Il sélectionne "Exporter mes données"
3. Le système récupère depuis la base SQLite locale :
   - Informations utilisateur complètes
   - Toutes les tâches
   - Historique des réinitialisations de mot de passe
   - Métadonnées (dates de consentement, version des politiques)
4. Formatage des données en JSON structuré
5. Enregistrement de la date d'export dans la base locale
6. Réponse : JSON avec toutes les données
7. L'interface propose de sauvegarder le fichier JSON sur le disque local

**Résultat** : Fichier JSON sauvegardé sur l'ordinateur de l'utilisateur avec toutes ses données personnelles

**Note** : L'export est généré localement et sauvegardé sur la machine de l'utilisateur.

---

### 5.2 Export Portable (Droit à la portabilité)

**Endpoint Local** : `GET http://localhost:<port>/api/users/me/export/portable`

**Workflow** :
1. L'utilisateur authentifié accède aux paramètres dans l'interface desktop
2. Il sélectionne "Exporter mes données (format portable)"
3. Similaire à l'export standard mais format simplifié
4. Format portable (sans IDs techniques, données essentielles uniquement)
5. Réponse : Fichier JSON téléchargeable avec header `Content-Disposition`
6. L'interface propose de sauvegarder le fichier JSON sur le disque local

**Résultat** : Fichier JSON portable sauvegardé localement pour migration vers un autre service

**Note** : Format simplifié pour faciliter l'import dans d'autres applications.

---

### 5.3 Supprimer son Compte (Droit à l'effacement)

**Endpoint Local** : `DELETE http://localhost:<port>/api/users/me/delete`

**Workflow** :
1. L'utilisateur authentifié accède aux paramètres dans l'interface desktop
2. Il sélectionne "Supprimer mon compte"
3. Confirmation avec dialog de sécurité (action irréversible)
4. Le système traite localement :
   - Supprime toutes les tâches de l'utilisateur de la base SQLite
   - Supprime tous les codes OTP associés
   - Supprime l'avatar du dossier `data/storage/avatars/` s'il existe
   - Supprime l'utilisateur de la base SQLite locale
5. Réponse : Confirmation de suppression
6. L'application retourne à l'écran de connexion/inscription

**Résultat** : Compte et toutes les données associées supprimés définitivement de la machine locale

**⚠️ Attention** : Action irréversible. Toutes les données sont supprimées localement et ne peuvent pas être récupérées.

**Note** : La suppression est complète et locale, aucune trace ne reste sur la machine.

---

## 🔄 6. WORKFLOW COMPLET TYPIQUE

### Scénario 1 : Nouvel Utilisateur

1. **Installation et Premier Lancement**
   - Installation de l'application desktop (.exe)
   - Premier lancement de l'application
   - Le backend démarre automatiquement en arrière-plan
   - La base de données SQLite est créée automatiquement

2. **Inscription**
   - Affichage de la fenêtre d'inscription dans l'application
   - Remplissage du formulaire dans l'interface desktop
   - Acceptation des conditions RGPD (checkboxes)
   - Sélection optionnelle d'un avatar depuis l'ordinateur
   - Création du compte dans la base locale

3. **Connexion**
   - Affichage de la fenêtre de connexion
   - Saisie email/mot de passe
   - Réception du token JWT
   - Stockage du token dans le localStorage de l'application

4. **Première Utilisation**
   - Affichage de l'interface principale
   - Récupération automatique du profil (`GET /me`)
   - Affichage de la liste vide des tâches (`GET /tasks`)
   - Création de la première tâche (`POST /tasks`)

5. **Utilisation Quotidienne**
   - Lancement de l'application desktop
   - Connexion automatique avec le token stocké
   - Création/modification/suppression de tâches
   - Mise à jour en temps réel via WebSocket local
   - Gestion du profil (avatar, etc.)
   - Toutes les données sont sauvegardées localement

---

### Scénario 2 : Utilisateur Existant

1. **Lancement de l'Application**
   - Double-clic sur l'icône de l'application desktop
   - Le backend démarre automatiquement
   - L'application vérifie si un token existe

2. **Connexion**
   - Si token valide : connexion automatique
   - Si pas de token : affichage de la fenêtre de connexion
   - Authentification avec email/mot de passe
   - Réception du token JWT
   - Affichage de l'interface principale

3. **Gestion des Tâches**
   - Consultation de la liste des tâches (`GET /tasks`) depuis la base locale
   - Création de nouvelles tâches (`POST /tasks`) - sauvegarde locale
   - Modification de tâches existantes (`PUT /tasks/:id`) - mise à jour locale
   - Changement de statut (todo → in-progress → done) via l'interface
   - Suppression de tâches terminées (`DELETE /tasks/:id`) - suppression locale
   - Toutes les modifications sont visibles immédiatement

4. **Mise à Jour du Profil**
   - Accès aux paramètres du profil dans l'interface
   - Modification de l'avatar (`PUT /users/updateavatar`) - sauvegarde locale
   - Consultation du profil (`GET /users/me`)

---

### Scénario 3 : Mot de Passe Oublié

1. **Demande de Réinitialisation**
   - Accès à la fenêtre "Mot de passe oublié" dans l'application desktop
   - Saisie de l'email
   - Génération et sauvegarde locale du code OTP
   - Envoi d'un code OTP par email (nécessite Internet)
   - Réception d'un code OTP par email

2. **Vérification du Code**
   - Accès à la fenêtre de vérification OTP dans l'application
   - Saisie de l'email et du code OTP reçu
   - Vérification locale du code dans la base SQLite
   - Réception d'un token de réinitialisation

3. **Nouveau Mot de Passe**
   - Accès à la fenêtre de réinitialisation dans l'application
   - Saisie du token et du nouveau mot de passe
   - Mise à jour locale du mot de passe dans SQLite
   - Confirmation de réinitialisation
   - Retour à l'écran de connexion
   - Connexion avec le nouveau mot de passe

---

### Scénario 4 : Export/Suppression de Données (RGPD)

1. **Export des Données**
   - Accès aux paramètres dans l'interface desktop
   - Sélection "Exporter mes données"
   - Génération du fichier JSON depuis la base SQLite locale
   - Sauvegarde du fichier JSON sur le disque local (dialogue de sauvegarde système)
   - Consultation de toutes les données personnelles dans le fichier

2. **Export Portable**
   - Accès aux paramètres dans l'interface desktop
   - Sélection "Exporter mes données (format portable)"
   - Génération du fichier JSON portable depuis la base locale
   - Sauvegarde du fichier JSON sur le disque local
   - Utilisation pour migration vers un autre service

3. **Suppression du Compte**
   - Accès aux paramètres dans l'interface desktop
   - Sélection "Supprimer mon compte"
   - Confirmation avec dialog de sécurité (action irréversible)
   - Suppression définitive de toutes les données de la base SQLite locale
   - Suppression des fichiers associés (avatar) du disque local
   - Retour à l'écran de connexion/inscription

---

## 🔒 7. SÉCURITÉ ET LIMITATIONS

### Rate Limiting
- **Connexion** : Limite les tentatives de connexion (protection locale)
- **Réinitialisation mot de passe** : Limite les demandes
- **Vérification OTP** : Limite les tentatives de vérification
- **Soumission réinitialisation** : Limite les soumissions

### Authentification
- **JWT** : Token valide 7 jours, stocké localement dans le localStorage
- **Middleware** : Vérification du token sur toutes les routes protégées (local)
- **WebSocket** : Authentification requise pour la connexion (local)

### Validation
- **Email** : Format validé
- **Mot de passe** : Minimum 6 caractères, hashé avec bcrypt
- **Titre tâche** : Obligatoire
- **Statut tâche** : Valeurs autorisées uniquement ("todo", "in-progress", "done")

### Stockage Local
- **Base de données** : SQLite locale dans `data/task-manager.db`
- **Fichiers** : Stockés dans `data/storage/avatars/`
- **Token** : Stocké dans le localStorage de l'application Electron
- **Sécurité** : Toutes les données restent sur la machine de l'utilisateur

---

## 📱 8. STRUCTURE DES DONNÉES

### Utilisateur (User) - Stocké dans SQLite
```json
{
  "id": "integer (auto-increment)",
  "name": "string",
  "email": "string (unique)",
  "password": "hash bcrypt",
  "avatar": "chemin relatif vers fichier local",
  "consentPrivacyPolicy": true,
  "consentTermsOfService": true,
  "consentVersion": "1.0",
  "consentDate": "datetime",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Tâche (Task) - Stockée dans SQLite
```json
{
  "id": "integer (auto-increment)",
  "title": "string",
  "status": "todo | in-progress | done",
  "userId": "integer (foreign key)",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Structure des Fichiers Locaux
```
task-manager-api/
├── data/
│   ├── task-manager.db          # Base de données SQLite
│   └── storage/
│       └── avatars/              # Avatars des utilisateurs
│           └── user-<id>-<timestamp>.png
```

---

## 🎯 9. POINTS D'ENTRÉE PRINCIPAUX

### Architecture Desktop
- **Application Electron** : Fenêtre principale de l'application
- **Backend Express** : Serveur local intégré (démarre automatiquement)
- **Frontend React/Next.js** : Interface utilisateur affichée dans Electron
- **Base SQLite** : Stockage local des données
- **WebSocket** : Communication interne en temps réel

### Routes Locales (http://localhost:<port>/api/...)

#### Routes Publiques
- `POST /api/users/register` - Inscription
- `POST /api/users/login` - Connexion
- `POST /api/users/forgot-password` - Demande réinitialisation
- `POST /api/users/verify-otp` - Vérification OTP
- `POST /api/users/reset-password` - Réinitialisation

#### Routes Protégées (Authentification requise)
- `GET /api/users/me` - Profil utilisateur
- `PUT /api/users/updateavatar` - Mise à jour avatar
- `GET /api/users/me/export` - Export données
- `GET /api/users/me/export/portable` - Export portable
- `DELETE /api/users/me/delete` - Suppression compte
- `GET /api/tasks` - Liste des tâches
- `GET /api/tasks/:id` - Détails d'une tâche
- `POST /api/tasks` - Créer une tâche
- `PUT /api/tasks/:id` - Modifier une tâche
- `DELETE /api/tasks/:id` - Supprimer une tâche

**Note** : Toutes ces routes sont accessibles uniquement en local depuis l'application desktop. Le port est géré dynamiquement par Electron.

---

## 📝 10. NOTES IMPORTANTES

### Application Desktop
1. **Lancement** : L'application démarre comme une application desktop classique (double-clic sur l'exécutable)
2. **Backend Intégré** : Le serveur Express démarre automatiquement en arrière-plan, aucun serveur externe requis
3. **Base de Données Locale** : SQLite stockée dans `data/task-manager.db` sur la machine de l'utilisateur
4. **Fonctionnement Hors Ligne** : L'application fonctionne entièrement hors ligne, sauf pour l'envoi d'emails (réinitialisation mot de passe)

### Authentification
1. **Token JWT** : Doit être inclus dans le header `Authorization: Bearer <token>` pour toutes les routes protégées
2. **Stockage** : Token stocké dans le localStorage de l'application Electron
3. **Validité** : Token valide 7 jours, reconnexion automatique si token valide

### Communication
1. **WebSocket Local** : Connexion authentifiée requise, événements émis uniquement vers l'utilisateur concerné
2. **API REST Locale** : Toutes les requêtes sont faites vers `localhost:<port>` (communication interne)

### Données et Stockage
1. **SQLite** : Base de données locale, toutes les données sont stockées sur la machine de l'utilisateur
2. **Fichiers** : Avatars et autres fichiers stockés dans `data/storage/` sur le disque local
3. **IDs** : IDs auto-incrémentés dans SQLite (pas d'UUID pour simplifier)

### Conformité RGPD
1. **Consentements** : Tous les consentements sont enregistrés avec version et date pour traçabilité
2. **Export** : Possibilité d'exporter toutes les données en JSON
3. **Suppression** : Possibilité de supprimer complètement le compte et toutes les données

### Sécurité
1. **Données Locales** : Toutes les données restent sur la machine de l'utilisateur, aucune synchronisation cloud
2. **Mot de Passe** : Hashé avec bcrypt avant stockage
3. **Rate Limiting** : Protection contre les attaques par force brute (locale)

### Développement vs Production
- **En développement** : Backend et frontend peuvent être lancés séparément pour le développement
- **En production** : Application packagée avec Electron Builder en un seul exécutable (.exe)
- **Base de données** : Créée automatiquement au premier lancement si elle n'existe pas

---

**Dernière mise à jour** : 2025-01-16

