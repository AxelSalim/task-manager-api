const { User, Task } = require('../models');
const websocketService = require('../services/websocketService');

const TaskController = {

  // Récupérer toutes les tâches de l’utilisateur connecté
  async getTasks(req, res) {
    try {
      const tasks = await Task.findAll({
        where: { userId: req.user.id },
        include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
      });
      
      res.status(200).json({code: 200,data: tasks, message: 'Tâches récupérés avec succès'});
    } catch (error) {
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
  
      const task = await Task.create({
        title,
        status: status || "todo",
        userId: req.user.id, // récupéré du JWT
      });

      // Récupérer la tâche avec les informations utilisateur pour l'événement WebSocket
      const taskWithUser = await Task.findByPk(task.id, {
        include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }]
      });

      // Émettre l'événement WebSocket
      websocketService.taskCreated(req.user.id, taskWithUser);
  
      res.status(200).json({code: 200, data: task, message: 'Tâches créés avec succès'});
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la création", error: error.message });
    }
  },

  // Récupérer une tâche par son ID
  async getTaskById(req, res) {
    try {
      const task = await Task.findOne({
        where: { id: req.params.id, userId: req.user.id },
        include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
      });
  
      if (!task) {
        return res.status(404).json({ message: "Tâche introuvable" });
      }
  
      res.status(200).json({code: 200, data: task, message: 'Tâche récupéré avec succès'});
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération", error: error.message });
    }
  },

  // Mettre à jour une tâche
  async updateTask(req, res) {
    try {
      const { title, status } = req.body;
  
      const task = await Task.findOne({ 
        where: { id: req.params.id, userId: req.user.id },
        include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }]
      });
  
      if (!task) {
        return res.status(404).json({ message: "Tâche introuvable" });
      }
  
      task.title = title || task.title;
      task.status = status || task.status;
      await task.save();

      // Émettre l'événement WebSocket
      websocketService.taskUpdated(req.user.id, task);
  
      res.status(200).json({code: 200, data: task, message: 'Tâche modifié avec succès'});
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour", error: error.message });
    }
  },

  // Supprimer une tâche
  async deleteTask(req, res) {
    try {
      const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
  
      if (!task) {
        return res.status(404).json({ message: "Tâche introuvable" });
      }

      const taskId = task.id;
      await task.destroy();

      // Émettre l'événement WebSocket
      websocketService.taskDeleted(req.user.id, taskId);
      
      res.status(200).json({code: 200, message: 'Tâche supprimée avec succès'});
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
    }
  }
};

module.exports = TaskController;