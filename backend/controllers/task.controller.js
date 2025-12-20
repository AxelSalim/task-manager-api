// Modèles Sequelize
const { Task, User } = require('../models');

const websocketService = require('../services/websocketService');

const TaskController = {

  // Récupérer toutes les tâches de l'utilisateur connecté
  async getTasks(req, res) {
    try {
      const tasks = await Task.findAll({
        where: { userId: req.user.id },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }]
      });

      // Formater les tâches
      const formattedTasks = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        userId: task.userId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        user: task.user ? {
          id: task.user.id,
          name: task.user.name,
          email: task.user.email
        } : null
      }));
      
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
      const { title, description, status, priority, dueDate } = req.body;
  
      if (!title) {
        return res.status(400).json({ message: "Le titre est obligatoire" });
      }

      // Valider la priorité si fournie
      if (priority && !['low', 'normal', 'high', 'urgent'].includes(priority)) {
        return res.status(400).json({ 
          message: "La priorité doit être: low, normal, high ou urgent" 
        });
      }

      // Créer la tâche avec Sequelize
      const task = await Task.create({
        title,
        description: description || null,
        status: status || "todo",
        priority: priority || "normal",
        dueDate: dueDate || null,
        userId: req.user.id,
      });

      // Récupérer la tâche avec les informations utilisateur
      const taskWithUser = await Task.findByPk(task.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }]
      });

      const formattedTask = {
        id: taskWithUser.id,
        title: taskWithUser.title,
        description: taskWithUser.description,
        status: taskWithUser.status,
        priority: taskWithUser.priority,
        dueDate: taskWithUser.dueDate,
        userId: taskWithUser.userId,
        createdAt: taskWithUser.createdAt,
        updatedAt: taskWithUser.updatedAt,
        user: taskWithUser.user ? {
          id: taskWithUser.user.id,
          name: taskWithUser.user.name,
          email: taskWithUser.user.email
        } : null
      };

      // Émettre l'événement WebSocket
      websocketService.taskCreated(req.user.id, formattedTask);
  
      res.status(200).json({
        code: 200,
        data: formattedTask,
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
      const task = await Task.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }]
      });
  
      if (!task) {
        return res.status(404).json({ message: "Tâche introuvable" });
      }

      const formattedTask = {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        userId: task.userId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        user: task.user ? {
          id: task.user.id,
          name: task.user.name,
          email: task.user.email
        } : null
      };
  
      res.status(200).json({
        code: 200,
        data: formattedTask,
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
      const { title, description, status, priority, dueDate } = req.body;
  
      // Vérifier que la tâche existe et appartient à l'utilisateur
      const task = await Task.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });
  
      if (!task) {
        return res.status(404).json({ message: "Tâche introuvable" });
      }

      // Valider la priorité si fournie
      if (priority !== undefined && !['low', 'normal', 'high', 'urgent'].includes(priority)) {
        return res.status(400).json({ 
          message: "La priorité doit être: low, normal, high ou urgent" 
        });
      }

      // Préparer les données à mettre à jour
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate;

      // Mettre à jour la tâche
      await task.update(updateData);

      // Récupérer la tâche mise à jour avec les informations utilisateur
      const updatedTask = await Task.findByPk(task.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }]
      });

      const formattedTask = {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate,
        userId: updatedTask.userId,
        createdAt: updatedTask.createdAt,
        updatedAt: updatedTask.updatedAt,
        user: updatedTask.user ? {
          id: updatedTask.user.id,
          name: updatedTask.user.name,
          email: updatedTask.user.email
        } : null
      };

      // Émettre l'événement WebSocket
      websocketService.taskUpdated(req.user.id, formattedTask);
  
      res.status(200).json({
        code: 200,
        data: formattedTask,
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
      const task = await Task.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });
  
      if (!task) {
        return res.status(404).json({ message: "Tâche introuvable" });
      }

      // Sauvegarder l'ID de la tâche pour l'événement WebSocket
      const taskId = task.id;
      
      // Supprimer la tâche
      await task.destroy();

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
