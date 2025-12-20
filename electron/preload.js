const { contextBridge, ipcRenderer } = require('electron');

/**
 * Exposer des APIs sécurisées au processus de rendu
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Obtenir le port du serveur Express
   */
  getServerPort: () => ipcRenderer.invoke('get-server-port'),
  
  /**
   * Obtenir la version de l'application
   */
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  /**
   * Écouter l'événement de démarrage du serveur
   */
  onServerStarted: (callback) => {
    ipcRenderer.on('server-started', (event, data) => {
      callback(data);
    });
  },
  
  /**
   * Retirer les listeners
   */
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Log pour confirmer que le preload est chargé
console.log('✅ Preload script chargé');

