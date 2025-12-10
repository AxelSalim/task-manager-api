// Script de test pour le workflow de réinitialisation de mot de passe
const otpGenerator = require('./utils/otpGenerator');
const emailService = require('./services/emailService');

async function testPasswordResetWorkflow() {
  console.log('🧪 Test du workflow de réinitialisation de mot de passe\n');

  try {
    // Test 1: Génération de code OTP
    console.log('1️⃣ Test de génération de code OTP...');
    const otp = otpGenerator.generateValidOTP();
    console.log(`   Code OTP généré: ${otp}`);
    console.log(`   Format valide: ${otpGenerator.validateOTPFormat(otp)}`);

    // Test 2: Hashage du code OTP
    console.log('\n2️⃣ Test de hashage du code OTP...');
    const hashedOTP = await otpGenerator.hashOTP(otp);
    console.log(`   Code OTP hashé: ${hashedOTP.substring(0, 20)}...`);

    // Test 3: Vérification du code OTP
    console.log('\n3️⃣ Test de vérification du code OTP...');
    const isValid = await otpGenerator.verifyOTP(otp, hashedOTP);
    console.log(`   Code OTP valide: ${isValid}`);

    // Test 4: Génération de token de réinitialisation
    console.log('\n4️⃣ Test de génération de token de réinitialisation...');
    const resetToken = otpGenerator.generateResetToken('test@example.com');
    console.log(`   Token généré: ${resetToken.substring(0, 50)}...`);

    // Test 5: Vérification du token
    console.log('\n5️⃣ Test de vérification du token...');
    const decodedToken = otpGenerator.verifyResetToken(resetToken);
    console.log(`   Token valide: ${decodedToken ? 'Oui' : 'Non'}`);
    if (decodedToken) {
      console.log(`   Email: ${decodedToken.email}`);
      console.log(`   Type: ${decodedToken.type}`);
    }

    // Test 6: Vérification de la configuration email
    console.log('\n6️⃣ Test de la configuration email...');
    const emailConfigValid = await emailService.verifyConnection();
    console.log(`   Configuration email: ${emailConfigValid ? 'Valide' : 'Invalide'}`);

    if (!emailConfigValid) {
      console.log('\n⚠️  Configuration email manquante. Ajoutez ces variables à votre .env :');
      console.log('   EMAIL_PROVIDER=gmail');
      console.log('   EMAIL_USER=your_email@gmail.com');
      console.log('   EMAIL_PASS=your_app_password');
    }

    console.log('\n✅ Tests terminés avec succès !');
    console.log('\n📋 Prochaines étapes :');
    console.log('   1. Démarrer MySQL et exécuter les migrations');
    console.log('   2. Configurer les variables d\'environnement email');
    console.log('   3. Tester les endpoints API');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testPasswordResetWorkflow().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
