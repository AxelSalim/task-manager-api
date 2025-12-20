/**
 * Utilitaires pour la gestion du stockage de fichiers côté Electron
 * 
 * Note: Le stockage est géré par storageService dans le backend.
 * Ces utilitaires peuvent être utilisés pour des opérations spécifiques à Electron.
 */

const path = require('path');
const { app } = require('electron');
const fs = require('fs').promises;

/**
 * Obtenir le chemin du dossier de stockage
 * @returns {string} Chemin absolu vers le dossier de stockage
 */
function getStoragePath() {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    return path.join(__dirname, '..', '..', 'data', 'storage');
  } else {
    // En production, utiliser le dossier userData d'Electron
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'storage');
  }
}

/**
 * Obtenir le chemin du dossier des avatars
 * @returns {string} Chemin absolu vers le dossier des avatars
 */
function getAvatarsPath() {
  return path.join(getStoragePath(), 'avatars');
}

/**
 * Créer la structure de dossiers de stockage
 * @returns {Promise<void>}
 */
async function ensureStorageDirectories() {
  try {
    const storagePath = getStoragePath();
    const avatarsPath = getAvatarsPath();
    
    await fs.mkdir(storagePath, { recursive: true });
    await fs.mkdir(avatarsPath, { recursive: true });
    
    console.log('✅ Dossiers de stockage créés/vérifiés');
  } catch (error) {
    console.error('❌ Erreur lors de la création des dossiers de stockage:', error);
    throw error;
  }
}

/**
 * Obtenir la taille totale du stockage
 * @returns {Promise<number>} Taille en bytes
 */
async function getStorageSize() {
  const storagePath = getStoragePath();
  
  async function getDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          totalSize += await getDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Ignorer les erreurs (dossiers vides, etc.)
    }
    
    return totalSize;
  }
  
  return await getDirectorySize(storagePath);
}

/**
 * Formater la taille en format lisible
 * @param {number} bytes - Taille en bytes
 * @returns {string} Taille formatée
 */
function formatStorageSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Nettoyer les fichiers orphelins (optionnel, à implémenter si nécessaire)
 * @param {number} maxAge - Âge maximum en jours
 * @returns {Promise<number>} Nombre de fichiers supprimés
 */
async function cleanupOrphanedFiles(maxAge = 30) {
  // TODO: Implémenter le nettoyage des fichiers orphelins
  return 0;
}

module.exports = {
  getStoragePath,
  getAvatarsPath,
  ensureStorageDirectories,
  getStorageSize,
  formatStorageSize,
  cleanupOrphanedFiles
};

