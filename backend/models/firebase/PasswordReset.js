const { db, admin } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Modèle PasswordReset pour Firestore
 * Utilise des UUIDs comme ID de document
 */
class PasswordResetModel {
  constructor() {
    this.collection = 'passwordResets';
  }

  /**
   * Créer un nouveau code OTP de réinitialisation
   * @param {Object} resetData - Données du reset
   * @returns {Promise<string>} UUID du reset créé
   */
  async create(resetData) {
    try {
      const resetId = uuidv4(); // Générer un UUID
      const resetRef = db.collection(this.collection).doc(resetId);

      const resetDoc = {
        email: resetData.email,
        otp_code: resetData.otp_code, // Déjà hashé
        expires_at: admin.firestore.Timestamp.fromDate(resetData.expires_at),
        used: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await resetRef.set(resetDoc);
      console.log(`✅ Code OTP créé avec UUID: ${resetId}`);
      return resetId;
    } catch (error) {
      console.error('❌ Erreur lors de la création du code OTP:', error);
      throw error;
    }
  }

  /**
   * Trouver le code OTP le plus récent pour un email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object|null>} Données du reset
   */
  async findLatestByEmail(email) {
    try {
      const snapshot = await db.collection(this.collection)
        .where('email', '==', email)
        .where('used', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id, // UUID
        ...doc.data()
      };
    } catch (error) {
      console.error('❌ Erreur lors de la recherche du code OTP:', error);
      throw error;
    }
  }

  /**
   * Marquer un code OTP comme utilisé
   * @param {string} resetId - UUID du reset
   * @returns {Promise<void>}
   */
  async markAsUsed(resetId) {
    try {
      const resetRef = db.collection(this.collection).doc(resetId);
      await resetRef.update({
        used: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Code OTP ${resetId} marqué comme utilisé`);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      throw error;
    }
  }

  /**
   * Supprimer tous les codes OTP pour un email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<number>} Nombre de codes supprimés
   */
  async deleteByEmail(email) {
    try {
      const snapshot = await db.collection(this.collection)
        .where('email', '==', email)
        .get();

      if (snapshot.empty) {
        return 0;
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ ${snapshot.docs.length} code(s) OTP supprimé(s) pour ${email}`);
      return snapshot.docs.length;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un code OTP est expiré
   * @param {Object} resetData - Données du reset avec expires_at
   * @returns {boolean}
   */
  isExpired(resetData) {
    if (!resetData.expires_at) {
      return true;
    }

    // Convertir Firestore Timestamp en Date
    const expiresAt = resetData.expires_at.toDate();
    return new Date() > expiresAt;
  }

  /**
   * Nettoyer les codes OTP expirés
   * @returns {Promise<number>} Nombre de codes supprimés
   */
  async cleanupExpiredCodes() {
    try {
      const now = admin.firestore.Timestamp.now();
      const snapshot = await db.collection(this.collection)
        .where('expires_at', '<', now)
        .get();

      if (snapshot.empty) {
        return 0;
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`🧹 ${snapshot.docs.length} code(s) OTP expiré(s) supprimé(s)`);
      return snapshot.docs.length;
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      throw error;
    }
  }
}

module.exports = new PasswordResetModel();
