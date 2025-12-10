/**
 * Index des modèles Firestore
 * Exporte tous les modèles pour faciliter les imports
 */

const User = require('./User');
const Task = require('./Task');
const PasswordReset = require('./PasswordReset');

module.exports = {
  User,
  Task,
  PasswordReset
};
