const { Op } = require('sequelize');
const {
  FinanceCategory,
  FinanceTransaction,
  FinanceBudgetEntry,
  FinanceSubscription,
  FinanceSavingsGoal,
  FinanceSavingsContribution,
  FinanceCategoryRule,
} = require('../models');
const { sendSuccess, HTTP_ERRORS } = require('../utils/responseHandler');
const { logAudit } = require('../services/auditLog.service');
const { resolveCategoryFromRules } = require('../services/financeCategoryRules.service');

const TYPES = ['revenus', 'factures', 'depenses', 'epargnes', 'credits'];

function clampBillingDay(year, monthIndex, billingDay) {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(Math.max(1, billingDay), last);
}

/** Prochaine date de prélèvement (jour du mois), à partir d’aujourd’hui ou d’une date de référence. */
function nextSubscriptionDueDate(billingDay, fromDate = new Date()) {
  const y = fromDate.getFullYear();
  const m = fromDate.getMonth();
  const d = fromDate.getDate();
  const dayThisMonth = clampBillingDay(y, m, billingDay);
  const due = new Date(y, m, dayThisMonth);
  due.setHours(0, 0, 0, 0);
  const today = new Date(y, m, d);
  today.setHours(0, 0, 0, 0);
  if (due >= today) return due;
  let nm = m + 1;
  let ny = y;
  if (nm > 11) {
    nm = 0;
    ny += 1;
  }
  const dayNext = clampBillingDay(ny, nm, billingDay);
  return new Date(ny, nm, dayNext);
}

function daysFromToday(targetDate) {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const x = new Date(targetDate);
  x.setHours(0, 0, 0, 0);
  return Math.round((x - t) / 86400000);
}

async function getDashboardMonthAggregates(userId, year, month) {
  if (month < 1 || month > 12) return null;
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const transactions = await FinanceTransaction.findAll({
    where: { userId, date: { [Op.between]: [start, end] } },
    attributes: ['type', 'amount'],
  });
  const totalsByType = { revenus: 0, factures: 0, depenses: 0, epargnes: 0, credits: 0 };
  for (const t of transactions) {
    if (totalsByType[t.type] != null) totalsByType[t.type] += Number(t.amount);
  }
  const totalRevenus = totalsByType.revenus;
  const totalDepenses =
    totalsByType.factures + totalsByType.depenses + totalsByType.epargnes + totalsByType.credits;
  const solde = totalRevenus - totalDepenses;
  return { totalsByType, totalRevenus, totalDepenses, solde };
}

