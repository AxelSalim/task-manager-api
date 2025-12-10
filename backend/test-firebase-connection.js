/**
 * Script de test pour vérifier la connexion Firebase Firestore
 * Exécutez avec: node test-firebase-connection.js
 */

const { db, admin, firebaseApp } = require('./config/firebase');
const { v4: uuidv4 } = require('uuid');

async function testFirebaseConnection() {
  console.log('🧪 Test de connexion Firebase Firestore\n');
  console.log('=' .repeat(50));

  try {
    // Test 1: Vérifier l'initialisation
    console.log('\n1️⃣ Test d\'initialisation Firebase...');
    if (!db || !firebaseApp) {
      throw new Error('Firebase n\'est pas initialisé');
    }
    console.log(`   ✅ Firebase initialisé`);
    console.log(`   📊 Projet: ${firebaseApp.options.projectId || 'Non défini'}`);

    // Test 2: Test de connexion Firestore
    console.log('\n2️⃣ Test de connexion Firestore...');
    const testCollection = db.collection('_test_connection');
    await testCollection.limit(1).get();
    console.log('   ✅ Connexion Firestore réussie');

    // Test 3: Test d'écriture
    console.log('\n3️⃣ Test d\'écriture...');
    const testDocId = uuidv4();
    const testDocRef = testCollection.doc(testDocId);
    await testDocRef.set({
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: 'Test de connexion Firebase'
    });
    console.log(`   ✅ Document créé avec UUID: ${testDocId}`);

    // Test 4: Test de lecture
    console.log('\n4️⃣ Test de lecture...');
    const doc = await testDocRef.get();
    if (!doc.exists) {
      throw new Error('Le document n\'existe pas');
    }
    const data = doc.data();
    console.log('   ✅ Document lu avec succès');
    console.log(`   📄 Contenu: ${JSON.stringify(data, null, 2)}`);

    // Test 5: Test de requête
    console.log('\n5️⃣ Test de requête...');
    const snapshot = await testCollection
      .where('test', '==', true)
      .limit(1)
      .get();
    console.log(`   ✅ Requête exécutée: ${snapshot.docs.length} document(s) trouvé(s)`);

    // Test 6: Test de mise à jour
    console.log('\n6️⃣ Test de mise à jour...');
    await testDocRef.update({
      updated: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   ✅ Document mis à jour');

    // Test 7: Test de suppression
    console.log('\n7️⃣ Test de suppression...');
    await testDocRef.delete();
    console.log('   ✅ Document supprimé');

    // Test 8: Nettoyer les documents de test restants
    console.log('\n8️⃣ Nettoyage des documents de test...');
    const allTestDocs = await testCollection.get();
    if (!allTestDocs.empty) {
      const batch = db.batch();
      allTestDocs.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`   ✅ ${allTestDocs.docs.length} document(s) de test supprimé(s)`);
    } else {
      console.log('   ✅ Aucun document de test à supprimer');
    }

    // Résumé
    console.log('\n' + '='.repeat(50));
    console.log('✅ Tous les tests sont passés avec succès !');
    console.log('🎉 Firebase Firestore est correctement configuré.\n');

    // Informations supplémentaires
    console.log('📋 Informations:');
    console.log(`   - Projet Firebase: ${firebaseApp.options.projectId}`);
    console.log(`   - Base de données: Firestore`);
    console.log(`   - UUID générés: ✅`);
    console.log('\n💡 Prochaines étapes:');
    console.log('   1. Vérifiez que les index Firestore sont créés');
    console.log('   2. Testez les endpoints API');
    console.log('   3. Vérifiez les règles de sécurité Firestore\n');

  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ Erreur lors des tests:', error.message);
    console.error('\n🔍 Dépannage:');
    
    if (error.message.includes('Permission denied')) {
      console.error('   - Vérifiez les règles Firestore dans Firebase Console');
      console.error('   - Assurez-vous que la clé de service a les bonnes permissions');
    } else if (error.message.includes('index')) {
      console.error('   - Un index est requis pour cette requête');
      console.error('   - Firebase vous donnera un lien pour créer l\'index');
    } else if (error.message.includes('not found') || error.message.includes('Cannot find')) {
      console.error('   - Vérifiez que le fichier de configuration Firebase existe');
      console.error('   - Vérifiez les variables d\'environnement dans .env');
    } else {
      console.error('   - Vérifiez la configuration Firebase');
      console.error('   - Consultez la documentation: docs/firebase-config.md');
    }
    
    console.error('\n');
    process.exit(1);
  }
}

// Exécuter les tests
testFirebaseConnection()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
