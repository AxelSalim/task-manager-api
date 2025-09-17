const rateLimit = require('express-rate-limit');

// Rate limiter pour les demandes de réinitialisation de mot de passe
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // Maximum 5 demandes par IP par heure
  message: {
    error: 'Trop de demandes de réinitialisation',
    message: 'Vous avez atteint la limite de 5 demandes par heure. Veuillez réessayer plus tard.',
    retryAfter: '1 heure'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Ignorer les requêtes réussies pour ne compter que les échecs
  skipSuccessfulRequests: true,
  // Personnaliser la clé pour inclure l'email
  keyGenerator: (req) => {
    return `${req.ip}-${req.body?.email || 'unknown'}`;
  }
});

// Rate limiter pour la vérification des codes OTP
const otpVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Maximum 3 tentatives par email par 15 minutes
  message: {
    error: 'Trop de tentatives de vérification',
    message: 'Vous avez atteint la limite de 3 tentatives par 15 minutes. Veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Personnaliser la clé pour inclure l'email
  keyGenerator: (req) => {
    return `${req.ip}-${req.body?.email || 'unknown'}`;
  }
});

// Rate limiter pour la réinitialisation du mot de passe
const passwordResetSubmitLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 3, // Maximum 3 tentatives par IP par 30 minutes
  message: {
    error: 'Trop de tentatives de réinitialisation',
    message: 'Vous avez atteint la limite de 3 tentatives par 30 minutes. Veuillez réessayer plus tard.',
    retryAfter: '30 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter général pour les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 tentatives par IP par 15 minutes
  message: {
    error: 'Trop de tentatives de connexion',
    message: 'Vous avez atteint la limite de 10 tentatives par 15 minutes. Veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Ignorer les requêtes réussies
  skipSuccessfulRequests: true
});

module.exports = {
  passwordResetLimiter,
  otpVerificationLimiter,
  passwordResetSubmitLimiter,
  authLimiter
};
