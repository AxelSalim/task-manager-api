# 📋 Workflow d'Utilisation - Task Manager Desktop

Ce document décrit le processus complet d'utilisation du système Task Manager Desktop, depuis le premier lancement jusqu'à la gestion quotidienne des tâches.

---

## 🎯 Vue d'ensemble

**Task Manager Desktop (Spark)** est une **application desktop** (exécutable) de gestion de tâches (type Blitzit), permettant aux utilisateurs de :
- Créer et gérer leurs tâches **localement** (vue principale : **Kanban**, puis Calendrier)
- Suivre l'état d'avancement (colonnes À faire / En cours / Terminé, liste des tâches)
- **Authentification mode desktop** : premier lancement = onboarding (nom uniquement) ; verrouillage optionnel par **code PIN**
- Recevoir des mises à jour en temps réel via WebSocket (communication interne)
- Gérer leur profil (nom, avatar, définition du PIN)
- Exporter ou supprimer leurs données (conformité RGPD)
- **Fonctionner entièrement hors ligne** – toutes les données sont stockées localement
- **Suivi financier** (à venir) : voir `docs/SUIVI_FINANCIER_IMPLEMENTATION.md`

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

## 🔐 1. PROCESSUS D'AUTHENTIFICATION (MODE DESKTOP)

L'application fonctionne en **mode desktop** : un seul profil par machine, pas d'inscription email/mot de passe. Au premier lancement, l'utilisateur crée son profil (nom uniquement) ; un **code PIN** optionnel permet de verrouiller l'accès.

### 1.1 Statut du profil (au chargement)

**Endpoint Local** : `GET http://localhost:<port>/api/users/profile/status`

**Workflow** :
1. Au démarrage de l'application, le frontend appelle cet endpoint (sans token).
2. Réponse : `{ hasUser: boolean, hasPin: boolean, userName: string | null }`
3. Comportement :
   - **hasUser = false** → redirection vers l'écran d'onboarding (premier lancement)
   - **hasUser = true et hasPin = true** (et pas de token en localStorage) → écran de verrouillage (saisie PIN)
   - **hasUser = true et hasPin = false** → appel à `POST /api/users/desktop-session` pour obtenir un token, puis accès à l'interface
   - **hasUser = true et token présent** → vérification du token (GET /me) ; si invalide, écran de verrouillage

**Résultat** : L'application affiche soit l'onboarding, soit l'écran PIN, soit l'interface principale (Kanban).

---

### 1.2 Premier lancement (Onboarding – création du profil)

**Endpoint Local** : `POST http://localhost:<port>/api/users/setup`

**Workflow** :
1. L'utilisateur ouvre l'application pour la première fois (aucun utilisateur en base).
2. Il est redirigé vers la page **Onboarding** (« Comment vous appelez-vous ? »).
3. Il saisit son **prénom ou nom** (au moins 2 caractères).
4. Le frontend envoie `POST /api/users/setup` avec `{ name: "…" }`.
5. Le backend :
   - Vérifie qu'aucun utilisateur n'existe déjà
   - Crée un utilisateur avec : name, email interne `local@desktop`, mot de passe technique hashé, `pin_hash` à null
   - Génère un token JWT (valide 30 jours)
6. Réponse : `{ token, user }`. Le frontend stocke le token (localStorage) et redirige vers le Kanban.

**Résultat** : Profil créé localement, utilisateur accède directement à l'application (vue Kanban).

---

### 1.3 Session sans PIN (ouverture automatique)

**Endpoint Local** : `POST http://localhost:<port>/api/users/desktop-session`

**Workflow** :
1. Un profil existe déjà et **aucun PIN n'est défini**.
2. Au chargement, le frontend appelle `POST /api/users/desktop-session` (sans body).
3. Le backend renvoie un token JWT et les infos utilisateur.
4. Le frontend stocke le token et affiche l'interface principale.

**Résultat** : Accès direct au Kanban sans saisie de mot de passe ni PIN.

