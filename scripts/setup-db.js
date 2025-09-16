/**
 * Script pour configurer la base de données
 * Usage: node scripts/setup-db.js
 */

const { execSync } = require('child_process');

console.log('🗄️ Configuration de la base de données...\n');

try {
  // 1. Exécuter les migrations
  console.log('📋 Exécution des migrations...');
  execSync('npx sequelize db:migrate', { stdio: 'inherit' });
  
  console.log('\n✅ Base de données configurée avec succès !');
  console.log('📝 Tables créées :');
  console.log('   - Users (id, name, email, password, avatar, createdAt, updatedAt)');
  console.log('   - Tasks (id, title, status, userId, createdAt, updatedAt)');
  console.log('\n🚀 Vous pouvez maintenant démarrer le serveur avec : npm run dev');
  
} catch (error) {
  console.error('❌ Erreur lors de la configuration de la base de données :');
  console.error(error.message);
  console.log('\n💡 Assurez-vous que :');
  console.log('   1. MySQL est démarré');
  console.log('   2. La base de données "task_manager" existe');
  console.log('   3. Les paramètres de connexion sont corrects dans config/database.js');
}
