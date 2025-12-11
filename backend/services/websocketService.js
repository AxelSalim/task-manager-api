/**
 * Service WebSocket pour gérer les événements en temps réel
 */
class WebSocketService {
  constructor() {
    this.io = null;
  }

  // Initialiser l'instance Socket.IO
  setIO(io) {
    this.io = io;
  }

  // Émettre un événement à un utilisateur spécifique
  emitToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
      console.log(`📤 Événement '${event}' envoyé à l'utilisateur ${userId}`);
    }
  }

  // Émettre un événement à tous les utilisateurs connectés
  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      console.log(`📢 Événement '${event}' diffusé à tous les utilisateurs`);
    }
  }

  // Émettre un événement à une room spécifique
  emitToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
      console.log(`📡 Événement '${event}' envoyé à la room '${room}'`);
    }
  }

  // Événements spécifiques aux tâches
  taskCreated(userId, task) {
    this.emitToUser(userId, 'task_created', {
      type: 'task_created',
      data: task,
      timestamp: new Date().toISOString(),
      message: 'Nouvelle tâche créée'
    });
  }

  taskUpdated(userId, task) {
    this.emitToUser(userId, 'task_updated', {
      type: 'task_updated',
      data: task,
      timestamp: new Date().toISOString(),
      message: 'Tâche mise à jour'
    });
  }

  taskDeleted(userId, taskId) {
    this.emitToUser(userId, 'task_deleted', {
      type: 'task_deleted',
      data: { id: taskId },
      timestamp: new Date().toISOString(),
      message: 'Tâche supprimée'
    });
  }

  // Événements spécifiques aux utilisateurs
  userConnected(userId, username) {
    this.emitToAll('user_connected', {
      type: 'user_connected',
      data: { userId, username },
      timestamp: new Date().toISOString(),
      message: `${username} s'est connecté`
    });
  }

  userDisconnected(userId, username) {
    this.emitToAll('user_disconnected', {
      type: 'user_disconnected',
      data: { userId, username },
      timestamp: new Date().toISOString(),
      message: `${username} s'est déconnecté`
    });
  }

  // Notification personnalisée
  sendNotification(userId, title, message, type = 'info') {
    this.emitToUser(userId, 'notification', {
      type: 'notification',
      data: { title, message, notificationType: type },
      timestamp: new Date().toISOString()
    });
  }
}

// Exporter une instance singleton
module.exports = new WebSocketService();
