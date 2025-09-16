# 📡 Documentation WebSocket - Task Manager API

## Vue d'ensemble

L'API Task Manager intègre **Socket.IO** pour fournir des mises à jour en temps réel. Les clients peuvent se connecter via WebSocket pour recevoir des notifications instantanées lors de la création, modification ou suppression de tâches.

## 🔌 Connexion WebSocket

### URL de connexion
```
ws://localhost:3000
```

### Authentification
L'authentification se fait via le token JWT dans la query string :

```javascript
// Exemple de connexion avec Socket.IO Client
const socket = io('http://localhost:3000', {
  query: {
    token: 'your_jwt_token_here'
  }
});

// Ou via les headers
const socket = io('http://localhost:3000', {
  extraHeaders: {
    'Authorization': 'Bearer your_jwt_token_here'
  }
});
```

## 📋 Événements WebSocket

### Événements reçus par le client

#### 1. `task_created`
Émis lorsqu'une nouvelle tâche est créée.

```javascript
socket.on('task_created', (data) => {
  console.log('Nouvelle tâche créée:', data);
  // data = {
  //   type: 'task_created',
  //   data: { id, title, status, userId, createdAt, updatedAt, user: {...} },
  //   timestamp: '2024-01-01T12:00:00.000Z',
  //   message: 'Nouvelle tâche créée'
  // }
});
```

#### 2. `task_updated`
Émis lorsqu'une tâche est mise à jour.

```javascript
socket.on('task_updated', (data) => {
  console.log('Tâche mise à jour:', data);
  // data = {
  //   type: 'task_updated',
  //   data: { id, title, status, userId, createdAt, updatedAt, user: {...} },
  //   timestamp: '2024-01-01T12:00:00.000Z',
  //   message: 'Tâche mise à jour'
  // }
});
```

#### 3. `task_deleted`
Émis lorsqu'une tâche est supprimée.

```javascript
socket.on('task_deleted', (data) => {
  console.log('Tâche supprimée:', data);
  // data = {
  //   type: 'task_deleted',
  //   data: { id: taskId },
  //   timestamp: '2024-01-01T12:00:00.000Z',
  //   message: 'Tâche supprimée'
  // }
});
```

#### 4. `notification`
Émis pour des notifications personnalisées.

```javascript
socket.on('notification', (data) => {
  console.log('Notification:', data);
  // data = {
  //   type: 'notification',
  //   data: { title, message, notificationType: 'info|success|warning|error' },
  //   timestamp: '2024-01-01T12:00:00.000Z'
  // }
});
```

#### 5. `user_connected`
Émis quand un utilisateur se connecte (diffusé à tous).

```javascript
socket.on('user_connected', (data) => {
  console.log('Utilisateur connecté:', data);
  // data = {
  //   type: 'user_connected',
  //   data: { userId, username },
  //   timestamp: '2024-01-01T12:00:00.000Z',
  //   message: 'username s\'est connecté'
  // }
});
```

#### 6. `user_disconnected`
Émis quand un utilisateur se déconnecte (diffusé à tous).

```javascript
socket.on('user_disconnected', (data) => {
  console.log('Utilisateur déconnecté:', data);
  // data = {
  //   type: 'user_disconnected',
  //   data: { userId, username },
  //   timestamp: '2024-01-01T12:00:00.000Z',
  //   message: 'username s\'est déconnecté'
  // }
});
```

### Événements émis par le client

#### 1. `join_room`
Rejoindre une room spécifique.

```javascript
socket.emit('join_room', 'room_name');
```

#### 2. `leave_room`
Quitter une room spécifique.

```javascript
socket.emit('leave_room', 'room_name');
```

## 🏠 Rooms WebSocket

### Room utilisateur
Chaque utilisateur est automatiquement ajouté à sa room personnelle : `user_{userId}`

### Rooms personnalisées
Les clients peuvent rejoindre des rooms personnalisées pour des fonctionnalités spécifiques.

## 💻 Exemple d'implémentation côté client

