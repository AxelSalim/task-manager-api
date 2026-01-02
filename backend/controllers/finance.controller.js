const { Op } = require('sequelize');
const { FinanceCategory, FinanceTransaction } = require('../models');
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
  async getTransactions(req, res) {
    try {
      const { year, month, type, categoryId } = req.query;
      const where = { userId: req.user.id };
      if (type && TYPES.includes(type)) where.type = type;
      if (categoryId) where.categoryId = categoryId;
      if (year || month) {
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
};

module.exports = financeController;
