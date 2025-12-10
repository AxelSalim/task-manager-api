# 🔥 Configuration Firebase Firestore

Ce guide explique comment configurer Firebase Firestore pour remplacer MySQL dans votre API Task Manager.

## 📋 Prérequis

1. Un compte Google (pour accéder à Firebase Console)
2. Un projet Firebase créé
3. Firestore Database activé dans votre projet

## 🚀 Étape 1 : Créer un projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquer sur **"Ajouter un projet"** ou sélectionner un projet existant
3. Suivre les étapes de création :
   - Nommer le projet (ex: `task-manager-api`)
   - Activer Google Analytics (optionnel)
   - Créer le projet

## 🗄️ Étape 2 : Activer Firestore Database

1. Dans votre projet Firebase, aller dans **"Firestore Database"**
2. Cliquer sur **"Créer une base de données"**
3. Choisir le mode :
   - **Mode Production** : Règles strictes (recommandé)
   - **Mode Test** : Accès libre pendant 30 jours (pour développement)
4. Choisir une **région** (ex: `europe-west1` pour l'Europe)
5. Cliquer sur **"Activer"**

## 🔐 Étape 3 : Configurer les règles de sécurité

Dans Firebase Console → Firestore Database → Règles, coller ce code :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Collection Users
    match /users/{userId} {
      // Lecture : uniquement l'utilisateur lui-même
      allow read: if request.auth != null && request.auth.uid == userId;
      // Écriture : uniquement l'utilisateur lui-même
      allow write: if request.auth != null && request.auth.uid == userId;
      // Création : autorisée sans auth pour l'inscription
      allow create: if request.auth == null;
    }
    
    // Collection Tasks
    match /tasks/{taskId} {
      // Lecture : uniquement les tâches de l'utilisateur
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      // Création : uniquement pour soi-même
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      // Mise à jour/Suppression : uniquement les tâches de l'utilisateur
      allow update, delete: if request.auth != null && 
                                resource.data.userId == request.auth.uid;
    }
    
    // Collection PasswordResets
    match /passwordResets/{resetId} {
      // Accessible sans auth pour la réinitialisation de mot de passe
      allow read, write: if request.auth == null;
    }
  }
}
```

⚠️ **Note** : Ces règles supposent que vous utilisez Firebase Authentication. Si vous utilisez uniquement JWT, vous devrez ajuster les règles ou les désactiver temporairement pour le développement.

## 🔑 Étape 4 : Générer la clé de service

1. Dans Firebase Console, aller dans **Paramètres du projet** (⚙️)
2. Aller dans l'onglet **"Comptes de service"**
3. Cliquer sur **"Générer une nouvelle clé privée"**
4. Un fichier JSON sera téléchargé (ex: `task-manager-api-firebase-adminsdk-xxxxx.json`)
5. **Placer ce fichier** dans le dossier `config/` de votre projet
6. **Renommer** le fichier en `firebase-service-account.json` (ou garder le nom original)

## ⚙️ Étape 5 : Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

### Option A : Utiliser le fichier JSON (Recommandé)

```env
# Firebase Configuration - Option Fichier JSON
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

### Option B : Utiliser les variables d'environnement

```env
# Firebase Configuration - Option Variables
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

⚠️ **Important** : Si vous utilisez l'option B, assurez-vous que `FIREBASE_PRIVATE_KEY` contient les `\n` correctement échappés.

## 📊 Étape 6 : Créer les index Firestore

Firestore nécessite des index pour certaines requêtes. Firebase vous guidera automatiquement, mais voici les index recommandés :

### Index pour la collection `users` :
- Champ : `email` (Ascendant)
- Type : Unique (pour éviter les doublons)

### Index pour la collection `tasks` :
- Champ : `userId` (Ascendant) + `createdAt` (Descendant)
- Type : Composite

### Index pour la collection `passwordResets` :
- Champ : `email` (Ascendant) + `used` (Ascendant) + `createdAt` (Descendant)
- Type : Composite

**Comment créer un index :**
1. Firebase Console → Firestore Database → Index
2. Cliquer sur **"Créer un index"**
3. Suivre les instructions

Ou laissez Firebase vous guider automatiquement lors de l'exécution d'une requête nécessitant un index.

## ✅ Étape 7 : Vérifier la configuration

Exécutez le script de test :

```bash
node test-firebase-connection.js
```

Ce script vérifiera :
- ✅ Connexion à Firebase
- ✅ Accès à Firestore
- ✅ Création/lecture de test
- ✅ Suppression des données de test

## 🧪 Test manuel

Vous pouvez tester la connexion en démarrant le serveur :

```bash
npm run dev
```

Si Firebase est correctement configuré, vous devriez voir :
```
✅ Firebase initialisé avec succès
📊 Projet Firebase: your-project-id
🚀 Server running on port 3000
```

## 🐛 Dépannage

### Erreur : "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### Erreur : "Failed to initialize Firebase"
- Vérifiez que le fichier JSON de service account existe
- Vérifiez le chemin dans `.env` (relatif au dossier racine)
- Vérifiez que les variables d'environnement sont correctes

### Erreur : "Permission denied"
- Vérifiez les règles Firestore
- Vérifiez que la clé de service a les bonnes permissions
- En développement, vous pouvez temporairement mettre les règles en mode test

### Erreur : "Index required"
- Firebase vous donnera un lien pour créer l'index manquant
- Cliquez sur le lien et créez l'index

## 📚 Ressources

- [Documentation Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Documentation Firestore](https://firebase.google.com/docs/firestore)
- [Règles de sécurité Firestore](https://firebase.google.com/docs/firestore/security/get-started)

## 🔄 Migration depuis MySQL

Si vous migrez depuis MySQL, vous devrez :
1. Exporter vos données MySQL
2. Les convertir au format Firestore
3. Les importer dans Firestore

Un script de migration sera créé si nécessaire.

---

**Note** : Ce projet utilise des **UUIDs** comme ID de document au lieu des IDs auto-incrémentés de MySQL. Cela garantit l'unicité globale et facilite la synchronisation.
