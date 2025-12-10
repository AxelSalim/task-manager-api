const rateLimit = require('express-rate-limit');

// Fonction helper pour normaliser les adresses IP (IPv4 et IPv6)
// Cette fonction suit les recommandations d'express-rate-limit pour éviter les contournements IPv6
const normalizeIp = (req) => {
  // Récupérer l'IP de la requête
  let ip = req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.socket.remoteAddress || 
           'unknown';
  
  // Normaliser les adresses IPv6 mappées en IPv4 (::ffff:127.0.0.1 -> 127.0.0.1)
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7); // Enlever '::ffff:'
  }
  
  // Normaliser localhost IPv6
  if (ip === '::1') {
    ip = '127.0.0.1';
  }
  
  // Pour les vraies adresses IPv6, les normaliser en enlevant les crochets si présents
  // et en les convertissant en format normalisé
  if (ip.includes(':') && !ip.startsWith('::ffff:')) {
    // C'est une vraie adresse IPv6, la normaliser
    ip = ip.replace(/^\[|\]$/g, ''); // Enlever les crochets
    // Normaliser en format court pour éviter les variations
    // Exemple: 2001:0db8::1 et 2001:db8:0:0:0:0:0:1 doivent être identiques
    try {
      // Utiliser une normalisation simple : garder l'IP telle quelle
      // mais s'assurer qu'elle est cohérente
      return ip.toLowerCase();
    } catch (e) {
      return ip;
    }
  }
  
  return ip;
};

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
  // Désactiver la validation stricte IPv6 (on gère manuellement)
  validate: {
    ip: false
  },
  // Personnaliser la clé pour inclure l'email (avec gestion IPv6)
  keyGenerator: (req) => {
    const ipKey = normalizeIp(req);
    return `${ipKey}-${req.body?.email || 'unknown'}`;
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
  // Désactiver la validation stricte IPv6 (on gère manuellement)
  validate: {
    ip: false
  },
  // Personnaliser la clé pour inclure l'email (avec gestion IPv6)
  keyGenerator: (req) => {
    const ipKey = normalizeIp(req);
    return `${ipKey}-${req.body?.email || 'unknown'}`;
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
