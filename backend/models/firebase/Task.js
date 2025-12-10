const { db, admin } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Modèle Task pour Firestore
 * Utilise des UUIDs comme ID de document
 */
class TaskModel {
  constructor() {
    this.collection = 'tasks';
  }

  /**
   * Créer une nouvelle tâche
   * @param {Object} taskData - Données de la tâche
   * @returns {Promise<string>} UUID de la tâche créée
   */
  async create(taskData) {
    try {
      const taskId = uuidv4(); // Générer un UUID
      const taskRef = db.collection(this.collection).doc(taskId);

      const taskDoc = {
        title: taskData.title,
        status: taskData.status || 'todo',
        userId: taskData.userId, // UUID de l'utilisateur
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await taskRef.set(taskDoc);
      console.log(`✅ Tâche créée avec UUID: ${taskId}`);
      return taskId;
    } catch (error) {
      console.error('❌ Erreur lors de la création de la tâche:', error);
      throw error;
    }
  }

  /**
   * Trouver toutes les tâches d'un utilisateur
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Promise<Array>} Liste des tâches
   */
  async findByUserId(userId) {
    try {
      const snapshot = await db.collection(this.collection)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map(doc => ({
        id: doc.id, // UUID
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Erreur lors de la recherche des tâches:', error);
      throw error;
    }
  }

  /**
   * Trouver une tâche par UUID
   * @param {string} taskId - UUID de la tâche
   * @returns {Promise<Object|null>} Données de la tâche
   */
  async findById(taskId) {
    try {
      const taskRef = db.collection(this.collection).doc(taskId);
      const doc = await taskRef.get();

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
   * Trouver une tâche par UUID et userId (vérification de propriété)
   * @param {string} taskId - UUID de la tâche
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Promise<Object|null>} Données de la tâche si elle appartient à l'utilisateur
   */
  async findByIdAndUserId(taskId, userId) {
    try {
      const taskRef = db.collection(this.collection).doc(taskId);
      const doc = await taskRef.get();

      if (!doc.exists) {
        return null;
      }

      const taskData = doc.data();
      
      // Vérifier que la tâche appartient à l'utilisateur
      if (taskData.userId !== userId) {
        return null;
      }

      return {
        id: doc.id, // UUID
        ...taskData
      };
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une tâche
   * @param {string} taskId - UUID de la tâche
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<void>}
   */
  async update(taskId, updateData) {
    try {
      const taskRef = db.collection(this.collection).doc(taskId);
      
      // Ajouter updatedAt automatiquement
      const dataToUpdate = {
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await taskRef.update(dataToUpdate);
      console.log(`✅ Tâche ${taskId} mise à jour`);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      throw error;
    }
  }

  /**
   * Supprimer une tâche
   * @param {string} taskId - UUID de la tâche
   * @returns {Promise<void>}
   */
  async delete(taskId) {
    try {
      const taskRef = db.collection(this.collection).doc(taskId);
      await taskRef.delete();
      console.log(`✅ Tâche ${taskId} supprimée`);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Supprimer toutes les tâches d'un utilisateur
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Promise<number>} Nombre de tâches supprimées
   */
  async deleteByUserId(userId) {
    try {
      const snapshot = await db.collection(this.collection)
        .where('userId', '==', userId)
        .get();

      if (snapshot.empty) {
        return 0;
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ ${snapshot.docs.length} tâche(s) supprimée(s) pour l'utilisateur ${userId}`);
      return snapshot.docs.length;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression des tâches:', error);
      throw error;
    }
  }
}

module.exports = new TaskModel();
