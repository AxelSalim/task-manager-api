const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification pour WebSocket
 * Vérifie le token JWT dans la query string ou les headers
 */
const websocketAuth = (socket, next) => {
  try {
    // Récupérer le token depuis la query string ou les headers
    const token = socket.handshake.query.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Token d\'authentification manquant'));
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ajouter les informations utilisateur au socket
    socket.userId = decoded.id;
    socket.userEmail = decoded.email;
    socket.username = decoded.username;
    
    next();
  } catch (error) {
    next(new Error('Token d\'authentification invalide'));
  }
};

module.exports = websocketAuth;
