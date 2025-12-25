/**
 * Gestionnaire de réponses standardisées pour l'API
 */

/**
 * Format de réponse standard pour succès
 * @param {Object} res - Objet response Express
 * @param {number} statusCode - Code HTTP (200, 201, etc.)
 * @param {any} data - Données à retourner
 * @param {string} message - Message de succès
 */
const sendSuccess = (res, statusCode = 200, data = null, message = 'Opération réussie') => {
  return res.status(statusCode).json({
    success: true,
    code: statusCode,
    data,
    message,
  });
};

/**
 * Format de réponse standard pour erreurs
 * @param {Object} res - Objet response Express
 * @param {number} statusCode - Code HTTP d'erreur (400, 401, 404, 500, etc.)
 * @param {string} message - Message d'erreur
 * @param {any} errors - Détails des erreurs (optionnel, pour validation)
 */
const sendError = (res, statusCode = 500, message = 'Erreur serveur', errors = null) => {
  const response = {
    success: false,
    code: statusCode,
    message,
  };

  // Ajouter les détails d'erreur si fournis (utile pour les erreurs de validation)
  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Erreurs HTTP standardisées
 */
const HTTP_ERRORS = {
  BAD_REQUEST: (res, message = 'Requête invalide', errors = null) => 
    sendError(res, 400, message, errors),
  
  UNAUTHORIZED: (res, message = 'Non autorisé') => 
    sendError(res, 401, message),
  
  FORBIDDEN: (res, message = 'Accès interdit') => 
    sendError(res, 403, message),
  
  NOT_FOUND: (res, message = 'Ressource non trouvée') => 
    sendError(res, 404, message),
  
  CONFLICT: (res, message = 'Conflit') => 
    sendError(res, 409, message),
  
  VALIDATION_ERROR: (res, message = 'Erreur de validation', errors = null) => 
    sendError(res, 422, message, errors),
  
  INTERNAL_SERVER_ERROR: (res, message = 'Erreur serveur interne') => 
    sendError(res, 500, message),
};

module.exports = {
  sendSuccess,
  sendError,
  HTTP_ERRORS,
};

