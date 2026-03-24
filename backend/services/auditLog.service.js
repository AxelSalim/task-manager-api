const { AuditLog } = require('../models');

/**
 * @param {number} userId
 * @param {string} action create|update|delete
 * @param {string} entityType
 * @param {number|null} entityId
 * @param {object} [details]
 */
async function logAudit(userId, action, entityType, entityId, details = {}) {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId: entityId ?? null,
      details: typeof details === 'string' ? details : JSON.stringify(details),
    });
  } catch (e) {
    console.error('auditLog.service logAudit:', e.message);
  }
}

module.exports = { logAudit };
