const Task = require('../models/Task');
const User = require('../models/User');

const TaskController = {

  // Récupérer toutes les tâches de l’utilisateur connecté
  async getTasks(req, res) {
    try {
      const tasks = await Task.findAll({
        where: { userId: req.user.id },
        include: [{ model: User, as: "user", attributes: ["id", "username", "email"] }],
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
        include: [{ model: User, as: "user", attributes: ["id", "username", "email"] }],
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
  
      const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
  
      if (!task) {
        return res.status(404).json({ message: "Tâche introuvable" });
      }
  
      task.title = title || task.title;
      task.status = status || task.status;
      await task.save();
  
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
  
      await task.destroy();
      res.status(200).json({code: 200, message: 'Tâche supprimée avec succès'});
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression", error: error.message });
    }
  }
};

module.exports = TaskController;