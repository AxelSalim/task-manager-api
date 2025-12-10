# 📸 Configuration Cloudinary

Ce guide explique comment configurer Cloudinary pour le stockage des médias (avatars) dans votre API Task Manager.

## 📋 Prérequis

1. Un compte Cloudinary (gratuit disponible sur [cloudinary.com](https://cloudinary.com))
2. Un projet Cloudinary créé

## 🚀 Étape 1 : Créer un compte Cloudinary

1. Aller sur [cloudinary.com](https://cloudinary.com)
2. Cliquer sur **"Sign Up"** (Inscription)
3. Remplir le formulaire :
   - Email
   - Nom
   - Mot de passe
   - Confirmer le compte via email

## 🔑 Étape 2 : Récupérer les identifiants API

Une fois connecté à votre compte Cloudinary :

1. Aller dans le **Dashboard**
2. Dans la section **"Account Details"**, vous trouverez :
   - **Cloud name** : Nom de votre cloud
   - **API Key** : Clé API
   - **API Secret** : Secret API (cliquer sur "Reveal" pour l'afficher)

⚠️ **Important** : Gardez votre API Secret confidentiel !

## ⚙️ Étape 3 : Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Exemple :

```env
CLOUDINARY_CLOUD_NAME=dxample123
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## 📁 Étape 4 : Structure des dossiers Cloudinary

Les avatars sont organisés dans Cloudinary comme suit :

```
task-manager/
└── users/
    └── {userId}/
        └── avatar-{uuid}.{ext}
```

Exemple : `task-manager/users/550e8400-e29b-41d4-a716-446655440000/avatar-123456.jpg`

## 🎨 Étape 5 : Transformations d'images

Le service applique automatiquement ces transformations :

- **Taille** : 400x400 pixels
- **Recadrage** : `fill` avec détection du visage (`gravity: face`)
- **Qualité** : Automatique
- **Format** : Automatique (optimisation)

Ces transformations sont configurées dans `services/cloudinaryService.js`.

## ✅ Étape 6 : Vérifier la configuration

Démarrez votre serveur :

```bash
npm run dev
```

Si Cloudinary est correctement configuré, vous devriez voir :

```
✅ Cloudinary configuré avec succès
📸 Cloud: your-cloud-name
```

## 🧪 Test de l'upload

### Via Swagger UI

1. Aller sur `http://localhost:3000/api/docs`
2. Tester `POST /api/users/register` avec un fichier image
3. Vérifier que l'avatar est uploadé sur Cloudinary

### Via Postman/cURL

```bash
curl -X POST http://localhost:3000/api/users/register \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "password=password123" \
  -F "consentPrivacyPolicy=true" \
  -F "consentTermsOfService=true" \
  -F "avatar=@/path/to/image.jpg"
```

## 🔧 Fonctionnalités implémentées

### Upload d'avatar
- Upload automatique lors de l'inscription
- Upload lors de la mise à jour de l'avatar
- Transformation automatique (400x400, face detection)
- Suppression du fichier local après upload

### Suppression d'avatar
- Suppression automatique de l'ancien avatar lors de la mise à jour
- Suppression lors de la suppression du compte (RGPD)
- Gestion des erreurs (continue même si la suppression échoue)

### Migration
- Support des anciens avatars locaux (migration progressive)
- Détection automatique Cloudinary vs local

## 📊 Gestion des médias

### Formats supportés
- JPEG, JPG
- PNG
- GIF
- WebP

### Limitations
- Taille maximale : 5MB (configuré dans `middlewares/upload.js`)
- Types autorisés : Images uniquement

## 🐛 Dépannage

### Erreur : "Cloudinary configuré avec succès" mais upload échoue

**Vérifiez :**
- Les variables d'environnement sont correctes
- Le fichier `.env` est bien chargé
- Les identifiants API sont valides

### Erreur : "Invalid API credentials"

**Solution :**
- Vérifiez votre Cloud Name, API Key et API Secret
- Assurez-vous qu'il n'y a pas d'espaces dans les valeurs
- Vérifiez que votre compte Cloudinary est actif

### Erreur : "File too large"

**Solution :**
- Vérifiez la taille du fichier (max 5MB)
- Compressez l'image avant upload
- Ajustez `MAX_FILE_SIZE` dans `middlewares/upload.js` si nécessaire

### Erreur : "Invalid file type"

**Solution :**
- Vérifiez que le fichier est une image
- Formats supportés : JPEG, PNG, GIF, WebP
- Vérifiez `fileFilter` dans `middlewares/upload.js`

## 💰 Tarification Cloudinary

### Plan gratuit
- **Stockage** : 25 GB
- **Bandwidth** : 25 GB/mois
- **Transformations** : Illimitées
- **Uploads** : 500 MB/mois

### Plans payants
- Plans disponibles selon vos besoins
- Voir [cloudinary.com/pricing](https://cloudinary.com/pricing)

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais commiter** les identifiants API dans le code
2. **Utiliser des variables d'environnement** pour les secrets
3. **Limiter les accès** dans le Dashboard Cloudinary
4. **Activer l'authentification** pour les uploads (optionnel)

### Upload sécurisé

- Validation du type de fichier côté serveur
- Limitation de la taille
- Transformation automatique pour éviter les fichiers malveillants
- Nettoyage des fichiers locaux après upload

## 📚 Ressources

- [Documentation Cloudinary](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Transformations d'images](https://cloudinary.com/documentation/image_transformations)

## 🔄 Migration depuis le stockage local

Si vous avez déjà des avatars stockés localement :

1. Les anciens avatars continueront de fonctionner
2. Les nouveaux avatars seront uploadés sur Cloudinary
3. Lors de la mise à jour d'un avatar local, il sera remplacé par un avatar Cloudinary
4. Optionnel : Créer un script de migration pour uploader tous les avatars existants

---

**Note** : Les URLs Cloudinary sont permanentes et accessibles via HTTPS. Elles sont optimisées pour le CDN et la performance.