### HTML + JavaScript (Vanilla)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Task Manager - WebSocket</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
    <div id="notifications"></div>
    <div id="tasks"></div>

    <script>
        // Connexion WebSocket
        const socket = io('http://localhost:3000', {
            query: {
                token: localStorage.getItem('jwt_token') // Récupérer le token depuis le localStorage
            }
        });

        // Gestion des événements
        socket.on('connect', () => {
            console.log('✅ Connecté au serveur WebSocket');
        });

        socket.on('disconnect', () => {
            console.log('❌ Déconnecté du serveur WebSocket');
        });

        socket.on('task_created', (data) => {
            console.log('📝 Nouvelle tâche:', data.data);
            addNotification('Nouvelle tâche créée: ' + data.data.title);
            refreshTasks();
        });

        socket.on('task_updated', (data) => {
            console.log('✏️ Tâche mise à jour:', data.data);
            addNotification('Tâche mise à jour: ' + data.data.title);
            refreshTasks();
        });

        socket.on('task_deleted', (data) => {
            console.log('🗑️ Tâche supprimée:', data.data);
            addNotification('Tâche supprimée');
            refreshTasks();
        });

        socket.on('notification', (data) => {
            addNotification(data.data.title + ': ' + data.data.message);
        });

        // Fonctions utilitaires
        function addNotification(message) {
            const div = document.createElement('div');
            div.textContent = message;
            div.style.padding = '10px';
            div.style.margin = '5px';
            div.style.backgroundColor = '#f0f0f0';
            div.style.border = '1px solid #ccc';
            document.getElementById('notifications').appendChild(div);
        }

        function refreshTasks() {
            // Recharger la liste des tâches via l'API REST
            fetch('/api/tasks', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')
                }
            })
            .then(response => response.json())
            .then(data => {
                // Mettre à jour l'interface utilisateur
                console.log('Tâches mises à jour:', data);
            });
        }
    </script>
</body>
</html>
```

### React + Socket.IO
```jsx
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const TaskManager = () => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        // Connexion WebSocket
        const newSocket = io('http://localhost:3000', {
            query: {
                token: localStorage.getItem('jwt_token')
            }
        });

        setSocket(newSocket);

        // Gestion des événements
        newSocket.on('task_created', (data) => {
            setNotifications(prev => [...prev, {
                id: Date.now(),
                message: `Nouvelle tâche: ${data.data.title}`,
                type: 'success'
            }]);
            // Recharger les tâches
            fetchTasks();
        });

        newSocket.on('task_updated', (data) => {
            setNotifications(prev => [...prev, {
                id: Date.now(),
                message: `Tâche mise à jour: ${data.data.title}`,
                type: 'info'
            }]);
            fetchTasks();
        });

        newSocket.on('task_deleted', (data) => {
            setNotifications(prev => [...prev, {
                id: Date.now(),
                message: 'Tâche supprimée',
                type: 'warning'
            }]);
            fetchTasks();
        });

        return () => newSocket.close();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await fetch('/api/tasks', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                }
            });
            const data = await response.json();
            setTasks(data.data);
        } catch (error) {
            console.error('Erreur lors du chargement des tâches:', error);
        }
    };

    return (
        <div>
            <h1>Task Manager</h1>
            <div className="notifications">
                {notifications.map(notification => (
                    <div key={notification.id} className={`notification ${notification.type}`}>
                        {notification.message}
                    </div>
                ))}
            </div>
            <div className="tasks">
                {tasks.map(task => (
                    <div key={task.id} className="task">
                        <h3>{task.title}</h3>
                        <p>Status: {task.status}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskManager;
```

## 🔧 Configuration serveur

### Variables d'environnement
Aucune variable d'environnement supplémentaire n'est requise pour WebSocket. Le serveur utilise les mêmes paramètres que l'API REST.

### CORS
Le serveur WebSocket est configuré pour accepter les connexions depuis `http://localhost:3000`. Pour la production, modifiez la configuration CORS dans `server.js`.

## 🚨 Gestion des erreurs

### Erreurs d'authentification
```javascript
socket.on('connect_error', (error) => {
    if (error.message === 'Token d\'authentification manquant') {
        console.error('❌ Token JWT manquant');
        // Rediriger vers la page de connexion
    } else if (error.message === 'Token d\'authentification invalide') {
        console.error('❌ Token JWT invalide ou expiré');
        // Rafraîchir le token ou rediriger vers la page de connexion
    }
});
```

### Reconnexion automatique
Socket.IO gère automatiquement la reconnexion. Vous pouvez configurer les options de reconnexion :

```javascript
const socket = io('http://localhost:3000', {
    query: { token: 'your_jwt_token' },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    maxReconnectionAttempts: 5
});
```

## 📊 Monitoring

Le serveur affiche des logs pour chaque connexion/déconnexion et événement émis :

```
👤 Utilisateur connecté: john_doe (ID: 1)
📤 Événement 'task_created' envoyé à l'utilisateur 1
👋 Utilisateur déconnecté: john_doe (ID: 1)
```

## 🔒 Sécurité

- **Authentification obligatoire** : Toutes les connexions WebSocket nécessitent un token JWT valide
- **Isolation des données** : Les utilisateurs ne reçoivent que leurs propres événements
- **Validation des tokens** : Vérification de la validité et de l'expiration des tokens JWT
- **CORS configuré** : Restriction des origines autorisées

## 🎯 Cas d'usage

1. **Mise à jour en temps réel** : Les tâches se mettent à jour automatiquement dans l'interface
2. **Notifications push** : Alertes instantanées pour les actions importantes
3. **Collaboration** : Possibilité d'ajouter des fonctionnalités de collaboration en temps réel
4. **Synchronisation** : Synchronisation automatique entre plusieurs onglets/appareils
