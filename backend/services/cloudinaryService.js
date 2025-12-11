const cloudinary = require('../config/cloudinary');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

/**
 * Service Cloudinary pour la gestion des médias
 */
class CloudinaryService {
  constructor() {
    this.folder = 'task-manager/users'; // Dossier de base dans Cloudinary
  }

  /**
   * Uploader un avatar utilisateur vers Cloudinary
   * @param {Object} file - Fichier Multer (req.file)
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Promise<Object>} Résultat de l'upload avec URL
   */
  async uploadAvatar(file, userId) {
    try {
      if (!file) {
        throw new Error('Aucun fichier fourni');
      }

      // Générer un nom de fichier unique (sans inclure le folder dans public_id)
      const fileName = `avatar-${uuidv4()}`;

      // Upload vers Cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        public_id: fileName,
        folder: `${this.folder}/${userId}`, // Le folder sera automatiquement ajouté au chemin
        resource_type: 'image',
        transformation: [
          {
            width: 400,
            height: 400,
            crop: 'fill',
            gravity: 'face', // Détection du visage pour le recadrage
            quality: 'auto',
            format: 'auto'
          }
        ],
        overwrite: false, // Ne pas écraser les fichiers existants
        invalidate: true // Invalider le cache CDN
      });

      console.log(`✅ Avatar uploadé sur Cloudinary: ${result.secure_url}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload Cloudinary:', error);
      throw new Error(`Erreur lors de l'upload de l'avatar: ${error.message}`);
    }
  }

  /**
   * Uploader un fichier depuis un buffer (alternative)
   * @param {Buffer} buffer - Buffer du fichier
   * @param {string} userId - UUID de l'utilisateur
   * @param {string} originalName - Nom original du fichier
   * @returns {Promise<Object>} Résultat de l'upload
   */
  async uploadAvatarFromBuffer(buffer, userId, originalName) {
    try {
      const fileName = `avatar-${uuidv4()}`;
      const ext = path.extname(originalName).substring(1) || 'jpg';

      const result = await cloudinary.uploader.upload_stream(
        {
          public_id: fileName,
          folder: `${this.folder}/${userId}`,
          resource_type: 'image',
          transformation: [
            {
              width: 400,
              height: 400,
              crop: 'fill',
              gravity: 'face',
              quality: 'auto',
              format: 'auto'
            }
          ],
          overwrite: false,
          invalidate: true
        },
        (error, result) => {
          if (error) throw error;
          return result;
        }
      ).end(buffer);

      return new Promise((resolve, reject) => {
        result.on('end', () => {
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        });
        result.on('error', reject);
      });
    } catch (error) {
      console.error('❌ Erreur upload depuis buffer:', error);
      throw error;
    }
  }

  /**
   * Supprimer un avatar de Cloudinary
   * @param {string} publicId - Public ID de l'image sur Cloudinary
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteAvatar(publicId) {
    try {
      if (!publicId) {
        return { success: false, message: 'Public ID manquant' };
      }

      // Extraire le public_id depuis l'URL si nécessaire
      let actualPublicId = publicId;
      if (publicId.includes('cloudinary.com')) {
        // Extraire le public_id depuis l'URL Cloudinary
        const urlParts = publicId.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1) {
          const versionIndex = uploadIndex + 1;
          const pathAfterVersion = urlParts.slice(versionIndex + 1).join('/');
          actualPublicId = pathAfterVersion.replace(/\.[^/.]+$/, ''); // Enlever l'extension
        }
      }

      const result = await cloudinary.uploader.destroy(actualPublicId, {
        resource_type: 'image',
        invalidate: true
      });

      if (result.result === 'ok') {
        console.log(`✅ Avatar supprimé de Cloudinary: ${actualPublicId}`);
        return { success: true, message: 'Avatar supprimé avec succès' };
      } else {
        console.warn(`⚠️  Avatar non trouvé sur Cloudinary: ${actualPublicId}`);
        return { success: false, message: 'Avatar non trouvé' };
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression Cloudinary:', error);
      throw new Error(`Erreur lors de la suppression de l'avatar: ${error.message}`);
    }
  }

  /**
   * Supprimer un avatar depuis son URL
   * @param {string} url - URL de l'image Cloudinary
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteAvatarByUrl(url) {
    try {
      if (!url || !url.includes('cloudinary.com')) {
        return { success: false, message: 'URL Cloudinary invalide' };
      }

      // Extraire le public_id depuis l'URL
      const urlParts = url.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1) {
        throw new Error('URL Cloudinary invalide');
      }

      // Le public_id est après le numéro de version
      const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
      const publicId = pathAfterVersion.replace(/\.[^/.]+$/, ''); // Enlever l'extension

      return await this.deleteAvatar(publicId);
    } catch (error) {
      console.error('❌ Erreur suppression par URL:', error);
      throw error;
    }
  }

  /**
   * Vérifier si une URL est une URL Cloudinary
   * @param {string} url - URL à vérifier
   * @returns {boolean}
   */
  isCloudinaryUrl(url) {
    return url && url.includes('cloudinary.com');
  }

  /**
   * Extraire le public_id depuis une URL Cloudinary
   * @param {string} url - URL Cloudinary
   * @returns {string|null} Public ID ou null
   */
  extractPublicIdFromUrl(url) {
    try {
      if (!this.isCloudinaryUrl(url)) {
        return null;
      }

      const urlParts = url.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1) {
        return null;
      }

      const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
      return pathAfterVersion.replace(/\.[^/.]+$/, '');
    } catch (error) {
      console.error('❌ Erreur extraction public_id:', error);
      return null;
    }
  }
}

module.exports = new CloudinaryService();
