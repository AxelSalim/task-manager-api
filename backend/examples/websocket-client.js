/**
 * Exemple de client WebSocket pour tester l'API Task Manager
 * 
 * Usage: node examples/websocket-client.js
 * 
 * Assurez-vous d'avoir un token JWT valide avant de lancer ce script
 */

const { io } = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Remplacez par votre token JWT

// Créer la connexion WebSocket
const socket = io(SERVER_URL, {
  query: {
    token: JWT_TOKEN
  }
});

console.log('🔌 Tentative de connexion au serveur WebSocket...');

// Gestion des événements de connexion
socket.on('connect', () => {
  console.log('✅ Connecté au serveur WebSocket');
  console.log('📡 Socket ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Déconnecté du serveur WebSocket:', reason);
});

socket.on('connect_error', (error) => {
  console.error('🚨 Erreur de connexion:', error.message);
  process.exit(1);
});

// Gestion des événements de tâches
socket.on('task_created', (data) => {
  console.log('📝 Nouvelle tâche créée:');
  console.log('   - ID:', data.data.id);
  console.log('   - Titre:', data.data.title);
  console.log('   - Statut:', data.data.status);
  console.log('   - Utilisateur:', data.data.user?.username);
  console.log('   - Timestamp:', data.timestamp);
  console.log('---');
});

socket.on('task_updated', (data) => {
  console.log('✏️ Tâche mise à jour:');
  console.log('   - ID:', data.data.id);
  console.log('   - Titre:', data.data.title);
  console.log('   - Statut:', data.data.status);
  console.log('   - Utilisateur:', data.data.user?.username);
  console.log('   - Timestamp:', data.timestamp);
  console.log('---');
});

socket.on('task_deleted', (data) => {
  console.log('🗑️ Tâche supprimée:');
  console.log('   - ID:', data.data.id);
  console.log('   - Timestamp:', data.timestamp);
  console.log('---');
});

// Gestion des notifications
socket.on('notification', (data) => {
  console.log('🔔 Notification:');
  console.log('   - Titre:', data.data.title);
  console.log('   - Message:', data.data.message);
  console.log('   - Type:', data.data.notificationType);
  console.log('---');
});

// Gestion des connexions utilisateurs
socket.on('user_connected', (data) => {
  console.log('👤 Utilisateur connecté:');
  console.log('   - ID:', data.data.userId);
  console.log('   - Nom:', data.data.username);
  console.log('---');
});

socket.on('user_disconnected', (data) => {
  console.log('👋 Utilisateur déconnecté:');
  console.log('   - ID:', data.data.userId);
  console.log('   - Nom:', data.data.username);
  console.log('---');
});

// Gestion des erreurs
socket.on('error', (error) => {
  console.error('🚨 Erreur WebSocket:', error);
});

// Fonction pour créer une tâche via l'API REST
async function createTask(title, status = 'todo') {
  try {
    const response = await fetch(`${SERVER_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      body: JSON.stringify({ title, status })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Tâche créée via API REST:', data.data.title);
    } else {
      console.error('❌ Erreur API REST:', data.message);
    }
  } catch (error) {
    console.error('❌ Erreur de connexion API:', error.message);
  }
}

// Fonction pour récupérer les tâches via l'API REST
async function getTasks() {
  try {
    const response = await fetch(`${SERVER_URL}/api/tasks`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('📋 Tâches récupérées via API REST:');
      data.data.forEach(task => {
        console.log(`   - ${task.title} (${task.status})`);
      });
    } else {
      console.error('❌ Erreur API REST:', data.message);
    }
  } catch (error) {
    console.error('❌ Erreur de connexion API:', error.message);
  }
}

// Gestion de l'arrêt du processus
process.on('SIGINT', () => {
  console.log('\n👋 Déconnexion...');
  socket.disconnect();
  process.exit(0);
});

// Instructions d'utilisation
console.log('\n📖 Instructions:');
console.log('1. Assurez-vous que le serveur est démarré (npm run dev)');
console.log('2. Remplacez YOUR_JWT_TOKEN_HERE par un token JWT valide');
console.log('3. Utilisez une autre instance pour créer/modifier des tâches');
console.log('4. Appuyez sur Ctrl+C pour quitter\n');

// Exemple d'utilisation après 3 secondes
setTimeout(() => {
  if (socket.connected) {
    console.log('🧪 Test: Récupération des tâches existantes...');
    getTasks();
  }
}, 3000);

// Exemple d'utilisation après 5 secondes
setTimeout(() => {
  if (socket.connected) {
    console.log('🧪 Test: Création d\'une tâche de test...');
    createTask('Tâche de test WebSocket', 'todo');
  }
}, 5000);
