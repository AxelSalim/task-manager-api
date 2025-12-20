require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

// Chemin vers le dossier data
const dataDir = path.join(__dirname, '..', '..', 'data');
const dbPath = path.join(dataDir, 'task-manager.db');

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Dossier data/ créé');
}

// Créer une connexion SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: console.log, // Afficher les requêtes SQL
});

async function testConnection() {
  try {
    console.log('🔄 Test de connexion à SQLite...');
    console.log(`📁 Chemin de la base de données: ${dbPath}`);
    
    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à SQLite réussie !');
    
    // Tester une requête simple
    const [results] = await sequelize.query("SELECT 1 as test");
    console.log('✅ Requête de test réussie:', results);
    
    // Fermer la connexion
    await sequelize.close();
    console.log('✅ Connexion fermée proprement');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    process.exit(1);
  }
}

testConnection();

