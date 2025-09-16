# 🚀 Task Manager API

Une API REST complète de gestion des tâches et des utilisateurs, construite avec **Node.js**, **Express**, **Sequelize** et **MySQL**.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Technologies utilisées](#-technologies-utilisées)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Structure du projet](#-structure-du-projet)
- [API Endpoints](#-api-endpoints)
- [Authentification](#-authentification)
- [Documentation Swagger](#-documentation-swagger)
- [Base de données](#-base-de-données)
- [Scripts disponibles](#-scripts-disponibles)
- [Variables d'environnement](#-variables-denvironnement)
- [Contribuer](#-contribuer)
- [Licence](#-licence)

## ✨ Fonctionnalités

### 👥 Gestion des utilisateurs
- **Inscription** : Création de compte avec validation email
- **Connexion** : Authentification JWT sécurisée
- **Profil** : Récupération et mise à jour des informations utilisateur
- **Avatar** : Upload et gestion des images de profil
- **Sécurité** : Hashage des mots de passe avec bcrypt

### 📝 Gestion des tâches
- **CRUD complet** : Création, lecture, mise à jour, suppression
- **Association utilisateur** : Chaque tâche est liée à un utilisateur
- **Statuts** : Gestion des états des tâches (todo, en cours, terminé)
- **Sécurité** : Accès restreint aux tâches de l'utilisateur connecté

### 🔐 Sécurité
- **Middleware d'authentification** : Protection des routes sensibles
- **JWT Tokens** : Authentification stateless sécurisée
- **Validation des données** : Vérification des entrées utilisateur
- **Gestion des erreurs** : Messages d'erreur appropriés

### 📡 WebSocket en temps réel
- **Notifications instantanées** : Mises à jour en temps réel des tâches
- **Authentification WebSocket** : Sécurisation des connexions WebSocket
- **Événements personnalisés** : `task_created`, `task_updated`, `task_deleted`
- **Rooms utilisateur** : Isolation des données par utilisateur

## 🛠️ Technologies utilisées

- **Backend** : Node.js, Express.js
- **Base de données** : MySQL avec Sequelize ORM
- **Authentification** : JWT (JSON Web Tokens)
- **WebSocket** : Socket.IO pour les mises à jour en temps réel
- **Sécurité** : bcrypt pour le hashage des mots de passe
- **Documentation** : Swagger/OpenAPI 3.0
- **Middleware** : CORS, Morgan (logging), dotenv
- **Développement** : Nodemon pour le rechargement automatique

## 📋 Prérequis

- **Node.js** (version 18+ recommandée)
- **MySQL** (version 8.0+)
- **npm** ou **yarn**
- **Git**

## 🚀 Installation

### 1. Cloner le repository
```bash
git clone https://github.com/AxelSalim/task-manager-api.git
cd task-manager-api
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration de la base de données
```bash
# Créer une base de données MySQL
CREATE DATABASE task_manager_db;
```

### 4. Configuration des variables d'environnement
```bash
# Copier le fichier .env.example
cp .env.example .env

# Éditer le fichier .env avec vos informations
```

### 5. Lancer l'application
```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```

## ⚙️ Configuration

### Variables d'environnement (.env)
```env
# Serveur
PORT=3000
NODE_ENV=development

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=task_manager_db
DB_USER=root
DB_PASS=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Upload
UPLOAD_PATH=./public/uploads/images/users
MAX_FILE_SIZE=5242880
```

## 📁 Structure du projet

```
task-manager-api/
├── 📁 config/
│   └── db.js                 # Configuration de la base de données
├── 📁 controllers/
│   ├── task.controller.js     # Logique métier des tâches
│   └── user.controller.js     # Logique métier des utilisateurs
├── 📁 middlewares/
│   └── authmiddleware.js     # Middleware d'authentification JWT
├── 📁 models/
│   ├── Task.js               # Modèle Sequelize des tâches
│   └── User.js               # Modèle Sequelize des utilisateurs
├── 📁 routes/
│   ├── task.routes.js        # Routes des tâches
│   └── user.routes.js        # Routes des utilisateurs
├── 📁 public/
│   └── 📁 uploads/           # Stockage des fichiers uploadés
├── app.js                     # Configuration Express et middleware
├── server.js                  # Point d'entrée de l'application
├── swagger.js                 # Configuration Swagger
├── package.json               # Dépendances et scripts
└── README.md                  # Ce fichier
```

## 🌐 API Endpoints

### 🔐 Authentification
| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| `POST` | `/api/users/register` | Inscription utilisateur | ❌ Non |
| `POST` | `/api/users/login` | Connexion utilisateur | ❌ Non |
| `GET` | `/api/users/me` | Profil utilisateur connecté | ✅ Oui |
| `PUT` | `/api/users/updateavatar` | Mise à jour avatar | ✅ Oui |

### 📝 Tâches
| Méthode | Endpoint | Description | Authentification |
|---------|----------|-------------|------------------|
| `GET` | `/api/tasks` | Récupérer toutes les tâches | ✅ Oui |
| `GET` | `/api/tasks/:id` | Récupérer une tâche | ✅ Oui |
| `POST` | `/api/tasks` | Créer une nouvelle tâche | ✅ Oui |
| `PUT` | `/api/tasks/:id` | Mettre à jour une tâche | ✅ Oui |
| `DELETE` | `/api/tasks/:id` | Supprimer une tâche | ✅ Oui |

### 📚 Documentation
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api-docs` | Documentation Swagger UI |

## 🔐 Authentification

L'API utilise des **JWT (JSON Web Tokens)** pour l'authentification :

1. **Connexion** : L'utilisateur reçoit un token JWT
2. **Requêtes authentifiées** : Inclure le token dans le header `Authorization: Bearer <token>`
3. **Expiration** : Les tokens expirent après 7 jours par défaut

### Exemple d'utilisation
```bash
# Connexion
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Utilisation du token
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <your_jwt_token>"
```

## 📖 Documentation Swagger

L'API est entièrement documentée avec **Swagger/OpenAPI 3.0** :

- **URL** : `http://localhost:3000/api-docs`
- **Format** : OpenAPI 3.0
- **Interface** : Swagger UI interactive
- **Tests** : Possibilité de tester les endpoints directement

## 📡 WebSocket en temps réel

L'API intègre **Socket.IO** pour des mises à jour en temps réel :

- **URL WebSocket** : `ws://localhost:3000`
- **Authentification** : Token JWT dans la query string
- **Événements** : `task_created`, `task_updated`, `task_deleted`
- **Documentation complète** : Voir `docs/websocket.md`

### Exemple de connexion
```javascript
const socket = io('http://localhost:3000', {
  query: { token: 'your_jwt_token' }
});

socket.on('task_created', (data) => {
  console.log('Nouvelle tâche:', data.data);
});
```

## 🗄️ Base de données

### Modèle User
```sql
- id (INT, PK, AUTO_INCREMENT)
- username (VARCHAR, NOT NULL)
- email (VARCHAR, UNIQUE, NOT NULL)
- password (VARCHAR, NOT NULL)
- avatar (VARCHAR, NULLABLE)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Modèle Task
```sql
- id (INT, PK, AUTO_INCREMENT)
- title (VARCHAR, NOT NULL)
- status (VARCHAR, DEFAULT: 'todo')
- userId (INT, FK -> User.id)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Relations
- **User** ↔ **Task** : One-to-Many (un utilisateur peut avoir plusieurs tâches)

## 📜 Scripts disponibles

```bash
# Développement (avec rechargement automatique)
npm run dev

# Production
npm start

# Tests (à implémenter)
npm test

# Linting (à implémenter)
npm run lint
```

## 🌍 Variables d'environnement

| Variable | Description | Défaut | Requis |
|----------|-------------|---------|---------|
| `PORT` | Port du serveur | 3000 | ❌ |
| `NODE_ENV` | Environnement | development | ❌ |
| `DB_HOST` | Hôte MySQL | localhost | ✅ |
| `DB_PORT` | Port MySQL | 3306 | ❌ |
| `DB_NAME` | Nom de la base | - | ✅ |
| `DB_USER` | Utilisateur MySQL | - | ✅ |
| `DB_PASS` | Mot de passe MySQL | - | ✅ |
| `JWT_SECRET` | Clé secrète JWT | - | ✅ |
| `JWT_EXPIRES_IN` | Expiration JWT | 7d | ❌ |

## 🤝 Contribuer

1. **Fork** le projet
2. **Créer** une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Standards de code
- Utiliser des noms de variables/fonctions descriptifs
- Commenter le code complexe
- Suivre les conventions ESLint (à implémenter)
- Tester vos modifications

## 📝 TODO / Améliorations futures

- [ ] **Tests unitaires** avec Jest
- [ ] **Validation des données** avec Joi ou Yup
- [ ] **Rate limiting** pour la sécurité
- [ ] **Logging avancé** avec Winston
- [ ] **Compression** des réponses
- [ ] **Cache** avec Redis
- [ ] **Tests d'intégration**
- [ ] **CI/CD** avec GitHub Actions
- [ ] **Docker** pour le déploiement
- [ ] **Monitoring** avec PM2

## 🐛 Dépannage

### Erreurs courantes

#### 1. Connexion base de données
```bash
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution** : Vérifier que MySQL est démarré et que les paramètres de connexion sont corrects.

#### 2. Port déjà utilisé
```bash
Error: listen EADDRINUSE :::3000
```
**Solution** : Changer le port dans `.env` ou arrêter le processus qui utilise le port 3000.

#### 3. JWT invalide
```bash
Error: invalid token
```
**Solution** : Vérifier que le token est valide et non expiré.

## 📄 Licence

Ce projet est sous licence **ISC**. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

**ADJAKIDJE Axel**
- GitHub : [@AxelSalim](https://github.com/AxelSalim)
- Email : [adjakidjememiaghe@gmail.com]

## 🙏 Remerciements

- **Express.js** pour le framework web
- **Sequelize** pour l'ORM
- **Swagger** pour la documentation
- **Communauté Node.js** pour le support

---

⭐ **N'oubliez pas de donner une étoile à ce projet si vous l'aimez !**
