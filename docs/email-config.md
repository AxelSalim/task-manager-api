# Configuration Email pour la réinitialisation de mot de passe

## Variables d'environnement requises

Ajoutez ces variables à votre fichier `.env` :

```env
# Configuration JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_RESET_SECRET=your_jwt_reset_secret_key_here

# Configuration Email
EMAIL_PROVIDER=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Configuration SMTP personnalisé (si EMAIL_PROVIDER=custom)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Configuration Gmail

1. Activez la validation en 2 étapes sur votre compte Google
2. Générez un mot de passe d'application :
   - Allez dans Paramètres Google > Sécurité
   - Sélectionnez "Mots de passe des applications"
   - Générez un mot de passe pour "Mail"
3. Utilisez ce mot de passe dans `EMAIL_PASS`

## Configuration Outlook/Hotmail

1. Utilisez `EMAIL_PROVIDER=outlook`
2. Utilisez votre email et mot de passe normal

## Configuration SMTP personnalisé

1. Utilisez `EMAIL_PROVIDER=custom`
2. Configurez les variables SMTP appropriées

## Test de la configuration

Le service email vérifie automatiquement la configuration au démarrage du serveur.
