const app = require('./app')
const http = require('http')
const { Server } = require('socket.io')
const websocketAuth = require('./middlewares/websocketAuth')
const websocketService = require('./services/websocketService')

// Initialiser la base de données Sequelize
const db = require('./models');
db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Connexion à la base de données SQLite réussie');
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
  });

const PORT = process.env.PORT || 3000

// Créer le serveur HTTP
const server = http.createServer(app)

// Configurer Socket.IO
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:3001",
            "http://localhost:3000",
            "http://192.168.1.3:3000",
            "http://192.168.1.14:3000",
            "http://127.0.0.1:5500"
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }
})

// Middleware d'authentification WebSocket
io.use(websocketAuth)

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
    console.log(`👤 Utilisateur connecté: ${socket.username} (ID: ${socket.userId})`)

    // Rejoindre une room personnalisée pour l'utilisateur
    socket.join(`user_${socket.userId}`)

    // Événement de déconnexion
    socket.on('disconnect', () => {
        console.log(`👋 Utilisateur déconnecté: ${socket.username} (ID: ${socket.userId})`)
    })

    // Événement pour rejoindre une room spécifique (optionnel)
    socket.on('join_room', (room) => {
        socket.join(room)
        console.log(`📁 ${socket.username} a rejoint la room: ${room}`)
    })

    // Événement pour quitter une room (optionnel)
    socket.on('leave_room', (room) => {
        socket.leave(room)
        console.log(`🚪 ${socket.username} a quitté la room: ${room}`)
    })
})

// Rendre l'instance io disponible globalement
app.set('io', io)

// Initialiser le service WebSocket
websocketService.setIO(io)

// Démarrer le serveur
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📡 WebSocket server ready`)
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`)
})