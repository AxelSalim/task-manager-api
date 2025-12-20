#!/bin/bash

# Script de démarrage pour Task Manager API
# Lance le backend (port 3000) et le frontend en parallèle

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction de nettoyage à l'arrêt
cleanup() {
    print_info "Arrêt des serveurs..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    print_success "Serveurs arrêtés proprement"
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT SIGTERM

# Infos port backend
BACKEND_PORT="3000"

# Vérifier que Node.js est installé
print_info "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js détecté: $NODE_VERSION"

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé."
    exit 1
fi

print_success "npm détecté: $(npm -v)"

# Vérifier et installer les dépendances du backend
print_info "Vérification des dépendances du backend..."
if [ ! -d "backend/node_modules" ]; then
    print_warning "Les dépendances du backend ne sont pas installées."
    print_info "Installation des dépendances du backend..."
    cd backend
    npm install
    cd ..
    print_success "Dépendances du backend installées"
else
    print_success "Dépendances du backend déjà installées"
fi

# Vérifier et installer les dépendances du frontend
print_info "Vérification des dépendances du frontend..."
if [ ! -d "frontend/node_modules" ]; then
    print_warning "Les dépendances du frontend ne sont pas installées."
    print_info "Installation des dépendances du frontend..."
    cd frontend
    npm install
    cd ..
    print_success "Dépendances du frontend installées"
else
    print_success "Dépendances du frontend déjà installées"
fi

# Créer le dossier data s'il n'existe pas
print_info "Vérification du dossier data..."
if [ ! -d "data" ]; then
    print_info "Création du dossier data..."
    mkdir -p data
    print_success "Dossier data créé"
else
    print_success "Dossier data existe déjà"
fi

# Vérifier si la base de données existe
DB_PATH="data/task-manager.db"
if [ ! -f "$DB_PATH" ]; then
    print_warning "La base de données n'existe pas encore."
    print_info "Exécution des migrations pour créer la base de données..."
    cd backend
    npm run migrate || {
        print_error "Erreur lors de l'exécution des migrations"
        cd ..
        exit 1
    }
    cd ..
    print_success "Base de données créée et migrations exécutées"
else
    print_success "Base de données trouvée: $DB_PATH"
    # Vérifier si des migrations sont en attente (optionnel)
    print_info "Vérification des migrations en attente..."
    cd backend
    npm run migrate 2>&1 | grep -q "No migrations were executed" && print_success "Toutes les migrations sont à jour" || print_info "Migrations appliquées"
    cd ..
fi

# Vérifier si un fichier .env existe dans le backend
if [ ! -f "backend/.env" ]; then
    print_warning "Le fichier backend/.env n'existe pas."
    print_info "Création d'un fichier .env par défaut..."
    cat > backend/.env << EOF
# Serveur
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Upload
UPLOAD_PATH=./uploads/images/users
MAX_FILE_SIZE=5242880
EOF
    print_success "Fichier .env créé avec des valeurs par défaut"
    print_warning "⚠️  N'oubliez pas de modifier backend/.env avec vos propres valeurs !"
fi

# Démarrer le backend (utilise toujours le port 3000)
print_info "Démarrage du backend (port 3000)..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Attendre un peu pour que le backend démarre
sleep 2

# Vérifier si le backend a démarré correctement
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "Le backend n'a pas démarré correctement. Vérifiez backend.log"
    exit 1
fi

print_success "Backend démarré (PID: $BACKEND_PID, port: $BACKEND_PORT)"
print_info "Logs du backend: tail -f backend.log"

# Démarrer le frontend
print_info "Démarrage du frontend..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Attendre un peu pour que le frontend démarre
sleep 3

# Vérifier si le frontend a démarré correctement
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_error "Le frontend n'a pas démarré correctement. Vérifiez frontend.log"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

print_success "Frontend démarré (PID: $FRONTEND_PID)"
print_info "Logs du frontend: tail -f frontend.log"

# Essayer de détecter le port du frontend depuis les logs
FRONTEND_PORT=$(grep -oE 'localhost:[0-9]+' frontend.log 2>/dev/null | head -1 | grep -oE '[0-9]+' || echo "")
if [ -z "$FRONTEND_PORT" ]; then
    # Par défaut, Next.js utilise 3000, mais si occupé, il utilise 3001, 3002, etc.
    FRONTEND_PORT="3000 (ou port suivant si occupé)"
fi

# Afficher les informations de connexion
echo ""
print_success "🚀 Application démarrée avec succès !"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📡 Backend:${NC}  http://localhost:$BACKEND_PORT"
echo -e "${GREEN}📚 API Docs:${NC} http://localhost:$BACKEND_PORT/api/docs"
echo -e "${GREEN}🌐 Frontend:${NC} http://localhost:${FRONTEND_PORT}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
print_info "Appuyez sur Ctrl+C pour arrêter les serveurs"
echo ""

# Attendre que les processus se terminent
wait $BACKEND_PID $FRONTEND_PID

