// Modèles Sequelize
const { Task, User, Tag } = require('../models');

const websocketService = require('../services/websocketService');
const { sendSuccess, sendError, HTTP_ERRORS } = require('../utils/responseHandler');

const TaskController = {

  // Récupérer toutes les tâches de l'utilisateur connecté
  async getTasks(req, res) {
    try {
      const tasks = await Task.findAll({
        where: { userId: req.user.id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] } // Ne pas inclure les attributs de la table de liaison
          }
        ]
      });

      // Formater les tâches
      const formattedTasks = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        reminderDate: task.reminderDate,
        repeatPattern: task.repeatPattern,
        subtasks: task.subtasks || [],
        estimatedMinutes: task.estimatedMinutes ?? null,
        spentMinutes: task.spentMinutes ?? 0,
        tags: task.tags ? task.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color
        })) : [],
        userId: task.userId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        user: task.user ? {
          id: task.user.id,
          name: task.user.name,
          email: task.user.email
        } : null
      }));
      
      return sendSuccess(res, 200, formattedTasks, 'Tâches récupérées avec succès');
    } catch (error) {
      console.error('❌ Erreur getTasks:', error);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la récupération des tâches');
    }
  },

  // Créer une nouvelle tâche
  async createTask(req, res) {
    try {
      const { title, description, status, priority, dueDate, reminderDate, repeatPattern, subtasks, estimatedMinutes } = req.body;
  
      if (!title) {
        return HTTP_ERRORS.BAD_REQUEST(res, "Le titre est obligatoire");
      }

      // Valider la priorité si fournie
      if (priority && !['low', 'normal', 'high', 'urgent'].includes(priority)) {
        return HTTP_ERRORS.BAD_REQUEST(res, "La priorité doit être: low, normal, high ou urgent");
      }

      // Valider les sous-tâches si fournies
      let validatedSubtasks = [];
      if (subtasks && Array.isArray(subtasks)) {
        validatedSubtasks = subtasks.map((st, index) => ({
          id: st.id || `subtask-${Date.now()}-${index}`,
          title: st.title || '',
          completed: st.completed || false
        }));
      }

      // Valider le pattern de répétition si fourni
      let validatedRepeatPattern = null;
      if (repeatPattern) {
        if (typeof repeatPattern === 'string') {
          try {
            validatedRepeatPattern = JSON.parse(repeatPattern);
          } catch (e) {
            return HTTP_ERRORS.BAD_REQUEST(res, "Format de pattern de répétition invalide");
          }
        } else if (typeof repeatPattern === 'object') {
          validatedRepeatPattern = repeatPattern;
        }
        
        // Valider le type de répétition
        if (validatedRepeatPattern && !['daily', 'weekly', 'monthly', 'yearly', 'custom'].includes(validatedRepeatPattern.type)) {
          return HTTP_ERRORS.BAD_REQUEST(res, "Type de répétition invalide. Types acceptés: daily, weekly, monthly, yearly, custom");
        }
      }

      // Valider estimatedMinutes si fourni (entier positif)
      const validatedEstimatedMinutes =
        estimatedMinutes != null
          ? Math.max(0, parseInt(estimatedMinutes, 10) || 0) || null
          : null;

      // Créer la tâche avec Sequelize
      const task = await Task.create({
        title,
        description: description || null,
        status: status || "todo",
        priority: priority || "normal",
        dueDate: dueDate || null,
        reminderDate: reminderDate || null,
        repeatPattern: validatedRepeatPattern,
        subtasks: validatedSubtasks,
        estimatedMinutes: validatedEstimatedMinutes,
        spentMinutes: 0,
        userId: req.user.id,
      });

      // Gérer les tags si fournis
      if (req.body.tagIds && Array.isArray(req.body.tagIds) && req.body.tagIds.length > 0) {
        // Vérifier que tous les tags appartiennent à l'utilisateur
        const tags = await Tag.findAll({
          where: {
            id: req.body.tagIds,
            userId: req.user.id
          }
        });
        
        if (tags.length === req.body.tagIds.length) {
          await task.setTags(tags);
        }
      }

      // Récupérer la tâche avec les informations utilisateur et tags
      const taskWithUser = await Task.findByPk(task.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] }
          }
        ]
      });

      const formattedTask = {
        id: taskWithUser.id,
        title: taskWithUser.title,
        description: taskWithUser.description,
        status: taskWithUser.status,
        priority: taskWithUser.priority,
        dueDate: taskWithUser.dueDate,
        reminderDate: taskWithUser.reminderDate,
        repeatPattern: taskWithUser.repeatPattern,
        subtasks: taskWithUser.subtasks || [],
        estimatedMinutes: taskWithUser.estimatedMinutes ?? null,
        spentMinutes: taskWithUser.spentMinutes ?? 0,
        tags: taskWithUser.tags ? taskWithUser.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color
        })) : [],
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
  
      return sendSuccess(res, 201, formattedTask, 'Tâche créée avec succès');
    } catch (error) {
      console.error('❌ Erreur createTask:', error);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la création de la tâche');
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
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] }
          }
        ]
      });
  
      if (!task) {
        return HTTP_ERRORS.NOT_FOUND(res, "Tâche introuvable");
      }

      const formattedTask = {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        reminderDate: task.reminderDate,
        repeatPattern: task.repeatPattern,
        subtasks: task.subtasks || [],
        estimatedMinutes: task.estimatedMinutes ?? null,
        spentMinutes: task.spentMinutes ?? 0,
        tags: task.tags ? task.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color
        })) : [],
        userId: task.userId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        user: task.user ? {
          id: task.user.id,
          name: task.user.name,
          email: task.user.email
        } : null
      };
  
      return sendSuccess(res, 200, formattedTask, 'Tâche récupérée avec succès');
    } catch (error) {
      console.error('❌ Erreur getTaskById:', error);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la récupération de la tâche');
    }
  },

  // Mettre à jour une tâche
  async updateTask(req, res) {
    try {
      const { title, description, status, priority, dueDate, reminderDate, repeatPattern, subtasks, estimatedMinutes, spentMinutes } = req.body;
  
      // Vérifier que la tâche existe et appartient à l'utilisateur
      const task = await Task.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });
  
      if (!task) {
        return HTTP_ERRORS.NOT_FOUND(res, "Tâche introuvable");
      }

      // Valider la priorité si fournie
      if (priority !== undefined && !['low', 'normal', 'high', 'urgent'].includes(priority)) {
        return HTTP_ERRORS.BAD_REQUEST(res, "La priorité doit être: low, normal, high ou urgent");
      }

      // Préparer les données à mettre à jour
      const updateData = {};
      
      // Valider le pattern de répétition si fourni
      if (repeatPattern !== undefined) {
        if (repeatPattern === null || repeatPattern === '') {
          updateData.repeatPattern = null;
        } else {
          let validatedRepeatPattern = null;
          if (typeof repeatPattern === 'string') {
            try {
              validatedRepeatPattern = JSON.parse(repeatPattern);
            } catch (e) {
              return HTTP_ERRORS.BAD_REQUEST(res, "Format de pattern de répétition invalide");
            }
          } else if (typeof repeatPattern === 'object') {
            validatedRepeatPattern = repeatPattern;
          }
          
          // Valider le type de répétition
          if (validatedRepeatPattern && !['daily', 'weekly', 'monthly', 'yearly', 'custom'].includes(validatedRepeatPattern.type)) {
            return HTTP_ERRORS.BAD_REQUEST(res, "Type de répétition invalide. Types acceptés: daily, weekly, monthly, yearly, custom");
          }
          
          updateData.repeatPattern = validatedRepeatPattern;
        }
      }
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (reminderDate !== undefined) updateData.reminderDate = reminderDate;
      if (subtasks !== undefined) {
        // Valider les sous-tâches si fournies
        if (Array.isArray(subtasks)) {
          updateData.subtasks = subtasks.map((st, index) => ({
            id: st.id || `subtask-${Date.now()}-${index}`,
            title: st.title || '',
            completed: st.completed || false
          }));
        }
      }
      if (estimatedMinutes !== undefined) {
        updateData.estimatedMinutes =
          estimatedMinutes == null || estimatedMinutes === ''
            ? null
            : Math.max(0, parseInt(estimatedMinutes, 10) || 0);
      }
      if (spentMinutes !== undefined) {
        const val = parseInt(spentMinutes, 10);
        if (!Number.isNaN(val) && val >= 0) {
          updateData.spentMinutes = val;
        }
      }

      // Mettre à jour la tâche
      await task.update(updateData);

      // Gérer les tags si fournis
      if (req.body.tagIds !== undefined) {
        if (Array.isArray(req.body.tagIds) && req.body.tagIds.length > 0) {
          // Vérifier que tous les tags appartiennent à l'utilisateur
          const tags = await Tag.findAll({
            where: {
              id: req.body.tagIds,
              userId: req.user.id
            }
          });
          
          if (tags.length === req.body.tagIds.length) {
            await task.setTags(tags);
          }
        } else {
          // Si tagIds est un tableau vide, supprimer tous les tags
          await task.setTags([]);
        }
      }

      // Récupérer la tâche mise à jour avec les informations utilisateur et tags
      const updatedTask = await Task.findByPk(task.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] }
          }
        ]
      });

      const formattedTask = {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate,
        reminderDate: updatedTask.reminderDate,
        repeatPattern: updatedTask.repeatPattern,
        subtasks: updatedTask.subtasks || [],
        estimatedMinutes: updatedTask.estimatedMinutes ?? null,
        spentMinutes: updatedTask.spentMinutes ?? 0,
        tags: updatedTask.tags ? updatedTask.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color
        })) : [],
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
  
      return sendSuccess(res, 200, formattedTask, 'Tâche modifiée avec succès');
    } catch (error) {
      console.error('❌ Erreur updateTask:', error);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la mise à jour de la tâche');
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
        return HTTP_ERRORS.NOT_FOUND(res, "Tâche introuvable");
      }

      // Sauvegarder l'ID de la tâche pour l'événement WebSocket
      const taskId = task.id;
      
      // Supprimer la tâche
      await task.destroy();

      // Émettre l'événement WebSocket
      websocketService.taskDeleted(req.user.id, taskId);
      
      return sendSuccess(res, 200, null, 'Tâche supprimée avec succès');
    } catch (error) {
      console.error('❌ Erreur deleteTask:', error);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la suppression de la tâche');
    }
  },

  // Mettre à jour les sous-tâches d'une tâche
  async updateSubtasks(req, res) {
    try {
      const { subtasks } = req.body;
  
      // Vérifier que la tâche existe et appartient à l'utilisateur
      const task = await Task.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });
  
      if (!task) {
        return HTTP_ERRORS.NOT_FOUND(res, "Tâche introuvable");
      }

      // Valider les sous-tâches si fournies
      let validatedSubtasks = [];
      if (subtasks !== undefined) {
        if (Array.isArray(subtasks)) {
          validatedSubtasks = subtasks.map((st, index) => ({
            id: st.id || `subtask-${Date.now()}-${index}`,
            title: st.title || '',
            completed: st.completed || false
          }));
        }
      }

      // Mettre à jour uniquement les sous-tâches
      await task.update({ subtasks: validatedSubtasks });

      // Récupérer la tâche mise à jour avec les informations utilisateur et tags
      const updatedTask = await Task.findByPk(task.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] }
          }
        ]
      });

      const formattedTask = {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate,
        reminderDate: updatedTask.reminderDate,
        repeatPattern: updatedTask.repeatPattern,
        subtasks: updatedTask.subtasks || [],
        estimatedMinutes: updatedTask.estimatedMinutes ?? null,
        spentMinutes: updatedTask.spentMinutes ?? 0,
        tags: updatedTask.tags ? updatedTask.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          color: tag.color
        })) : [],
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
  
      return sendSuccess(res, 200, formattedTask, 'Sous-tâches mises à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur updateSubtasks:', error);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la mise à jour des sous-tâches');
    }
  }
};

module.exports = TaskController;
