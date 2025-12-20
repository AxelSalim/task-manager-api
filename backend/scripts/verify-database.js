require('dotenv').config();
const path = require('path');
const { Sequelize } = require('sequelize');

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbPath = path.join(dataDir, 'task-manager.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

async function verifyDatabase() {
  try {
    console.log('🔄 Vérification de la base de données SQLite...');
    console.log(`📁 Chemin: ${dbPath}\n`);
    
    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion réussie\n');
    
    // Lister toutes les tables
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    console.log('📊 Tables trouvées:');
    tables.forEach(table => {
      console.log(`   - ${table.name}`);
    });
    
    console.log(`\n✅ Total: ${tables.length} table(s)\n`);
    
    // Vérifier la structure de chaque table
    for (const table of tables) {
      const [columns] = await sequelize.query(`PRAGMA table_info(${table.name})`);
      console.log(`📋 Structure de la table "${table.name}":`);
      columns.forEach(col => {
        console.log(`   - ${col.name} (${col.type}${col.notnull ? ', NOT NULL' : ''}${col.pk ? ', PRIMARY KEY' : ''})`);
      });
      console.log('');
    }
    
    // Compter les enregistrements
    for (const table of tables) {
      const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table.name}`);
      console.log(`📈 ${table.name}: ${count[0].count} enregistrement(s)`);
    }
    
    await sequelize.close();
    console.log('\n✅ Vérification terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

verifyDatabase();

