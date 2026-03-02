/**
 * Script pour réinitialiser le mot de passe d'un utilisateur (sans email).
 * Usage: node scripts/reset-password.js <email> <nouveau_mot_de_passe>
 * Exemple: node scripts/reset-password.js user@example.com MonNouveauMotDePasse123
 */
require('dotenv').config();
const { User } = require('../models');
const bcrypt = require('bcrypt');

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: node scripts/reset-password.js <email> <nouveau_mot_de_passe>');
    console.error('Exemple: node scripts/reset-password.js user@example.com MonNouveauMotDePasse123');
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error('Le mot de passe doit contenir au moins 6 caractères.');
    process.exit(1);
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error(`Aucun utilisateur trouvé avec l'email: ${email}`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    console.log(`Mot de passe réinitialisé pour ${email}. Vous pouvez vous connecter avec le nouveau mot de passe.`);
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

resetPassword();
