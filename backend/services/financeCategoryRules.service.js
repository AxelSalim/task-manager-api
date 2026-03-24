const { FinanceCategoryRule, FinanceCategory } = require('../models');

/**
 * Retourne categoryId si une règle correspond au libellé (commentaire), sinon null.
 * @param {number} userId
 * @param {string|null|undefined} comment
 */
async function resolveCategoryFromRules(userId, comment) {
  if (!comment || !String(comment).trim()) return null;
  const rules = await FinanceCategoryRule.findAll({
    where: { userId },
    order: [
      ['priority', 'DESC'],
      ['id', 'ASC'],
    ],
  });
  const lower = String(comment).toLowerCase();
  for (const r of rules) {
    const needle = String(r.matchSubstring).toLowerCase();
    if (needle && lower.includes(needle)) {
      const cat = await FinanceCategory.findOne({
        where: { id: r.categoryId, userId },
      });
      if (cat) return cat.id;
    }
  }
  return null;
}

module.exports = { resolveCategoryFromRules };
