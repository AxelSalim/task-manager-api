const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

class FirebaseService {
  constructor() {
    this.bucket = null;
    this.initialized = false;
  }

  // Initialiser Firebase Admin
  initialize() {
    try {
      // Vérifier si Firebase est configuré
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        console.log('⚠️  Firebase non configuré. Utilisation du stockage local.');
        return false;
      }

      // Initialiser Firebase Admin avec les credentials
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });

      this.bucket = admin.storage().bucket();
      this.initialized = true;
      console.log('✅ Firebase Storage initialisé avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de Firebase:', error.message);
      return false;
    }
  }

  // Vérifier si Firebase est disponible
  isAvailable() {
    return this.initialized && this.bucket !== null;
  }

  // Uploader un fichier vers Firebase Storage
  async uploadFile(file, destinationPath) {
    if (!this.isAvailable()) {
      throw new Error('Firebase Storage n\'est pas initialisé');
    }

    try {
      const fileUpload = this.bucket.file(destinationPath);
      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname
          }
        },
        resumable: false
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          console.error('❌ Erreur upload Firebase:', error);
          reject(error);
        });

        stream.on('finish', async () => {
          try {
            // Rendre le fichier public (optionnel)
            await fileUpload.makePublic();
            
            // Obtenir l'URL publique
            const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${destinationPath}`;
            
            resolve({
              url: publicUrl,
              path: destinationPath,
              filename: path.basename(destinationPath)
            });
          } catch (error) {
            reject(error);
          }
        });

        stream.end(file.buffer);
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error);
      throw error;
    }
  }

  // Supprimer un fichier de Firebase Storage
  async deleteFile(filePath) {
    if (!this.isAvailable()) {
      throw new Error('Firebase Storage n\'est pas initialisé');
    }

    try {
      // Extraire le chemin du fichier depuis l'URL complète si nécessaire
      let pathToDelete = filePath;
      if (filePath.includes('storage.googleapis.com')) {
        const urlParts = filePath.split('/');
        pathToDelete = urlParts.slice(urlParts.indexOf(this.bucket.name) + 1).join('/');
      }

      const file = this.bucket.file(pathToDelete);
      const [exists] = await file.exists();

      if (exists) {
        await file.delete();
        console.log(`🗑️  Fichier supprimé de Firebase: ${pathToDelete}`);
        return true;
      } else {
        console.log(`⚠️  Fichier non trouvé dans Firebase: ${pathToDelete}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  }

  // Obtenir l'URL publique d'un fichier
  async getPublicUrl(filePath) {
    if (!this.isAvailable()) {
      throw new Error('Firebase Storage n\'est pas initialisé');
    }

    try {
      const file = this.bucket.file(filePath);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // URL permanente (ou utilisez une date d'expiration)
      });
      return url;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'URL:', error);
      throw error;
    }
  }

  // Générer un chemin unique pour un fichier
  generateFilePath(originalName, folder = 'users') {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName);
    return `images/${folder}/user-${uniqueSuffix}${ext}`;
  }
}

// Exporter une instance singleton
const firebaseService = new FirebaseService();

// Initialiser automatiquement au chargement du module
if (process.env.USE_FIREBASE_STORAGE === 'true') {
  firebaseService.initialize();
}

module.exports = firebaseService;
