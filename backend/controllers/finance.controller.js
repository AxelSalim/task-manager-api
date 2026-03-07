const { Op } = require('sequelize');
const { FinanceCategory, FinanceTransaction, FinanceBudgetEntry } = require('../models');
const { sendSuccess, HTTP_ERRORS } = require('../utils/responseHandler');

const TYPES = ['revenus', 'factures', 'depenses', 'epargnes', 'credits'];

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
      await category.destroy();
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
      if (categoryId != null) {
        const cat = await FinanceCategory.findOne({
          where: { id: categoryId, userId: req.user.id },
        });
        if (!cat) return HTTP_ERRORS.BAD_REQUEST(res, 'Catégorie invalide');
      }
      const transaction = await FinanceTransaction.create({
        userId: req.user.id,
        date: String(date).slice(0, 10),
        type,
        categoryId: categoryId || null,
        amount: numAmount,
        comment: comment ? String(comment).trim() : null,
      });
      const withCategory = await FinanceTransaction.findByPk(transaction.id, {
        include: [{ model: FinanceCategory, as: 'category', attributes: ['id', 'name', 'type'] }],
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
      const { date, type, categoryId, amount, comment } = req.body;
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
      await transaction.save();
      const withCategory = await FinanceTransaction.findByPk(transaction.id, {
        include: [{ model: FinanceCategory, as: 'category', attributes: ['id', 'name', 'type'] }],
      });
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
      await transaction.destroy();
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
};

module.exports = financeController;