const financeController = {
  // --- Catégories ---
  async getCategories(req, res) {
    try {
      const { type } = req.query;
      const where = { userId: req.user.id };
      if (type && TYPES.includes(type)) where.type = type;
      const categories = await FinanceCategory.findAll({
        where,
        order: [['type', 'ASC'], ['name', 'ASC']],
      });
      const data = categories.map((c) => ({
        id: c.id,
        userId: c.userId,
        name: c.name,
        type: c.type,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
      return sendSuccess(res, 200, data, 'Catégories récupérées');
    } catch (err) {
      console.error('❌ getCategories:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la récupération des catégories');
    }
  },

  async createCategory(req, res) {
    try {
      const { name, type } = req.body;
      if (!name || !type) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'name et type sont obligatoires');
      }
      if (!TYPES.includes(type)) {
        return HTTP_ERRORS.BAD_REQUEST(res, `type doit être parmi: ${TYPES.join(', ')}`);
      }
      const category = await FinanceCategory.create({
        userId: req.user.id,
        name: String(name).trim(),
        type,
      });
      await logAudit(req.user.id, 'create', 'FinanceCategory', category.id, { name: category.name });
      return sendSuccess(res, 201, {
        id: category.id,
        userId: category.userId,
        name: category.name,
        type: category.type,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }, 'Catégorie créée');
    } catch (err) {
      console.error('❌ createCategory:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la création de la catégorie');
    }
  },

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const category = await FinanceCategory.findOne({
        where: { id, userId: req.user.id },
      });
      if (!category) return HTTP_ERRORS.NOT_FOUND(res, 'Catégorie non trouvée');
      const { name, type } = req.body;
      if (name != null) category.name = String(name).trim();
      if (type != null) {
        if (!TYPES.includes(type)) {
          return HTTP_ERRORS.BAD_REQUEST(res, `type doit être parmi: ${TYPES.join(', ')}`);
        }
        category.type = type;
      }
      await category.save();
      await logAudit(req.user.id, 'update', 'FinanceCategory', category.id, { name: category.name });
      return sendSuccess(res, 200, {
        id: category.id,
        userId: category.userId,
        name: category.name,
        type: category.type,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }, 'Catégorie mise à jour');
    } catch (err) {
      console.error('❌ updateCategory:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la mise à jour');
    }
  },

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const category = await FinanceCategory.findOne({
        where: { id, userId: req.user.id },
      });
      if (!category) return HTTP_ERRORS.NOT_FOUND(res, 'Catégorie non trouvée');
      const cid = category.id;
      await category.destroy();
      await logAudit(req.user.id, 'delete', 'FinanceCategory', cid, {});
      return sendSuccess(res, 200, null, 'Catégorie supprimée');
    } catch (err) {
      console.error('❌ deleteCategory:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la suppression');
    }
  },

  // --- Transactions ---
  // Filtre par mois : du 1er au dernier jour du mois (start = YYYY-MM-01, end = YYYY-MM-dernierJour)
  async getTransactions(req, res) {
    try {
      const { year, month, type, categoryId, dateFrom, dateTo } = req.query;
      const where = { userId: req.user.id };
      if (type && TYPES.includes(type)) where.type = type;
      if (categoryId) where.categoryId = categoryId;
      // Filtre par plage de dates (prioritaire si fourni)
      if (dateFrom || dateTo) {
        const from = dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? dateFrom : null;
        const to = dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? dateTo : null;
        if (from && to) {
          where.date = { [Op.between]: [from, to] };
        } else if (from) {
          where.date = { [Op.gte]: from };
        } else if (to) {
          where.date = { [Op.lte]: to };
        }
      } else if (year || month) {
        const y = year ? parseInt(year, 10) : new Date().getFullYear();
        const m = month ? parseInt(month, 10) : null;
        if (!isNaN(y)) {
          if (m != null && !isNaN(m) && m >= 1 && m <= 12) {
            const start = `${y}-${String(m).padStart(2, '0')}-01`;
            const lastDay = new Date(y, m, 0).getDate();
            const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            where.date = { [Op.between]: [start, end] };
          } else {
            where.date = { [Op.between]: [`${y}-01-01`, `${y}-12-31`] };
          }
        }
      }
      const transactions = await FinanceTransaction.findAll({
        where,
        include: [
          { model: FinanceCategory, as: 'category', attributes: ['id', 'name', 'type'] },
        ],
        order: [['date', 'DESC'], ['id', 'DESC']],
      });
      const data = transactions.map((t) => ({
        id: t.id,
        userId: t.userId,
        date: t.date,
        type: t.type,
        categoryId: t.categoryId,
        category: t.category ? { id: t.category.id, name: t.category.name, type: t.category.type } : null,
        amount: t.amount,
        comment: t.comment,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
      return sendSuccess(res, 200, data, 'Transactions récupérées');
    } catch (err) {
      console.error('❌ getTransactions:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la récupération des transactions');
    }
  },

  async createTransaction(req, res) {
    try {
      const { date, type, categoryId, amount, comment } = req.body;
      if (!date || !type) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'date et type sont obligatoires');
      }
      if (!TYPES.includes(type)) {
        return HTTP_ERRORS.BAD_REQUEST(res, `type doit être parmi: ${TYPES.join(', ')}`);
      }
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'amount doit être un nombre');
      }
      let resolvedCategoryId =
        categoryId != null && categoryId !== '' ? parseInt(categoryId, 10) : null;
      if (resolvedCategoryId != null && !Number.isNaN(resolvedCategoryId)) {
        const cat = await FinanceCategory.findOne({
          where: { id: resolvedCategoryId, userId: req.user.id },
        });
        if (!cat) return HTTP_ERRORS.BAD_REQUEST(res, 'Catégorie invalide');
      } else {
        resolvedCategoryId = null;
        const fromRule = await resolveCategoryFromRules(req.user.id, comment);
        if (fromRule != null) resolvedCategoryId = fromRule;
      }
      const transaction = await FinanceTransaction.create({
        userId: req.user.id,
        date: String(date).slice(0, 10),
        type,
        categoryId: resolvedCategoryId,
        amount: numAmount,
        comment: comment ? String(comment).trim() : null,
      });
      const withCategory = await FinanceTransaction.findByPk(transaction.id, {
        include: [{ model: FinanceCategory, as: 'category', attributes: ['id', 'name', 'type'] }],
      });
      await logAudit(req.user.id, 'create', 'FinanceTransaction', withCategory.id, {
        date: withCategory.date,
        amount: withCategory.amount,
      });
      return sendSuccess(res, 201, {
        id: withCategory.id,
        userId: withCategory.userId,
        date: withCategory.date,
        type: withCategory.type,
        categoryId: withCategory.categoryId,
        category: withCategory.category ? { id: withCategory.category.id, name: withCategory.category.name, type: withCategory.category.type } : null,
        amount: withCategory.amount,
        comment: withCategory.comment,
        createdAt: withCategory.createdAt,
        updatedAt: withCategory.updatedAt,
      }, 'Transaction créée');
    } catch (err) {
      console.error('❌ createTransaction:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la création de la transaction');
    }
  },

  async updateTransaction(req, res) {
    try {
      const { id } = req.params;
      const transaction = await FinanceTransaction.findOne({
        where: { id, userId: req.user.id },
      });
      if (!transaction) return HTTP_ERRORS.NOT_FOUND(res, 'Transaction non trouvée');
      const { date, type, categoryId, amount, comment, autoApplyRules } = req.body;
      if (date != null) transaction.date = String(date).slice(0, 10);
      if (type != null) {
        if (!TYPES.includes(type)) {
          return HTTP_ERRORS.BAD_REQUEST(res, `type doit être parmi: ${TYPES.join(', ')}`);
        }
        transaction.type = type;
      }
      if (categoryId !== undefined) {
        if (categoryId == null || categoryId === '') {
          transaction.categoryId = null;
        } else {
          const cat = await FinanceCategory.findOne({
            where: { id: categoryId, userId: req.user.id },
          });
          if (!cat) return HTTP_ERRORS.BAD_REQUEST(res, 'Catégorie invalide');
          transaction.categoryId = cat.id;
        }
      }
      if (amount !== undefined) {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return HTTP_ERRORS.BAD_REQUEST(res, 'amount doit être un nombre');
        transaction.amount = numAmount;
      }
      if (comment !== undefined) transaction.comment = comment ? String(comment).trim() : null;
      if (autoApplyRules === true) {
        const fromRule = await resolveCategoryFromRules(req.user.id, transaction.comment);
        if (fromRule != null) transaction.categoryId = fromRule;
      }
      await transaction.save();
      const withCategory = await FinanceTransaction.findByPk(transaction.id, {
        include: [{ model: FinanceCategory, as: 'category', attributes: ['id', 'name', 'type'] }],
      });
      await logAudit(req.user.id, 'update', 'FinanceTransaction', withCategory.id, {});
      return sendSuccess(res, 200, {
        id: withCategory.id,
        userId: withCategory.userId,
        date: withCategory.date,
        type: withCategory.type,
        categoryId: withCategory.categoryId,
        category: withCategory.category ? { id: withCategory.category.id, name: withCategory.category.name, type: withCategory.category.type } : null,
        amount: withCategory.amount,
        comment: withCategory.comment,
        createdAt: withCategory.createdAt,
        updatedAt: withCategory.updatedAt,
      }, 'Transaction mise à jour');
    } catch (err) {
      console.error('❌ updateTransaction:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la mise à jour');
    }
  },

  async deleteTransaction(req, res) {
    try {
      const { id } = req.params;
      const transaction = await FinanceTransaction.findOne({
        where: { id, userId: req.user.id },
      });
      if (!transaction) return HTTP_ERRORS.NOT_FOUND(res, 'Transaction non trouvée');
      const tid = transaction.id;
      await transaction.destroy();
      await logAudit(req.user.id, 'delete', 'FinanceTransaction', tid, {});
      return sendSuccess(res, 200, null, 'Transaction supprimée');
    } catch (err) {
      console.error('❌ deleteTransaction:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la suppression');
    }
  },

  // --- Budget ---
  async getBudget(req, res) {
    try {
      const { year, month } = req.query;
      const where = { userId: req.user.id };
      if (year) where.year = parseInt(year, 10);
      if (month) where.month = parseInt(month, 10);
      const entries = await FinanceBudgetEntry.findAll({
        where,
        include: [{ model: FinanceCategory, as: 'category', attributes: ['id', 'name', 'type'] }],
        order: [
          ['year', 'ASC'],
          ['month', 'ASC'],
          ['categoryId', 'ASC'],
        ],
      });
      const data = entries.map((e) => ({
        id: e.id,
        userId: e.userId,
        categoryId: e.categoryId,
        category: e.category ? { id: e.category.id, name: e.category.name, type: e.category.type } : null,
        year: e.year,
        month: e.month,
        amount: e.amount,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      }));
      return sendSuccess(res, 200, data, 'Budget récupéré');
    } catch (err) {
      console.error('❌ getBudget:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la récupération du budget');
    }
  },

  async putBudget(req, res) {
    try {
      const userId = req.user.id;
      const body = Array.isArray(req.body) ? req.body : [req.body];
      const results = [];
      for (const row of body) {
        const { categoryId, year, month, amount } = row;
        if (!categoryId || year == null || month == null) continue;
        const cat = await FinanceCategory.findOne({ where: { id: categoryId, userId } });
        if (!cat) continue;
        const numAmount = parseFloat(amount);
        const [entry] = await FinanceBudgetEntry.findOrCreate({
          where: { userId, categoryId, year: parseInt(year, 10), month: parseInt(month, 10) },
          defaults: { userId, categoryId, year: parseInt(year, 10), month: parseInt(month, 10), amount: Number.isNaN(numAmount) ? 0 : numAmount },
        });
        if (!entry.isNewRecord) {
          entry.amount = Number.isNaN(numAmount) ? 0 : numAmount;
          await entry.save();
        }
        results.push({
          id: entry.id,
          categoryId: entry.categoryId,
          year: entry.year,
          month: entry.month,
          amount: entry.amount,
        });
      }
      await logAudit(userId, 'update', 'FinanceBudget', null, { entries: results.length });
      return sendSuccess(res, 200, results, 'Budget mis à jour');
    } catch (err) {
      console.error('❌ putBudget:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la mise à jour du budget');
    }
  },

  // --- Dashboard (agrégats + réel vs budget) ---
  // Toujours du 1er au dernier jour du mois (start = YYYY-MM-01, end = YYYY-MM-dernierJour)
  async getDashboard(req, res) {
    try {
      const year = parseInt(req.query.year, 10) || new Date().getFullYear();
      const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
      if (month < 1 || month > 12) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'month doit être entre 1 et 12');
      }
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const transactions = await FinanceTransaction.findAll({
        where: { userId: req.user.id, date: { [Op.between]: [start, end] } },
        attributes: ['date', 'type', 'amount', 'categoryId'],
      });
      const totalsByType = { revenus: 0, factures: 0, depenses: 0, epargnes: 0, credits: 0 };
      for (const t of transactions) {
        if (totalsByType[t.type] != null) {
          totalsByType[t.type] += Number(t.amount);
        }
      }

      const budgetEntries = await FinanceBudgetEntry.findAll({
        where: { userId: req.user.id, year, month },
        include: [{ model: FinanceCategory, as: 'category', attributes: ['id', 'name', 'type'] }],
      });
      const budgetByType = { revenus: 0, factures: 0, depenses: 0, epargnes: 0, credits: 0 };
      const realVsBudget = [];
      for (const b of budgetEntries) {
        const t = b.category?.type;
        if (t && budgetByType[t] != null) budgetByType[t] += Number(b.amount);
        const real = transactions
          .filter((tr) => tr.categoryId === b.categoryId)
          .reduce((s, tr) => s + Number(tr.amount), 0);
        realVsBudget.push({
          categoryId: b.categoryId,
          categoryName: b.category?.name,
          categoryType: b.category?.type,
          budget: Number(b.amount),
          real,
          diff: Number(b.amount) - real,
        });
      }

      const totalRevenus = totalsByType.revenus;
      const totalDepenses = totalsByType.factures + totalsByType.depenses + totalsByType.epargnes + totalsByType.credits;
      const solde = totalRevenus - totalDepenses;
      const budgetRevenus = budgetByType.revenus;
      const budgetDepenses = budgetByType.factures + budgetByType.depenses + budgetByType.epargnes + budgetByType.credits;

      // Données par jour du mois (1er au dernier jour)
      const byDate = {};
      for (const t of transactions) {
        const d = String(t.date).slice(0, 10);
        if (!byDate[d]) byDate[d] = { totalRevenus: 0, totalDepenses: 0 };
        if (t.type === 'revenus') {
          byDate[d].totalRevenus += Number(t.amount);
        } else {
          byDate[d].totalDepenses += Number(t.amount);
        }
      }
      const daily = [];
      for (let day = 1; day <= lastDay; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const row = byDate[dateStr] || { totalRevenus: 0, totalDepenses: 0 };
        daily.push({
          date: dateStr,
          day,
          totalRevenus: row.totalRevenus,
          totalDepenses: row.totalDepenses,
          solde: row.totalRevenus - row.totalDepenses,
        });
      }

      return sendSuccess(res, 200, {
        year,
        month,
        totalsByType,
        budgetByType,
        totalRevenus,
        totalDepenses,
        solde,
        budgetRevenus,
        budgetDepenses,
        budgetSolde: budgetRevenus - budgetDepenses,
        realVsBudget,
        daily,
      }, 'Dashboard récupéré');
    } catch (err) {
      console.error('❌ getDashboard:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la récupération du dashboard');
    }
  },

  // --- Évolution sur N mois (pour graphique en courbe) ---
  // Chaque mois : du 1er au dernier jour (start = YYYY-MM-01, end = YYYY-MM-dernierJour).
  // Si year+month fournis : les N mois se terminent au mois sélectionné ; sinon N derniers mois depuis aujourd'hui.
  async getDashboardEvolution(req, res) {
    try {
      const count = Math.min(Math.max(parseInt(req.query.count, 10) || 6, 3), 24);
      const refYear = parseInt(req.query.year, 10);
      const refMonth = parseInt(req.query.month, 10);
      const months = [];
      if (!isNaN(refYear) && !isNaN(refMonth) && refMonth >= 1 && refMonth <= 12) {
        for (let i = count - 1; i >= 0; i--) {
          const d = new Date(refYear, refMonth - 1 - i, 1);
          months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
        }
      } else {
        const ref = new Date();
        for (let i = count - 1; i >= 0; i--) {
          const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
          months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
        }
      }

      const results = [];
      for (const { year, month } of months) {
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const transactions = await FinanceTransaction.findAll({
          where: { userId: req.user.id, date: { [Op.between]: [start, end] } },
          attributes: ['type', 'amount'],
        });
        const totalsByType = { revenus: 0, factures: 0, depenses: 0, epargnes: 0, credits: 0 };
        for (const t of transactions) {
          if (totalsByType[t.type] != null) totalsByType[t.type] += Number(t.amount);
        }
        const totalRevenus = totalsByType.revenus;
        const totalDepenses = totalsByType.factures + totalsByType.depenses + totalsByType.epargnes + totalsByType.credits;
        results.push({
          year,
          month,
          totalRevenus,
          totalDepenses,
          totalsByType: { ...totalsByType },
        });
      }
      return sendSuccess(res, 200, results, 'Évolution récupérée');
    } catch (err) {
      console.error('❌ getDashboardEvolution:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la récupération de l\'évolution');
    }
  },

  // --- Résumé annuel (totaux sur l'année) ---
  async getDashboardYear(req, res) {
    try {
      const year = parseInt(req.query.year, 10) || new Date().getFullYear();
      if (isNaN(year)) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'year invalide');
      }
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;
      const transactions = await FinanceTransaction.findAll({
        where: { userId: req.user.id, date: { [Op.between]: [start, end] } },
        attributes: ['type', 'amount'],
      });
      const totalsByType = { revenus: 0, factures: 0, depenses: 0, epargnes: 0, credits: 0 };
      for (const t of transactions) {
        if (totalsByType[t.type] != null) {
          totalsByType[t.type] += Number(t.amount);
        }
      }
      const totalRevenus = totalsByType.revenus;
      const totalDepenses =
        totalsByType.factures + totalsByType.depenses + totalsByType.epargnes + totalsByType.credits;
      const solde = totalRevenus - totalDepenses;
      return sendSuccess(res, 200, {
        year,
        totalRevenus,
        totalDepenses,
        solde,
        totalsByType,
      }, 'Résumé annuel récupéré');
    } catch (err) {
      console.error('❌ getDashboardYear:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la récupération du résumé annuel');
    }
  },

  // --- Abonnements ---
  async getSubscriptions(req, res) {
    try {
      const rows = await FinanceSubscription.findAll({
        where: { userId: req.user.id },
        include: [{ model: FinanceCategory, as: 'category', attributes: ['id', 'name', 'type'] }],
        order: [['name', 'ASC']],
      });
      const data = rows.map((s) => ({
        id: s.id,
        name: s.name,
        amount: Number(s.amount),
        billingDay: s.billingDay,
        reminderDaysBefore: s.reminderDaysBefore,
        isActive: s.isActive,
        categoryId: s.categoryId,
        category: s.category
          ? { id: s.category.id, name: s.category.name, type: s.category.type }
          : null,
        nextDueDate: nextSubscriptionDueDate(s.billingDay).toISOString().slice(0, 10),
        daysUntil: daysFromToday(nextSubscriptionDueDate(s.billingDay)),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
      return sendSuccess(res, 200, data, 'Abonnements récupérés');
    } catch (err) {
      console.error('❌ getSubscriptions:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur abonnements');
    }
  },

  async getSubscriptionAlerts(req, res) {
    try {
      const withinDays = Math.min(Math.max(parseInt(req.query.withinDays, 10) || 14, 1), 90);
      const rows = await FinanceSubscription.findAll({
        where: { userId: req.user.id, isActive: true },
        include: [{ model: FinanceCategory, as: 'category', attributes: ['id', 'name'] }],
      });
      const alerts = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (const s of rows) {
        const next = nextSubscriptionDueDate(s.billingDay, today);
        const daysUntil = daysFromToday(next);
        const remindFrom = s.reminderDaysBefore != null ? s.reminderDaysBefore : 3;
        if (daysUntil >= 0 && daysUntil <= withinDays) {
          alerts.push({
            id: s.id,
            name: s.name,
            amount: Number(s.amount),
            nextDueDate: next.toISOString().slice(0, 10),
            daysUntil,
            reminderDaysBefore: remindFrom,
            inReminderWindow: daysUntil <= remindFrom,
            category: s.category ? { id: s.category.id, name: s.category.name } : null,
          });
        }
      }
      return sendSuccess(res, 200, alerts, 'Alertes abonnements');
    } catch (err) {
      console.error('❌ getSubscriptionAlerts:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur alertes');
    }
  },

  async createSubscription(req, res) {
    try {
      const { name, amount, billingDay, reminderDaysBefore, isActive, categoryId } = req.body;
      if (!name || amount == null || billingDay == null) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'name, amount et billingDay sont obligatoires');
      }
      const day = parseInt(billingDay, 10);
      if (day < 1 || day > 31) return HTTP_ERRORS.BAD_REQUEST(res, 'billingDay entre 1 et 31');
      const numAmount = parseFloat(amount);
      if (Number.isNaN(numAmount)) return HTTP_ERRORS.BAD_REQUEST(res, 'amount invalide');
      if (categoryId != null) {
        const cat = await FinanceCategory.findOne({ where: { id: categoryId, userId: req.user.id } });
        if (!cat) return HTTP_ERRORS.BAD_REQUEST(res, 'Catégorie invalide');
      }
      const s = await FinanceSubscription.create({
        userId: req.user.id,
        name: String(name).trim(),
        amount: numAmount,
        billingDay: day,
        reminderDaysBefore: reminderDaysBefore != null ? parseInt(reminderDaysBefore, 10) : 3,
        isActive: isActive !== false,
        categoryId: categoryId || null,
      });
      await logAudit(req.user.id, 'create', 'FinanceSubscription', s.id, { name: s.name });
      return sendSuccess(res, 201, { id: s.id, name: s.name, amount: Number(s.amount), billingDay: s.billingDay }, 'Abonnement créé');
    } catch (err) {
      console.error('❌ createSubscription:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur création abonnement');
    }
  },

  async updateSubscription(req, res) {
    try {
      const { id } = req.params;
      const s = await FinanceSubscription.findOne({ where: { id, userId: req.user.id } });
      if (!s) return HTTP_ERRORS.NOT_FOUND(res, 'Abonnement non trouvé');
      const { name, amount, billingDay, reminderDaysBefore, isActive, categoryId } = req.body;
      if (name != null) s.name = String(name).trim();
      if (amount != null) {
        const n = parseFloat(amount);
        if (Number.isNaN(n)) return HTTP_ERRORS.BAD_REQUEST(res, 'amount invalide');
        s.amount = n;
      }
      if (billingDay != null) {
        const d = parseInt(billingDay, 10);
        if (d < 1 || d > 31) return HTTP_ERRORS.BAD_REQUEST(res, 'billingDay entre 1 et 31');
        s.billingDay = d;
      }
      if (reminderDaysBefore != null) s.reminderDaysBefore = parseInt(reminderDaysBefore, 10);
      if (isActive !== undefined) s.isActive = !!isActive;
      if (categoryId !== undefined) {
        if (categoryId == null || categoryId === '') s.categoryId = null;
        else {
          const cat = await FinanceCategory.findOne({ where: { id: categoryId, userId: req.user.id } });
          if (!cat) return HTTP_ERRORS.BAD_REQUEST(res, 'Catégorie invalide');
          s.categoryId = cat.id;
        }
      }
      await s.save();
      await logAudit(req.user.id, 'update', 'FinanceSubscription', s.id, {});
      return sendSuccess(res, 200, { id: s.id }, 'Abonnement mis à jour');
    } catch (err) {
      console.error('❌ updateSubscription:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur mise à jour abonnement');
    }
  },

  async deleteSubscription(req, res) {
    try {
      const { id } = req.params;
      const s = await FinanceSubscription.findOne({ where: { id, userId: req.user.id } });
      if (!s) return HTTP_ERRORS.NOT_FOUND(res, 'Abonnement non trouvé');
      await s.destroy();
      await logAudit(req.user.id, 'delete', 'FinanceSubscription', id, {});
      return sendSuccess(res, 200, null, 'Abonnement supprimé');
    } catch (err) {
      console.error('❌ deleteSubscription:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur suppression');
    }
  },

  // --- Objectifs d’épargne ---
  async getSavingsGoals(req, res) {
    try {
      const goals = await FinanceSavingsGoal.findAll({ where: { userId: req.user.id }, order: [['name', 'ASC']] });
      const data = [];
      for (const g of goals) {
        const saved = await FinanceSavingsContribution.sum('amount', { where: { goalId: g.id } }) || 0;
        data.push({
          id: g.id,
          name: g.name,
          targetAmount: Number(g.targetAmount),
          savedAmount: Number(saved),
          progressPercent: Number(g.targetAmount) > 0
            ? Math.min(100, Math.round((Number(saved) / Number(g.targetAmount)) * 100))
            : 0,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
        });
      }
      return sendSuccess(res, 200, data, 'Objectifs récupérés');
    } catch (err) {
      console.error('❌ getSavingsGoals:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur objectifs');
    }
  },

  async createSavingsGoal(req, res) {
    try {
      const { name, targetAmount } = req.body;
      if (!name || targetAmount == null) return HTTP_ERRORS.BAD_REQUEST(res, 'name et targetAmount requis');
      const t = parseFloat(targetAmount);
      if (Number.isNaN(t) || t <= 0) return HTTP_ERRORS.BAD_REQUEST(res, 'targetAmount invalide');
      const g = await FinanceSavingsGoal.create({
        userId: req.user.id,
        name: String(name).trim(),
        targetAmount: t,
      });
      await logAudit(req.user.id, 'create', 'FinanceSavingsGoal', g.id, { name: g.name });
      return sendSuccess(res, 201, { id: g.id, name: g.name, targetAmount: Number(g.targetAmount) }, 'Objectif créé');
    } catch (err) {
      console.error('❌ createSavingsGoal:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur création objectif');
    }
  },

  async updateSavingsGoal(req, res) {
    try {
      const { id } = req.params;
      const g = await FinanceSavingsGoal.findOne({ where: { id, userId: req.user.id } });
      if (!g) return HTTP_ERRORS.NOT_FOUND(res, 'Objectif non trouvé');
      const { name, targetAmount } = req.body;
      if (name != null) g.name = String(name).trim();
      if (targetAmount != null) {
        const t = parseFloat(targetAmount);
        if (Number.isNaN(t) || t <= 0) return HTTP_ERRORS.BAD_REQUEST(res, 'targetAmount invalide');
        g.targetAmount = t;
      }
      await g.save();
      await logAudit(req.user.id, 'update', 'FinanceSavingsGoal', g.id, {});
      return sendSuccess(res, 200, { id: g.id }, 'Objectif mis à jour');
    } catch (err) {
      console.error('❌ updateSavingsGoal:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur mise à jour objectif');
    }
  },

  async deleteSavingsGoal(req, res) {
    try {
      const { id } = req.params;
      const g = await FinanceSavingsGoal.findOne({ where: { id, userId: req.user.id } });
      if (!g) return HTTP_ERRORS.NOT_FOUND(res, 'Objectif non trouvé');
      await FinanceSavingsContribution.destroy({ where: { goalId: id } });
      await g.destroy();
      await logAudit(req.user.id, 'delete', 'FinanceSavingsGoal', id, {});
      return sendSuccess(res, 200, null, 'Objectif supprimé');
    } catch (err) {
      console.error('❌ deleteSavingsGoal:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur suppression objectif');
    }
  },

  async addSavingsContribution(req, res) {
    try {
      const { goalId } = req.params;
      const { amount, date, note } = req.body;
      const g = await FinanceSavingsGoal.findOne({ where: { id: goalId, userId: req.user.id } });
      if (!g) return HTTP_ERRORS.NOT_FOUND(res, 'Objectif non trouvé');
      const num = parseFloat(amount);
      if (Number.isNaN(num) || num <= 0) return HTTP_ERRORS.BAD_REQUEST(res, 'amount invalide');
      const d = date ? String(date).slice(0, 10) : new Date().toISOString().slice(0, 10);
      const c = await FinanceSavingsContribution.create({
        goalId: g.id,
        userId: req.user.id,
        amount: num,
        date: d,
        note: note ? String(note).trim() : null,
      });
      await logAudit(req.user.id, 'create', 'FinanceSavingsContribution', c.id, { goalId: g.id, amount: num });
      return sendSuccess(res, 201, { id: c.id, goalId: g.id, amount: num, date: d }, 'Versement enregistré');
    } catch (err) {
      console.error('❌ addSavingsContribution:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur versement');
    }
  },

  async getSavingsContributions(req, res) {
    try {
      const { goalId } = req.params;
      const g = await FinanceSavingsGoal.findOne({ where: { id: goalId, userId: req.user.id } });
      if (!g) return HTTP_ERRORS.NOT_FOUND(res, 'Objectif non trouvé');
      const rows = await FinanceSavingsContribution.findAll({
        where: { goalId },
        order: [['date', 'DESC'], ['id', 'DESC']],
      });
      const data = rows.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        date: r.date,
        note: r.note,
        createdAt: r.createdAt,
      }));
      return sendSuccess(res, 200, data, 'Versements récupérés');
    } catch (err) {
      console.error('❌ getSavingsContributions:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur liste versements');
    }
  },

  async deleteSavingsContribution(req, res) {
    try {
      const { goalId, id } = req.params;
      const g = await FinanceSavingsGoal.findOne({ where: { id: goalId, userId: req.user.id } });
      if (!g) return HTTP_ERRORS.NOT_FOUND(res, 'Objectif non trouvé');
      const c = await FinanceSavingsContribution.findOne({ where: { id, goalId } });
      if (!c) return HTTP_ERRORS.NOT_FOUND(res, 'Versement non trouvé');
      await c.destroy();
      await logAudit(req.user.id, 'delete', 'FinanceSavingsContribution', id, {});
      return sendSuccess(res, 200, null, 'Versement supprimé');
    } catch (err) {
      console.error('❌ deleteSavingsContribution:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur suppression versement');
    }
  },

  // --- Règles de catégorisation ---
  async getCategoryRules(req, res) {
    try {
      const rows = await FinanceCategoryRule.findAll({
        where: { userId: req.user.id },
        include: [{ model: FinanceCategory, as: 'category', attributes: ['id', 'name', 'type'] }],
        order: [['priority', 'DESC'], ['id', 'ASC']],
      });
      const data = rows.map((r) => ({
        id: r.id,
        matchSubstring: r.matchSubstring,
        categoryId: r.categoryId,
        category: r.category
          ? { id: r.category.id, name: r.category.name, type: r.category.type }
          : null,
        priority: r.priority,
        createdAt: r.createdAt,
      }));
      return sendSuccess(res, 200, data, 'Règles récupérées');
    } catch (err) {
      console.error('❌ getCategoryRules:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur règles');
    }
  },

  async createCategoryRule(req, res) {
    try {
      const { matchSubstring, categoryId, priority } = req.body;
      if (!matchSubstring || !categoryId) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'matchSubstring et categoryId requis');
      }
      const cat = await FinanceCategory.findOne({ where: { id: categoryId, userId: req.user.id } });
      if (!cat) return HTTP_ERRORS.BAD_REQUEST(res, 'Catégorie invalide');
      const r = await FinanceCategoryRule.create({
        userId: req.user.id,
        matchSubstring: String(matchSubstring).trim(),
        categoryId: cat.id,
        priority: priority != null ? parseInt(priority, 10) : 0,
      });
      await logAudit(req.user.id, 'create', 'FinanceCategoryRule', r.id, { match: r.matchSubstring });
      return sendSuccess(res, 201, { id: r.id }, 'Règle créée');
    } catch (err) {
      console.error('❌ createCategoryRule:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur création règle');
    }
  },

  async updateCategoryRule(req, res) {
    try {
      const { id } = req.params;
      const r = await FinanceCategoryRule.findOne({ where: { id, userId: req.user.id } });
      if (!r) return HTTP_ERRORS.NOT_FOUND(res, 'Règle non trouvée');
      const { matchSubstring, categoryId, priority } = req.body;
      if (matchSubstring != null) r.matchSubstring = String(matchSubstring).trim();
      if (categoryId != null) {
        const cat = await FinanceCategory.findOne({ where: { id: categoryId, userId: req.user.id } });
        if (!cat) return HTTP_ERRORS.BAD_REQUEST(res, 'Catégorie invalide');
        r.categoryId = cat.id;
      }
      if (priority != null) r.priority = parseInt(priority, 10);
      await r.save();
      await logAudit(req.user.id, 'update', 'FinanceCategoryRule', r.id, {});
      return sendSuccess(res, 200, { id: r.id }, 'Règle mise à jour');
    } catch (err) {
      console.error('❌ updateCategoryRule:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur mise à jour règle');
    }
  },

  async deleteCategoryRule(req, res) {
    try {
      const { id } = req.params;
      const r = await FinanceCategoryRule.findOne({ where: { id, userId: req.user.id } });
      if (!r) return HTTP_ERRORS.NOT_FOUND(res, 'Règle non trouvée');
      await r.destroy();
      await logAudit(req.user.id, 'delete', 'FinanceCategoryRule', id, {});
      return sendSuccess(res, 200, null, 'Règle supprimée');
    } catch (err) {
      console.error('❌ deleteCategoryRule:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur suppression règle');
    }
  },

  /** Résumé texte du mois (email / copie) */
  async getMonthlyReportSummary(req, res) {
    try {
      const year = parseInt(req.query.year, 10) || new Date().getFullYear();
      const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
      const dash = await getDashboardMonthAggregates(req.user.id, year, month);
      if (!dash) return HTTP_ERRORS.BAD_REQUEST(res, 'Mois invalide');
      const lines = [
        `Résumé financier — ${year}-${String(month).padStart(2, '0')}`,
        `Revenus réels : ${dash.totalRevenus.toLocaleString('fr-FR')} CFA`,
        `Dépenses réelles (hors revenus) : ${dash.totalDepenses.toLocaleString('fr-FR')} CFA`,
        `Solde : ${dash.solde.toLocaleString('fr-FR')} CFA`,
        '',
        'Par type :',
        ...Object.entries(dash.totalsByType).map(([k, v]) => `  - ${k}: ${Number(v).toLocaleString('fr-FR')} CFA`),
      ];
      return sendSuccess(res, 200, { text: lines.join('\n'), year, month }, 'Résumé généré');
    } catch (err) {
      console.error('❌ getMonthlyReportSummary:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur résumé');
    }
  },
};

module.exports = financeController;
