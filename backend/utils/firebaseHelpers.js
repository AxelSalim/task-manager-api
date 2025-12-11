const { admin } = require('../config/firebase');

/**
 * Helpers pour faciliter l'utilisation de Firestore
 */

class FirebaseHelpers {
  /**
   * Convertir un Firestore Timestamp en Date JavaScript
   * @param {Object} timestamp - Firestore Timestamp
   * @returns {Date|null}
   */
  static timestampToDate(timestamp) {
    if (!timestamp) return null;
    
    // Si c'est déjà une Date
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    // Si c'est un Firestore Timestamp
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    
    return null;
  }

  /**
   * Convertir une Date en Firestore Timestamp
   * @param {Date} date - Date JavaScript
   * @returns {admin.firestore.Timestamp}
   */
  static dateToTimestamp(date) {
    if (!date) return null;
    return admin.firestore.Timestamp.fromDate(date instanceof Date ? date : new Date(date));
  }

  /**
   * Formater un document Firestore pour l'API
   * Convertit les Timestamps en dates ISO et ajoute l'ID
   * @param {Object} doc - Document Firestore
   * @returns {Object}
   */
  static formatDocument(doc) {
    if (!doc) return null;

    const data = { ...doc };
    
    // Convertir les Timestamps en dates ISO
    Object.keys(data).forEach(key => {
      if (data[key] && typeof data[key] === 'object') {
        // Firestore Timestamp
        if (data[key].toDate) {
          data[key] = data[key].toDate().toISOString();
        }
        // Firestore FieldValue (ne pas convertir)
        else if (data[key]._methodName) {
          // Garder tel quel
        }
      }
    });

    return data;
  }

  /**
   * Formater plusieurs documents Firestore
   * @param {Array} docs - Array de documents Firestore
   * @returns {Array}
   */
  static formatDocuments(docs) {
    if (!Array.isArray(docs)) return [];
    return docs.map(doc => this.formatDocument(doc));
  }

  /**
   * Créer une référence Firestore vers un document
   * @param {string} collection - Nom de la collection
   * @param {string} docId - ID du document
   * @returns {admin.firestore.DocumentReference}
   */
  static createReference(collection, docId) {
    const { db } = require('../config/firebase');
    return db.collection(collection).doc(docId);
  }

  /**
   * Vérifier si un document existe
   * @param {string} collection - Nom de la collection
   * @param {string} docId - ID du document
   * @returns {Promise<boolean>}
   */
  static async documentExists(collection, docId) {
    const { db } = require('../config/firebase');
    const docRef = db.collection(collection).doc(docId);
    const doc = await docRef.get();
    return doc.exists;
  }

  /**
   * Obtenir le timestamp serveur Firestore
   * @returns {admin.firestore.FieldValue}
   */
  static serverTimestamp() {
    return admin.firestore.FieldValue.serverTimestamp();
  }

  /**
   * Supprimer un champ d'un document
   * @returns {admin.firestore.FieldValue}
   */
  static deleteField() {
    return admin.firestore.FieldValue.delete();
  }
}

module.exports = FirebaseHelpers;
