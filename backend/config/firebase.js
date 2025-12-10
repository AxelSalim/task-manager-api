const admin = require('firebase-admin');
require('dotenv').config();

// Initialisation de Firebase Admin SDK
let firebaseApp;
let db;

try {
  // Option 1 : Utiliser le fichier JSON de service account (recommandé)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  }
  // Option 2 : Utiliser les variables d'environnement
  else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
        authUri: process.env.FIREBASE_AUTH_URI,
        tokenUri: process.env.FIREBASE_TOKEN_URI
      }),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
  // Option 3 : Utiliser les credentials par défaut (pour Firebase Emulator ou production)
  else {
    // En production, Firebase peut utiliser les credentials par défaut
    // (par exemple sur Google Cloud Run, App Engine, etc.)
    firebaseApp = admin.initializeApp();
  }

  // Obtenir l'instance Firestore
  db = admin.firestore();

  console.log('✅ Firebase Admin SDK initialisé avec succès');
  console.log(`📊 Projet Firebase: ${firebaseApp.options.projectId || 'Non défini'}`);

} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation de Firebase:', error.message);
  console.error('💡 Vérifiez vos variables d\'environnement ou le fichier de service account');
  throw error;
}

// Exporter l'instance Firestore et admin pour utilisation dans le projet
module.exports = {
  db,
  admin,
  firebaseApp
};
