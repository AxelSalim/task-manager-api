const { Task } = require('../models');
const EventEmitter = require('events');

/**
 * EventEmitter global pour les événements de rappels
 * Permet à Electron d'écouter les rappels même quand l'app est en arrière-plan
 */
const reminderEmitter = new EventEmitter();

/**
 * Service de gestion des rappels de tâches
 */
class ReminderService {
  constructor() {
    this.checkInterval = null;
    this.intervalMs = 60000; // Vérifier toutes les minutes
    this.notifiedTasks = new Set(); // Pour éviter les doublons
  }

  /**
   * Démarrer le service de vérification des rappels
   */
  start() {
    if (this.checkInterval) {
      console.log('⚠️ Le service de rappels est déjà démarré');
      return;
    }

    console.log('✅ Service de rappels démarré');
    
    // Vérifier immédiatement
    this.checkReminders();

    // Puis vérifier périodiquement
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, this.intervalMs);
  }

  /**
   * Arrêter le service de vérification des rappels
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.notifiedTasks.clear();
      console.log('🛑 Service de rappels arrêté');
    }
  }

  /**
   * Vérifier les rappels à déclencher
   */
  async checkReminders() {
    try {
      const now = new Date();
      const oneMinuteFromNow = new Date(now.getTime() + 60000); // Dans la prochaine minute

      // Récupérer toutes les tâches avec un rappel dans la prochaine minute
      const tasksWithReminders = await Task.findAll({
        where: {
          reminderDate: {
            [require('sequelize').Op.between]: [now, oneMinuteFromNow]
          },
          status: {
            [require('sequelize').Op.ne]: 'done' // Ne pas notifier les tâches terminées
          }
        }
      });

      // Déclencher les notifications pour les tâches trouvées
      for (const task of tasksWithReminders) {
        const taskKey = `${task.id}-${task.reminderDate.getTime()}`;
        
        // Éviter les doublons
        if (!this.notifiedTasks.has(taskKey)) {
          this.notifiedTasks.add(taskKey);
          this.triggerReminder(task);
          
          // Nettoyer les anciennes entrées après 1 heure
          setTimeout(() => {
            this.notifiedTasks.delete(taskKey);
          }, 3600000);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des rappels:', error);
    }
  }

  /**
   * Déclencher un rappel pour une tâche
   * @param {Object} task - La tâche à rappeler
   */
  async triggerReminder(task) {
    console.log(`🔔 Rappel déclenché pour la tâche: ${task.title} (ID: ${task.id})`);
    
    const reminderData = {
      taskId: task.id,
      title: task.title,
      description: task.description,
      reminderDate: task.reminderDate,
      userId: task.userId
    };
    
    // 1. Envoyer une notification via WebSocket au frontend (pour l'utilisateur concerné)
    try {
      const websocketService = require('./websocketService');
      if (websocketService && websocketService.io) {
        // Envoyer à la room de l'utilisateur spécifique
        websocketService.io.to(`user_${task.userId}`).emit('task-reminder', reminderData);
        
        // Aussi émettre globalement pour Electron (si besoin)
        websocketService.io.emit('task-reminder', reminderData);
      }
    } catch (error) {
      // WebSocket non disponible, ce n'est pas grave
      console.log('WebSocket non disponible pour les notifications');
    }
    
    // 2. Émettre un événement via EventEmitter pour Electron
    reminderEmitter.emit('task-reminder', reminderData);
  }

  /**
   * Réinitialiser les notifications pour une tâche (utile après modification)
   * @param {number} taskId - L'ID de la tâche
   */
  resetTaskNotifications(taskId) {
    // Supprimer toutes les entrées liées à cette tâche
    const keysToDelete = [];
    for (const key of this.notifiedTasks) {
      if (key.startsWith(`${taskId}-`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.notifiedTasks.delete(key));
  }
}

// Instance singleton
const reminderService = new ReminderService();

// Exporter aussi l'EventEmitter pour que Electron puisse l'écouter
module.exports = reminderService;
module.exports.reminderEmitter = reminderEmitter;

