const { db, admin } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/**
 * Modèle User pour Firestore
 * Utilise des UUIDs comme ID de document
 */
class UserModel {
  constructor() {
    this.collection = 'users';
  }

  /**
   * Créer un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise<string>} UUID de l'utilisateur créé
   */
  async create(userData) {
    try {
      const userId = uuidv4(); // Générer un UUID
      const userRef = db.collection(this.collection).doc(userId);

      const userDoc = {
        name: userData.name,
        email: userData.email,
        password: userData.password, // Déjà hashé dans le contrôleur
        avatar: userData.avatar || null,
        // Champs RGPD
        consentPrivacyPolicy: userData.consentPrivacyPolicy || false,
        consentTermsOfService: userData.consentTermsOfService || false,
        consentDate: userData.consentDate || admin.firestore.FieldValue.serverTimestamp(),
        consentVersion: userData.consentVersion || '1.0', // Version de la politique acceptée
        dataDeletionRequested: false,
        dataDeletionDate: null,
        lastDataExport: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await userRef.set(userDoc);
      console.log(`✅ Utilisateur créé avec UUID: ${userId}`);
      return userId;
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Trouver un utilisateur par email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object|null>} Données de l'utilisateur avec son UUID
   */
  async findByEmail(email) {
    try {
      const snapshot = await db.collection(this.collection)
        .where('email', '==', email)
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
      console.error('❌ Erreur lors de la recherche par email:', error);
      throw error;
    }
  }

  /**
   * Trouver un utilisateur par UUID
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Promise<Object|null>} Données de l'utilisateur
   */
  async findById(userId) {
    try {
      const userRef = db.collection(this.collection).doc(userId);
      const doc = await userRef.get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id, // UUID
        ...doc.data()
      };
    } catch (error) {
      console.error('❌ Erreur lors de la recherche par ID:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un utilisateur
   * @param {string} userId - UUID de l'utilisateur
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<void>}
   */
  async update(userId, updateData) {
    try {
      const userRef = db.collection(this.collection).doc(userId);
      
      // Ajouter updatedAt automatiquement
      const dataToUpdate = {
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await userRef.update(dataToUpdate);
      console.log(`✅ Utilisateur ${userId} mis à jour`);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      throw error;
    }
  }

  /**
   * Supprimer un utilisateur
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Promise<void>}
   */
  async delete(userId) {
    try {
      const userRef = db.collection(this.collection).doc(userId);
      await userRef.delete();
      console.log(`✅ Utilisateur ${userId} supprimé`);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un email existe déjà
   * @param {string} email - Email à vérifier
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    try {
      const snapshot = await db.collection(this.collection)
        .where('email', '==', email)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de l\'email:', error);
      throw error;
    }
  }

  /**
   * Marquer la date du dernier export de données (droit à la portabilité)
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Promise<void>}
   */
  async updateLastDataExport(userId) {
    try {
      const userRef = db.collection(this.collection).doc(userId);
      await userRef.update({
        lastDataExport: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de lastDataExport:', error);
      throw error;
    }
  }

  /**
   * Marquer une demande de suppression de compte
   * @param {string} userId - UUID de l'utilisateur
   * @param {Date} deletionDate - Date prévue de suppression
   * @returns {Promise<void>}
   */
  async requestDataDeletion(userId, deletionDate) {
    try {
      const userRef = db.collection(this.collection).doc(userId);
      await userRef.update({
        dataDeletionRequested: true,
        dataDeletionDate: admin.firestore.Timestamp.fromDate(deletionDate)
      });
    } catch (error) {
      console.error('❌ Erreur lors de la demande de suppression:', error);
      throw error;
    }
  }
}

module.exports = new UserModel();
