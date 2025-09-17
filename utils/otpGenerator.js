const crypto = require('crypto');
const bcrypt = require('bcrypt');

class OTPGenerator {
  constructor() {
    this.OTP_LENGTH = 6;
    this.OTP_EXPIRY_MINUTES = 15;
  }

  // Générer un code OTP de 6 chiffres
  generateOTP() {
    // Générer un nombre aléatoire entre 100000 et 999999
    const min = 100000;
    const max = 999999;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;
    return otp.toString();
  }

  // Générer un code OTP plus sécurisé avec crypto
  generateSecureOTP() {
    // Générer 3 bytes aléatoires
    const randomBytes = crypto.randomBytes(3);
    // Convertir en nombre et prendre modulo 1000000 pour avoir 6 chiffres
    const otp = (randomBytes.readUIntBE(0, 3) % 1000000).toString().padStart(6, '0');
    return otp;
  }

  // Hasher un code OTP pour le stockage en base
  async hashOTP(otp) {
    const saltRounds = 10;
    return await bcrypt.hash(otp, saltRounds);
  }

  // Vérifier un code OTP
  async verifyOTP(otp, hashedOTP) {
    return await bcrypt.compare(otp, hashedOTP);
  }

  // Calculer la date d'expiration
  getExpiryDate() {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (this.OTP_EXPIRY_MINUTES * 60 * 1000));
    return expiryDate;
  }

  // Vérifier si un code OTP est expiré
  isOTPExpired(expiryDate) {
    return new Date() > new Date(expiryDate);
  }

  // Générer un token de réinitialisation temporaire
  generateResetToken(email) {
    const payload = {
      email: email,
      type: 'password_reset',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
    };
    
    // Utiliser une clé secrète différente pour les tokens de réinitialisation
    const secret = process.env.JWT_RESET_SECRET || process.env.JWT_SECRET + '_reset';
    
    return require('jsonwebtoken').sign(payload, secret);
  }

  // Vérifier un token de réinitialisation
  verifyResetToken(token) {
    try {
      const secret = process.env.JWT_RESET_SECRET || process.env.JWT_SECRET + '_reset';
      return require('jsonwebtoken').verify(token, secret);
    } catch (error) {
      return null;
    }
  }

  // Nettoyer les codes OTP expirés (à appeler périodiquement)
  async cleanupExpiredOTPs(PasswordResetModel) {
    try {
      const result = await PasswordResetModel.cleanupExpiredCodes();
      console.log(`🧹 ${result} codes OTP expirés supprimés`);
      return result;
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des codes OTP:', error);
      return 0;
    }
  }

  // Valider le format d'un code OTP
  validateOTPFormat(otp) {
    if (!otp || typeof otp !== 'string') {
      return false;
    }
    
    // Vérifier que c'est exactement 6 chiffres
    const otpRegex = /^\d{6}$/;
    return otpRegex.test(otp);
  }

  // Générer un code OTP avec vérification de format
  generateValidOTP() {
    let otp;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      otp = this.generateSecureOTP();
      attempts++;
    } while (!this.validateOTPFormat(otp) && attempts < maxAttempts);

    if (!this.validateOTPFormat(otp)) {
      // Fallback vers la méthode simple si la méthode sécurisée échoue
      otp = this.generateOTP();
    }

    return otp;
  }
}

module.exports = new OTPGenerator();
