const { Notification } = require('electron');

/**
 * Service de notifications système pour Electron
 */
class NotificationService {
  /**
   * Afficher une notification de rappel de tâche
   * @param {Object} task - La tâche à rappeler
   * @param {string} task.title - Le titre de la tâche
   * @param {string} task.description - La description de la tâche (optionnel)
   * @param {Date} task.reminderDate - La date de rappel
   */
  static showTaskReminder(task) {
    // Vérifier si les notifications sont supportées
    if (!Notification.isSupported()) {
      console.warn('Les notifications système ne sont pas supportées sur cette plateforme');
      return;
    }

    const notification = new Notification({
      title: `🔔 Rappel : ${task.title}`,
      body: task.description 
        ? `${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}`
        : 'Vous avez un rappel pour cette tâche',
      icon: null, // Vous pouvez ajouter une icône personnalisée ici
      urgency: 'normal',
      timeoutType: 'default',
    });

    notification.on('click', () => {
      // Optionnel : ouvrir la fenêtre de l'application ou la tâche
      console.log('Notification cliquée pour la tâche:', task.id);
    });

    notification.show();
  }

  /**
   * Afficher une notification générique
   * @param {string} title - Le titre de la notification
   * @param {string} body - Le corps de la notification
   * @param {Object} options - Options supplémentaires
   */
  static showNotification(title, body, options = {}) {
    if (!Notification.isSupported()) {
      console.warn('Les notifications système ne sont pas supportées sur cette plateforme');
      return;
    }

    const notification = new Notification({
      title,
      body,
      urgency: options.urgency || 'normal',
      timeoutType: options.timeoutType || 'default',
      ...options,
    });

    notification.show();
    return notification;
  }
}

module.exports = NotificationService;

