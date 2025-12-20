/**
 * Utilitaires pour la gestion de la base de données SQLite côté Electron
 * 
 * Note: La base de données est gérée par Sequelize dans le backend.
 * Ces utilitaires peuvent être utilisés pour des opérations spécifiques à Electron.
 */

const path = require('path');
const { app } = require('electron');

/**
 * Obtenir le chemin de la base de données
 * @returns {string} Chemin absolu vers la base de données
 */
function getDatabasePath() {
  // En développement, utiliser le chemin relatif
  // En production, utiliser le chemin dans le dossier de l'application
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    return path.join(__dirname, '..', '..', 'data', 'task-manager.db');
  } else {
    // En production, utiliser le dossier userData d'Electron
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'task-manager.db');
  }
}

/**
 * Obtenir le chemin du dossier data
 * @returns {string} Chemin absolu vers le dossier data
 */
function getDataPath() {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    return path.join(__dirname, '..', '..', 'data');
  } else {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'data');
  }
}

/**
 * Vérifier si la base de données existe
 * @returns {Promise<boolean>}
 */
async function databaseExists() {
  const fs = require('fs').promises;
  const dbPath = getDatabasePath();
  
  try {
    await fs.access(dbPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Créer le dossier data s'il n'existe pas
 * @returns {Promise<void>}
 */
async function ensureDataDirectory() {
  const fs = require('fs').promises;
  const dataPath = getDataPath();
  
  try {
    await fs.mkdir(dataPath, { recursive: true });
  } catch (error) {
    console.error('❌ Erreur lors de la création du dossier data:', error);
    throw error;
  }
}

module.exports = {
  getDatabasePath,
  getDataPath,
  databaseExists,
  ensureDataDirectory
};