---

### 1.4 Verrouillage et déverrouillage (PIN)

**Déverrouillage – Endpoint Local** : `POST http://localhost:<port>/api/users/verify-pin`

**Workflow** :
1. Un profil existe avec un PIN défini ; l'utilisateur n'a pas de token valide (ou a cliqué sur « Verrouiller maintenant »).
2. L'écran de verrouillage s'affiche (« Entrez votre code PIN »).
3. L'utilisateur saisit son code PIN (4 à 8 chiffres).
4. Le frontend envoie `POST /api/users/verify-pin` avec `{ pin: "…" }`.
5. Le backend compare le PIN au hash stocké ; si valide, renvoie un token JWT et les infos utilisateur.
6. Le frontend stocke le token et redirige vers le Kanban.

**Définir ou modifier le PIN** : Page **Profil** → section **Sécurité** → champs « Nouveau code PIN » et « Confirmer » → bouton « Enregistrer le PIN ». Endpoint : `PATCH http://localhost:<port>/api/users/profile/pin` (authentifié), body `{ pin: "…" }`.

**Verrouiller maintenant** : Depuis le profil, bouton « Verrouiller maintenant » ; le token est supprimé et l'utilisateur est redirigé vers l'écran de verrouillage.

**Résultat** : Accès protégé par PIN ; déverrouillage par saisie du PIN.

---

### 1.5 Récupération du Profil (Get Me)

**Endpoint Local** : `GET http://localhost:<port>/api/users/me`

**Workflow** :
1. L'utilisateur fait une requête depuis l'interface desktop avec le token JWT dans le header `Authorization: Bearer <token>`
2. Le middleware d'authentification vérifie le token (localement)
3. Le système récupère les informations utilisateur depuis la base SQLite locale
4. Réponse : Retourne les informations utilisateur (id, name, email, avatar)

**Utilisation** : Vérifier l'authentification après déverrouillage ou ouverture de session, afficher le profil dans l'interface.

**Note (mode desktop)** : Les anciennes pages `/login` et `/register` redirigent vers `/`. Le flux « mot de passe oublié » (`/forgot-password`) et les endpoints associés existent encore côté backend mais ne sont pas utilisés dans le flux desktop. En secours (ex. profil déjà créé avec ancienne auth), un script backend `node backend/scripts/reset-password.js <email> <nouveau_mot_de_passe>` permet de réinitialiser un mot de passe en base.

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

### Scénario 1 : Nouvel Utilisateur (mode desktop)

1. **Installation et Premier Lancement**
   - Installation de l'application desktop (.exe)
   - Premier lancement : le backend démarre, la base SQLite est créée/initialisée
   - Appel à `GET /api/users/profile/status` → `hasUser: false`

2. **Onboarding (création du profil)**
   - Redirection vers la page « Comment vous appelez-vous ? »
   - Saisie du prénom ou nom (min. 2 caractères)
   - `POST /api/users/setup` → création du profil (nom, utilisateur technique local), réception du token JWT
   - Stockage du token en localStorage, redirection vers **Kanban** (`/kanban`)

3. **Première Utilisation**
   - Affichage du **Kanban** (vue principale des tâches)
   - Navigation : **Kanban**, **Calendrier** (pas de liens « Aujourd’hui », « Tâches » ni « Tags » dans la sidebar ; les tags se gèrent dans le Kanban)
   - Création de tâches depuis le Kanban (« + Ajouter une carte ») ou formulaire associé
   - Profil accessible pour modifier le nom, l’avatar, et optionnellement **définir un code PIN** (section Sécurité)

4. **Utilisation Quotidienne**
   - Lancement de l’application → si pas de PIN : ouverture automatique (`POST /desktop-session`) → Kanban
   - Si PIN défini : écran de verrouillage → saisie du PIN (`POST /verify-pin`) → Kanban
   - Création / modification / suppression de tâches ; mise à jour en temps réel via WebSocket local
   - « Verrouiller maintenant » (profil) : suppression du token, redirection vers l’écran PIN

