const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');

// Importer le backend Express
// Note: Les chemins sont relatifs depuis electron/main.js
const backendPath = path.join(__dirname, '..', 'backend');

// Ajouter le node_modules du backend au chemin de résolution des modules
// Cela permet à Electron de trouver les dépendances du backend
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;
const backendNodeModules = path.join(backendPath, 'node_modules');

Module._resolveFilename = function(request, parent, isMain, options) {
  // Si le module n'est pas trouvé, essayer depuis backend/node_modules
  try {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      // Essayer depuis backend/node_modules
      const modifiedParent = {
        ...parent,
        paths: [
          backendNodeModules,
          ...(parent?.paths || []),
          ...(Module._nodeModulePaths ? Module._nodeModulePaths(backendPath) : [])
        ]
      };
      try {
        return originalResolveFilename.call(this, request, modifiedParent, isMain, options);
      } catch (err2) {
        throw err;
      }
    }
    throw err;
  }
};

// Maintenant, importer socket.io (sera résolu depuis backend/node_modules si nécessaire)
const { Server } = require('socket.io');

// Utiliser les chemins absolus pour les imports
const expressApp = require(path.join(backendPath, 'app'));
const websocketAuth = require(path.join(backendPath, 'middlewares', 'websocketAuth'));
const websocketService = require(path.join(backendPath, 'services', 'websocketService'));

// Variables globales
let mainWindow = null;
let server = null;
let io = null;
let serverPort = null;

/**
 * Créer la fenêtre principale de l'application
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'), // Optionnel
    show: false // Ne pas afficher jusqu'à ce que la page soit chargée
  });

  // Charger l'application frontend (Next.js en développement ou build)
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // En développement, charger la page de test pour l'instant
    // Une fois le frontend Next.js prêt, on pourra charger depuis http://localhost:3001
    console.log('📄 Chargement de la page de test...');
    mainWindow.loadFile(path.join(__dirname, 'test.html'));
    // Ouvrir DevTools en développement
    mainWindow.webContents.openDevTools();
  } else {
    // En production, charger depuis le build Next.js
    mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'out', 'index.html'));
  }

  // Afficher la fenêtre une fois que la page est chargée
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus sur la fenêtre
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Gérer la fermeture de la fenêtre
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Gérer les erreurs de chargement
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Erreur de chargement:', errorCode, errorDescription);
    
    if (errorCode === -105) {
      // ERR_NAME_NOT_RESOLVED - Le serveur n'est pas encore démarré
      console.log('⏳ En attente du serveur...');
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.reload();
        }
      }, 2000);
    }
  });
}

/**
 * Démarrer le serveur Express et Socket.IO
 */
function startServer() {
  return new Promise((resolve, reject) => {
    // Trouver un port disponible
    serverPort = findAvailablePort(3000);
    
    // Créer le serveur HTTP
    server = http.createServer(expressApp);

    // Configurer Socket.IO
    io = new Server(server, {
      cors: {
        origin: '*', // En local, on peut autoriser toutes les origines
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }
    });

    // Middleware d'authentification WebSocket
    io.use(websocketAuth);

    // Gestion des connexions WebSocket
    io.on('connection', (socket) => {
      console.log(`👤 Utilisateur connecté: ${socket.username} (ID: ${socket.userId})`);

      socket.join(`user_${socket.userId}`);

      socket.on('disconnect', () => {
        console.log(`👋 Utilisateur déconnecté: ${socket.username} (ID: ${socket.userId})`);
      });

      socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`📁 ${socket.username} a rejoint la room: ${room}`);
      });

      socket.on('leave_room', (room) => {
        socket.leave(room);
        console.log(`🚪 ${socket.username} a quitté la room: ${room}`);
      });
    });

    // Rendre l'instance io disponible globalement
    expressApp.set('io', io);

    // Initialiser le service WebSocket
    websocketService.setIO(io);

    // Démarrer le serveur
    server.listen(serverPort, 'localhost', (error) => {
      if (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        reject(error);
        return;
      }

      console.log(`🚀 Serveur Express démarré sur http://localhost:${serverPort}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`📚 API Documentation: http://localhost:${serverPort}/api/docs`);
      
      // Envoyer le port au processus de rendu via IPC
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('server-started', { port: serverPort });
      }
      
      resolve(serverPort);
    });

    server.on('error', (error) => {
      console.error('❌ Erreur serveur:', error);
      reject(error);
    });
  });
}

/**
 * Trouver un port disponible
 */
function findAvailablePort(startPort) {
  return startPort; // Pour l'instant, on utilise le port de départ
  // TODO: Implémenter la détection de port disponible si nécessaire
}

/**
 * Arrêter proprement le serveur
 */
function stopServer() {
  return new Promise((resolve) => {
    if (io) {
      io.close(() => {
        console.log('📡 WebSocket server fermé');
      });
    }

    if (server) {
      server.close(() => {
        console.log('🚀 Serveur Express fermé');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Initialiser la base de données Sequelize au démarrage
const db = require(path.join(backendPath, 'models'));
db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Connexion à la base de données SQLite réussie');
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
  });

// Quand Electron est prêt
app.whenReady().then(async () => {
  try {
    // Démarrer le serveur
    await startServer();
    
    // Créer la fenêtre
    createWindow();

    app.on('activate', () => {
      // Sur macOS, recréer la fenêtre si elle n'existe pas
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    app.quit();
  }
});

// Quitter quand toutes les fenêtres sont fermées (sauf sur macOS)
app.on('window-all-closed', async () => {
  // Arrêter le serveur proprement
  await stopServer();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Gérer la fermeture de l'application
app.on('before-quit', async () => {
  await stopServer();
});

// IPC Handlers
ipcMain.handle('get-server-port', () => {
  return serverPort;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Gérer les erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
});

