const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
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
const reminderService = require(path.join(backendPath, 'services', 'reminderService'));

// Variables globales
let mainWindow = null;
let tray = null;
let server = null;
let io = null;
let serverPort = null;
let isQuitting = false; // Pour distinguer fermeture de fenêtre vs fermeture d'app

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
    // En développement, charger depuis le serveur Next.js (port 3001)
    const nextJsUrl = 'http://localhost:3001';
    console.log(`📄 Chargement du frontend Next.js depuis ${nextJsUrl}...`);
    
    // Essayer de charger depuis Next.js
    mainWindow.loadURL(nextJsUrl).catch((error) => {
      console.warn('⚠️  Serveur Next.js non disponible, chargement de la page de test');
      console.warn('   Pour démarrer le frontend: cd frontend && npm run dev');
      mainWindow.loadFile(path.join(__dirname, 'test.html'));
    });
    
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

  // Gérer la fermeture de la fenêtre (minimiser dans le tray au lieu de fermer)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      // Afficher une notification (optionnel)
      if (process.platform === 'darwin') {
        // Sur macOS, l'app reste dans le dock
      } else {
        // Sur Windows/Linux, informer l'utilisateur
        if (tray) {
          tray.displayBalloon({
            title: 'SPARK Task Manager',
            content: 'L\'application continue de fonctionner en arrière-plan. Cliquez sur l\'icône pour rouvrir.',
            icon: null
          });
        }
      }
    }
  });

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

    // Écouter les événements de rappels depuis le service de rappels
    setupReminderNotifications();

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
 * Créer une icône simple pour le tray
 * Utilise une image PNG encodée en base64
 */
function createTrayIcon() {
  // Image PNG 32x32 avec un fond bleu (#3b82f6) et un "S" blanc
  // Format: PNG 32x32, fond bleu, lettre S blanche centrée
  // On crée une icône simple avec des données base64 d'une petite image PNG
  const size = 32;
  
  // Données d'une image PNG simple (32x32) avec fond bleu et "S" blanc
  // Note: Cette approche utilise une icône générée programmatiquement
  // Pour une meilleure qualité, vous pouvez créer un fichier icon.png dans assets/
  
  // Essayer d'utiliser le logo SPARK existant
  const logoPath = path.join(__dirname, '..', 'frontend', 'public', 'logo_SPARK.png');
  try {
    const logoIcon = nativeImage.createFromPath(logoPath);
    if (!logoIcon.isEmpty()) {
      return logoIcon.resize({ width: size, height: size });
    }
  } catch (error) {
    // Logo non trouvé, continuer avec l'icône par défaut
  }
  
  // Créer une icône simple avec un template (fond coloré)
  // On utilise une approche avec un canvas virtuel ou une image simple
  // Pour l'instant, on crée une icône vide avec une couleur de fond
  const emptyIcon = nativeImage.createEmpty();
  
  // Alternative: Créer un fichier temporaire avec une icône simple
  // Mais pour simplifier, on va utiliser le logo ou créer une icône basique
  return emptyIcon;
}

/**
 * Créer l'icône du tray (barre système)
 */
function createTray() {
  let trayIcon;
  
  try {
    // Essayer de charger l'icône depuis le fichier
    const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
    trayIcon = nativeImage.createFromPath(iconPath);
    
    if (trayIcon.isEmpty()) {
      // Si l'icône n'existe pas, créer une icône simple programmatiquement
      trayIcon = createTrayIcon();
    }
  } catch (error) {
    // Si l'icône n'existe pas, créer une icône simple programmatiquement
    trayIcon = createTrayIcon();
  }
  
  // S'assurer que l'icône a la bonne taille pour le tray
  // Sur Windows, le tray utilise généralement 16x16 ou 32x32
  const traySize = process.platform === 'win32' ? 16 : 22;
  trayIcon = trayIcon.resize({ width: traySize, height: traySize });

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Ouvrir SPARK',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Quitter',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('SPARK Task Manager');
  tray.setContextMenu(contextMenu);

  // Double-clic pour ouvrir/fermer
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      createWindow();
    }
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
 * Configurer les notifications de rappels
 */
function setupReminderNotifications() {
  // Écouter les événements de rappels depuis l'EventEmitter du service
  if (reminderService && reminderService.reminderEmitter) {
    reminderService.reminderEmitter.on('task-reminder', (reminderData) => {
      console.log('🔔 Notification de rappel reçue:', reminderData);
      showReminderNotification(reminderData);
    });
    console.log('✅ Écoute des rappels configurée');
  } else {
    console.warn('⚠️ Service de rappels non disponible');
  }
}

/**
 * Afficher une notification de rappel
 */
function showReminderNotification(task) {
  const NotificationService = require('./utils/notifications');
  NotificationService.showTaskReminder(task);
  
  // Si la fenêtre est minimisée, afficher une notification du tray
  if (tray && mainWindow && !mainWindow.isVisible()) {
    try {
      tray.displayBalloon({
        title: `🔔 Rappel : ${task.title}`,
        content: task.description 
          ? `${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}`
          : 'Vous avez un rappel pour cette tâche',
        icon: null
      });
    } catch (error) {
      // displayBalloon n'est disponible que sur Windows
      console.log('displayBalloon non disponible sur cette plateforme');
    }
  }
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
    
    // Créer le tray (icône dans la barre système)
    createTray();
    
    // Créer la fenêtre
    createWindow();

    app.on('activate', () => {
      // Sur macOS, recréer la fenêtre si elle n'existe pas
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    app.quit();
  }
});

// Ne pas quitter quand toutes les fenêtres sont fermées
// L'application reste active en arrière-plan grâce au tray
app.on('window-all-closed', () => {
  // Ne rien faire - l'app reste active dans le tray
  // L'utilisateur peut quitter via le menu du tray ou Cmd+Q (macOS)
});

// Gérer la fermeture de l'application
app.on('before-quit', async () => {
  isQuitting = true;
  await stopServer();
  
  // Détruire le tray
  if (tray) {
    tray.destroy();
    tray = null;
  }
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

