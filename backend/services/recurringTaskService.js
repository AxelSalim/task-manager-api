const { Task } = require('../models');

/**
 * Service de génération automatique de tâches récurrentes
 */
class RecurringTaskService {
  constructor() {
    this.checkInterval = null;
    this.intervalMs = 3600000; // Vérifier toutes les heures
  }

  /**
   * Démarrer le service de génération de tâches récurrentes
   */
  start() {
    if (this.checkInterval) {
      console.log('⚠️ Le service de tâches récurrentes est déjà démarré');
      return;
    }

    console.log('✅ Service de tâches récurrentes démarré');
    
    // Vérifier immédiatement
    this.generateRecurringTasks();

    // Puis vérifier périodiquement
    this.checkInterval = setInterval(() => {
      this.generateRecurringTasks();
    }, this.intervalMs);
  }

  /**
   * Arrêter le service
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Service de tâches récurrentes arrêté');
    }
  }

  /**
   * Générer les tâches récurrentes qui doivent être créées
   */
  async generateRecurringTasks() {
    try {
      const now = new Date();
      
      // Récupérer toutes les tâches avec un pattern de répétition
      const { Tag } = require('../models');
      const recurringTasks = await Task.findAll({
        where: {
          repeatPattern: {
            [require('sequelize').Op.ne]: null
          }
        },
        include: [
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] }
          }
        ]
      });

      for (const task of recurringTasks) {
        if (!task.repeatPattern) continue;

        const pattern = task.repeatPattern;
        const lastDueDate = task.dueDate ? new Date(task.dueDate) : null;
        
        // Si la date d'échéance est passée ou aujourd'hui, générer la prochaine instance
        if (!lastDueDate) {
          const startDate = new Date(task.createdAt);
          const nextDueDate = this.calculateNextDate(startDate, pattern, now);
          
          if (nextDueDate && this.shouldGenerateTask(task, nextDueDate, pattern)) {
            await this.createRecurringTaskInstance(task, nextDueDate);
          }
        } else {
          // Vérifier si la date d'échéance est passée (ou aujourd'hui)
          const dueDatePassed = lastDueDate <= now;
          
          if (dueDatePassed) {
            // La date d'échéance est passée, calculer la prochaine date
            const nextDueDate = this.calculateNextDate(lastDueDate, pattern, now);
            
            if (nextDueDate && this.shouldGenerateTask(task, nextDueDate, pattern)) {
              await this.createRecurringTaskInstance(task, nextDueDate);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération des tâches récurrentes:', error);
    }
  }

  /**
   * Calculer la prochaine date d'échéance basée sur le pattern
   */
  calculateNextDate(startDate, pattern, now) {
    if (!pattern || !pattern.type) return null;

    const start = new Date(startDate);
    const interval = pattern.interval || 1;
    let nextDate = new Date(start);

    // Si la date de départ est dans le futur, retourner null (pas besoin de générer)
    if (start > now) {
      return null;
    }

    switch (pattern.type) {
      case 'daily':
        // Calculer la prochaine date en ajoutant l'intervalle
        // On part de la date de départ et on ajoute l'intervalle jusqu'à dépasser "now"
        nextDate.setDate(nextDate.getDate() + interval);
        // Si c'est encore dans le passé, continuer à ajouter
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + interval);
        }
        break;

      case 'weekly':
        // Calculer la prochaine date en ajoutant l'intervalle
        nextDate.setDate(nextDate.getDate() + (7 * interval));
        // Si c'est encore dans le passé, continuer à ajouter
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + (7 * interval));
        }
        // Si des jours spécifiques sont définis, ajuster
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          nextDate = this.findNextDayOfWeek(nextDate, pattern.daysOfWeek);
        }
        break;

      case 'monthly':
        // Calculer la prochaine date en ajoutant l'intervalle
        nextDate.setMonth(nextDate.getMonth() + interval);
        // Si c'est encore dans le passé, continuer à ajouter
        while (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + interval);
        }
        break;

      case 'yearly':
        // Calculer la prochaine date en ajoutant l'intervalle
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        // Si c'est encore dans le passé, continuer à ajouter
        while (nextDate <= now) {
          nextDate.setFullYear(nextDate.getFullYear() + interval);
        }
        break;

      default:
        return null;
    }

    // Vérifier la date de fin
    if (pattern.endDate) {
      const endDate = new Date(pattern.endDate);
      if (nextDate > endDate) {
        return null; // La répétition est terminée
      }
    }

    return nextDate;
  }

  /**
   * Trouver le prochain jour de la semaine dans la liste
   */
  findNextDayOfWeek(startDate, daysOfWeek) {
    let current = new Date(startDate);
    const maxAttempts = 14; // Maximum 2 semaines
    
    for (let i = 0; i < maxAttempts; i++) {
      const dayOfWeek = current.getDay();
      if (daysOfWeek.includes(dayOfWeek)) {
        return current;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return current; // Fallback
  }

  /**
   * Vérifier si une tâche doit être générée
   */
  shouldGenerateTask(task, nextDueDate, pattern) {
    // Vérifier si une tâche avec cette date existe déjà
    // (pour éviter les doublons)
    // Cette vérification sera faite dans createRecurringTaskInstance
    
    // Vérifier le nombre d'occurrences
    if (pattern.count) {
      // TODO: Compter les occurrences existantes
      // Pour l'instant, on génère toujours
    }

    return true;
  }

  /**
   * Créer une instance de tâche récurrente
   */
  async createRecurringTaskInstance(originalTask, dueDate) {
    try {
      // Vérifier si une tâche similaire existe déjà pour cette date
      const existingTask = await Task.findOne({
        where: {
          userId: originalTask.userId,
          title: originalTask.title,
          dueDate: dueDate,
        }
      });

      if (existingTask) {
        // Une tâche existe déjà pour cette date, ne pas créer de doublon
        return;
      }

      // Créer la nouvelle instance
      const newTask = await Task.create({
        title: originalTask.title,
        description: originalTask.description,
        status: 'todo', // Toujours créer en statut "todo"
        priority: originalTask.priority,
        dueDate: dueDate,
        reminderDate: this.calculateReminderDate(dueDate, originalTask.reminderDate, originalTask.dueDate),
        repeatPattern: originalTask.repeatPattern, // Conserver le pattern
        subtasks: originalTask.subtasks,
        userId: originalTask.userId,
      });

      // Copier les tags si la relation existe
      if (originalTask.tags && originalTask.tags.length > 0) {
        await newTask.setTags(originalTask.tags);
      }

      console.log(`✅ Tâche récurrente créée: ${newTask.title} (${dueDate.toISOString()})`);
      
      return newTask;
    } catch (error) {
      console.error(`❌ Erreur lors de la création de la tâche récurrente:`, error);
    }
  }

  /**
   * Calculer la date de rappel pour la nouvelle instance
   */
  calculateReminderDate(dueDate, originalReminderDate) {
    if (!originalReminderDate) return null;

    const due = new Date(dueDate);
    const originalDue = originalTask.dueDate ? new Date(originalTask.dueDate) : null;
    const originalReminder = new Date(originalReminderDate);

    if (!originalDue) return originalReminderDate;

    // Calculer la différence entre la date d'échéance originale et le rappel
    const diffMs = originalReminder.getTime() - originalDue.getTime();
    
    // Appliquer la même différence à la nouvelle date d'échéance
    const newReminder = new Date(due.getTime() + diffMs);
    
    return newReminder;
  }
}

// Instance singleton
const recurringTaskService = new RecurringTaskService();

module.exports = recurringTaskService;

