const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

/**
 * Service de stockage local pour la gestion des médias
 */
class StorageService {
  constructor() {
    // Chemin de base pour le stockage (relatif à la racine du projet)
    this.baseDir = path.join(__dirname, '..', '..', 'data', 'storage');
    this.avatarsDir = path.join(this.baseDir, 'avatars');
    
    // S'assurer que les dossiers existent
    this.ensureDirectories();
  }

  /**
   * Créer les dossiers nécessaires s'ils n'existent pas
   */
  async ensureDirectories() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      await fs.mkdir(this.avatarsDir, { recursive: true });
    } catch (error) {
      console.error('❌ Erreur lors de la création des dossiers:', error);
    }
  }

  /**
   * Uploader un avatar utilisateur
   * @param {Object} file - Fichier Multer (req.file)
   * @param {string|number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Résultat de l'upload avec URL relative
   */
  async uploadAvatar(file, userId) {
    try {
      if (!file) {
        throw new Error('Aucun fichier fourni');
      }

      // Générer un nom de fichier unique
      const fileExt = path.extname(file.originalname).toLowerCase() || '.jpg';
      const fileName = `avatar-${userId}-${uuidv4()}${fileExt}`;
      const filePath = path.join(this.avatarsDir, fileName);

      // Redimensionner et optimiser l'image avec sharp
      await sharp(file.path)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(filePath);

      // Supprimer le fichier temporaire original
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.warn('⚠️  Impossible de supprimer le fichier temporaire:', unlinkError.message);
      }

      // URL relative pour stockage en base de données
      // Format: /storage/avatars/filename.jpg
      const relativeUrl = `/storage/avatars/${fileName}`;

      console.log(`✅ Avatar uploadé localement: ${relativeUrl}`);

      return {
        url: relativeUrl,
        path: filePath,
        fileName: fileName
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload local:', error);
      throw new Error(`Erreur lors de l'upload de l'avatar: ${error.message}`);
    }
  }

  /**
   * Supprimer un avatar
   * @param {string} avatarUrl - URL relative de l'avatar (ex: /storage/avatars/avatar-123.jpg)
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteAvatar(avatarUrl) {
    try {
      if (!avatarUrl) {
        return { success: false, message: 'URL d\'avatar manquante' };
      }

      // Si c'est une URL Cloudinary (ancien système), on ne fait rien
      if (this.isCloudinaryUrl(avatarUrl)) {
        console.warn('⚠️  URL Cloudinary détectée, suppression ignorée:', avatarUrl);
        return { success: false, message: 'URL Cloudinary, suppression ignorée' };
      }

      // Extraire le nom de fichier depuis l'URL relative
      const fileName = path.basename(avatarUrl);
      const filePath = path.join(this.avatarsDir, fileName);

      // Vérifier si le fichier existe
      try {
        await fs.access(filePath);
      } catch (accessError) {
        console.warn(`⚠️  Fichier non trouvé: ${filePath}`);
        return { success: false, message: 'Fichier non trouvé' };
      }

      // Supprimer le fichier
      await fs.unlink(filePath);
      console.log(`✅ Avatar supprimé: ${filePath}`);

      return { success: true, message: 'Avatar supprimé avec succès' };
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw new Error(`Erreur lors de la suppression de l'avatar: ${error.message}`);
    }
  }

  /**
   * Supprimer un avatar depuis son URL (compatibilité avec l'ancien code)
   * @param {string} url - URL de l'avatar (relative ou Cloudinary)
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteAvatarByUrl(url) {
    return await this.deleteAvatar(url);
  }

  /**
   * Vérifier si une URL est une URL Cloudinary (pour compatibilité)
   * @param {string} url - URL à vérifier
   * @returns {boolean}
   */
  isCloudinaryUrl(url) {
    return url && typeof url === 'string' && url.includes('cloudinary.com');
  }

  /**
   * Obtenir le chemin absolu d'un fichier depuis son URL relative
   * @param {string} relativeUrl - URL relative (ex: /storage/avatars/avatar-123.jpg)
   * @returns {string} Chemin absolu
   */
  getAbsolutePath(relativeUrl) {
    if (!relativeUrl || !relativeUrl.startsWith('/storage/')) {
      return null;
    }

    // Enlever le préfixe /storage/
    const filePath = relativeUrl.replace('/storage/', '');
    return path.join(this.baseDir, filePath);
  }

  /**
   * Nettoyer les avatars orphelins (non utilisés)
   * @param {Array<string>} usedAvatarUrls - Liste des URLs d'avatars utilisés
   * @returns {Promise<Object>} Résultat du nettoyage
   */
  async cleanupOrphanedAvatars(usedAvatarUrls) {
    try {
      const files = await fs.readdir(this.avatarsDir);
      let deletedCount = 0;
      let errors = [];

      for (const file of files) {
        const fileUrl = `/storage/avatars/${file}`;
        
        // Si le fichier n'est pas dans la liste des avatars utilisés
        if (!usedAvatarUrls.includes(fileUrl)) {
          try {
            const filePath = path.join(this.avatarsDir, file);
            await fs.unlink(filePath);
            deletedCount++;
            console.log(`🗑️  Avatar orphelin supprimé: ${file}`);
          } catch (error) {
            errors.push({ file, error: error.message });
          }
        }
      }

      return {
        success: true,
        deletedCount,
        errors: errors.length > 0 ? errors : null
      };
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      throw error;
    }
  }
}

module.exports = new StorageService();