---

### Scénario 2 : Utilisateur Existant

1. **Lancement de l'Application**
   - Double-clic sur l'icône de l'application desktop
   - Le backend démarre automatiquement
   - Appel à `GET /api/users/profile/status` pour déterminer l'état (onboarding / verrouillé / authentifié)

2. **Accès à l'interface**
   - **Pas de profil** : redirection vers onboarding (création du profil avec le nom)
   - **Profil sans PIN** : `POST /desktop-session` → token reçu → affichage du Kanban
   - **Profil avec PIN et token valide** : affichage du Kanban
   - **Profil avec PIN et pas de token** : écran de verrouillage → saisie du PIN → `POST /verify-pin` → Kanban

3. **Gestion des Tâches**
   - Vue principale : **Kanban** (`/kanban`) ; la route `/tasks` redirige vers `/kanban`
   - Consultation des tâches (`GET /api/tasks`), création (`POST /api/tasks`), modification (`PUT /api/tasks/:id`), suppression (`DELETE /api/tasks/:id`)
   - Changement de statut par glisser-déposer entre colonnes (À faire / En cours / Terminé)
   - Mise à jour en temps réel via WebSocket local

4. **Mise à Jour du Profil**
   - Accès à la page **Profil** : nom, avatar (`PUT /users/updateavatar`), section **Sécurité** (définir le PIN, « Verrouiller maintenant »)
   - Consultation du profil (`GET /users/me`)

---

### Scénario 3 : Verrouillage / Déverrouillage (PIN)

1. **Définir un PIN** (optionnel)
   - Accès à la page **Profil** → section **Sécurité**
   - Saisie du nouveau code PIN (4 à 8 chiffres) et confirmation
   - `PATCH /api/users/profile/pin` → PIN hashé et enregistré en base

2. **Verrouiller maintenant**
   - Depuis le profil, clic sur « Verrouiller maintenant »
   - Suppression du token en localStorage, redirection vers l’écran de verrouillage

3. **Déverrouiller**
   - Saisie du code PIN sur l’écran de verrouillage
   - `POST /api/users/verify-pin` → si valide, réception du token et redirection vers le Kanban

**Note** : En mode desktop, le flux « mot de passe oublié » (email + OTP) n’est pas utilisé. En secours, le script `backend/scripts/reset-password.js` permet de réinitialiser un mot de passe en base si besoin.

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
   - Retour à l'écran d'onboarding (premier lancement)

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

#### Routes Publiques (mode desktop)
- `GET /api/users/profile/status` - Statut du profil (hasUser, hasPin, userName)
- `POST /api/users/setup` - Premier lancement : création du profil (body: `{ name }`)
- `POST /api/users/desktop-session` - Obtenir un token si pas de PIN
- `POST /api/users/verify-pin` - Déverrouillage (body: `{ pin }`)

#### Anciennes routes (redirigées en desktop, conservées au besoin)
- `POST /api/users/register` - Inscription (non utilisée en flux desktop)
- `POST /api/users/login` - Connexion (non utilisée en flux desktop)
- `POST /api/users/forgot-password` - Demande réinitialisation (non utilisée en flux desktop)
- `POST /api/users/verify-otp` - Vérification OTP
- `POST /api/users/reset-password` - Réinitialisation

#### Routes Protégées (Authentification requise)
- `GET /api/users/me` - Profil utilisateur
- `PATCH /api/users/profile/pin` - Définir ou modifier le code PIN
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
4. **Fonctionnement Hors Ligne** : L'application fonctionne entièrement hors ligne (pas d'email en flux desktop)

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

**Dernière mise à jour** : 2026-02-18 — Mode desktop : onboarding + PIN ; navigation Kanban / Calendrier ; Suivi financier prévu (voir `docs/SUIVI_FINANCIER_IMPLEMENTATION.md`).

