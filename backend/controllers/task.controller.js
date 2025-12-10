// Modèles Firestore
const { Task: TaskModel, User: UserModel } = require('../models/firebase');
// Modèles Sequelize (pour transition, à supprimer plus tard)
// const { User, Task } = require('../models');

const websocketService = require('../services/websocketService');
const FirebaseHelpers = require('../utils/firebaseHelpers');

const TaskController = {

  // Récupérer toutes les tâches de l'utilisateur connecté
  async getTasks(req, res) {
    try {
      // req.user.id contient maintenant l'UUID de l'utilisateur
      const tasks = await TaskModel.findByUserId(req.user.id);

      // Récupérer les infos utilisateur pour les ajouter à chaque tâche
      const user = await UserModel.findById(req.user.id);
      const userInfo = user ? {
        id: user.id,
        name: user.name,
        email: user.email
      } : null;

      // Formater les tâches et ajouter les infos utilisateur
      const formattedTasks = tasks.map(task => {
        const formatted = FirebaseHelpers.formatDocument(task);
        return {
          ...formatted,
          user: userInfo
        };
      });
      
      res.status(200).json({
        code: 200,
        data: formattedTasks,
        message: 'Tâches récupérées avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur getTasks:', error);
      res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
    }
  },

  // Créer une nouvelle tâche
  async createTask(req, res) {
    try {
      const { title, status } = req.body;
  
      if (!title) {
        return res.status(400).json({ message: "Le titre est obligatoire" });
      }
  
      // Créer la tâche avec Firestore (retourne l'UUID)
      const taskId = await TaskModel.create({
        title,
        status: status || "todo",
        userId: req.user.id, // UUID de l'utilisateur depuis le JWT
      });

      // Récupérer la tâche créée avec les informations utilisateur
      const task = await TaskModel.findById(taskId);
      const user = await UserModel.findById(req.user.id);
      
      const taskWithUser = {
        ...FirebaseHelpers.formatDocument(task),
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email
        } : null
      };

      // Émettre l'événement WebSocket
      websocketService.taskCreated(req.user.id, taskWithUser);
  
      res.status(200).json({
        code: 200,
        data: FirebaseHelpers.formatDocument(task),
        message: 'Tâche créée avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur createTask:', error);
      res.status(500).json({ message: "Erreur lors de la création", error: error.message });
    }
  },

  // Récupérer une tâche par son ID
  async getTaskById(req, res) {
    try {
      // req.params.id est maintenant un UUID
      const task = await TaskModel.findByIdAndUserId(req.params.id, req.user.id);
  
      if (!task) {
        return res.status(404).json({ message: "Tâche introuvable" });
      }

      // Récupérer les infos utilisateur
      const user = await UserModel.findById(req.user.id);
      const taskWithUser = {
        ...FirebaseHelpers.formatDocument(task),
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email
        } : null
      };
  
      res.status(200).json({
        code: 200,
        data: taskWithUser,
        message: 'Tâche récupérée avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur getTaskById:', error);
      res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
    }
  },

  // Mettre à jour une tâche
  async updateTask(req, res) {
    try {
      const { title, status } = req.body;
  
      // Vérifier que la tâche existe et appartient à l'utilisateur
      const task = await TaskModel.findByIdAndUserId(req.params.id, req.user.id);
  
      if (!task) {
        return res.status(404).json({ message: "Tâche introuvable" });
      }

      // Préparer les données à mettre à jour
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (status !== undefined) updateData.status = status;

      // Mettre à jour la tâche avec Firestore
      await TaskModel.update(req.params.id, updateData);

      // Récupérer la tâche mise à jour
      const updatedTask = await TaskModel.findById(req.params.id);
      
      // Récupérer les infos utilisateur
      const user = await UserModel.findById(req.user.id);
      const taskWithUser = {
        ...FirebaseHelpers.formatDocument(updatedTask),
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email
        } : null
      };

      // Émettre l'événement WebSocket
      websocketService.taskUpdated(req.user.id, taskWithUser);
  
      res.status(200).json({
        code: 200,
        data: FirebaseHelpers.formatDocument(updatedTask),
        message: 'Tâche modifiée avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur updateTask:', error);
      res.status(500).json({ message: "Erreur lors de la mise à jour", error: error.message });
    }
  },

  // Supprimer une tâche
  async deleteTask(req, res) {
    try {
      // Vérifier que la tâche existe et appartient à l'utilisateur
      const task = await TaskModel.findByIdAndUserId(req.params.id, req.user.id);
  
      if (!task) {
        return res.status(404).json({ message: "Tâche introuvable" });
      }

      // Sauvegarder l'UUID de la tâche pour l'événement WebSocket
      const taskId = task.id;
      
      // Supprimer la tâche avec Firestore
      await TaskModel.delete(taskId);

      // Émettre l'événement WebSocket
      websocketService.taskDeleted(req.user.id, taskId);
      
      res.status(200).json({
        code: 200,
        message: 'Tâche supprimée avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur deleteTask:', error);
      res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
    }
  }
};

module.exports = TaskController;