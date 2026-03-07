const { Op } = require('sequelize');
const { Habit, HabitCompletion } = require('../models');
const { sendSuccess, HTTP_ERRORS } = require('../utils/responseHandler');

const habitsController = {
  async getHabits(req, res) {
    try {
      const habits = await Habit.findAll({
        where: { userId: req.user.id },
        order: [['order', 'ASC'], ['id', 'ASC']],
      });
      const data = habits.map((h) => ({
        id: h.id,
        userId: h.userId,
        name: h.name,
        order: h.order,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
      }));
      return sendSuccess(res, 200, data, 'Habitudes récupérées');
    } catch (err) {
      console.error('❌ getHabits:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la récupération des habitudes');
    }
  },

  async createHabit(req, res) {
    try {
      const { name, order } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'Le nom est obligatoire');
      }
      const maxOrder = await Habit.max('order', { where: { userId: req.user.id } });
      const habit = await Habit.create({
        userId: req.user.id,
        name: name.trim(),
        order: typeof order === 'number' && !Number.isNaN(order) ? order : (maxOrder ?? 0) + 1,
      });
      return sendSuccess(res, 201, {
        id: habit.id,
        userId: habit.userId,
        name: habit.name,
        order: habit.order,
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt,
      }, 'Habitude créée');
    } catch (err) {
      console.error('❌ createHabit:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la création');
    }
  },

  async updateHabit(req, res) {
    try {
      const { id } = req.params;
      const habit = await Habit.findOne({ where: { id, userId: req.user.id } });
      if (!habit) return HTTP_ERRORS.NOT_FOUND(res, 'Habitude non trouvée');
      const { name, order } = req.body;
      if (name != null) habit.name = String(name).trim();
      if (typeof order === 'number' && !Number.isNaN(order)) habit.order = order;
      await habit.save();
      return sendSuccess(res, 200, {
        id: habit.id,
        userId: habit.userId,
        name: habit.name,
        order: habit.order,
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt,
      }, 'Habitude mise à jour');
    } catch (err) {
      console.error('❌ updateHabit:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la mise à jour');
    }
  },

  async deleteHabit(req, res) {
    try {
      const { id } = req.params;
      const habit = await Habit.findOne({ where: { id, userId: req.user.id } });
      if (!habit) return HTTP_ERRORS.NOT_FOUND(res, 'Habitude non trouvée');
      await HabitCompletion.destroy({ where: { habitId: id } });
      await habit.destroy();
      return sendSuccess(res, 200, null, 'Habitude supprimée');
    } catch (err) {
      console.error('❌ deleteHabit:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la suppression');
    }
  },

  async getCompletions(req, res) {
    try {
      const { from, to } = req.query;
      if (!from || !to) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'from et to (YYYY-MM-DD) sont obligatoires');
      }
      const completions = await HabitCompletion.findAll({
        where: {
          userId: req.user.id,
          date: { [Op.between]: [from, to] },
        },
        attributes: ['habitId', 'date'],
      });
      const data = completions.map((c) => ({ habitId: c.habitId, date: c.date }));
      return sendSuccess(res, 200, data, 'Complétions récupérées');
    } catch (err) {
      console.error('❌ getCompletions:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la récupération');
    }
  },

  async setCompletion(req, res) {
    try {
      const { habitId, date, completed } = req.body;
      if (!habitId || !date) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'habitId et date (YYYY-MM-DD) sont obligatoires');
      }
      const habit = await Habit.findOne({ where: { id: habitId, userId: req.user.id } });
      if (!habit) return HTTP_ERRORS.NOT_FOUND(res, 'Habitude non trouvée');
      const dateStr = String(date).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'date doit être au format YYYY-MM-DD');
      }
      if (completed) {
        const [entry] = await HabitCompletion.findOrCreate({
          where: { habitId, date: dateStr },
          defaults: { userId: req.user.id, habitId, date: dateStr },
        });
        if (entry.userId !== req.user.id) {
          entry.userId = req.user.id;
          await entry.save();
        }
        return sendSuccess(res, 200, { habitId, date: dateStr, completed: true }, 'Complétion enregistrée');
      } else {
        await HabitCompletion.destroy({
          where: { habitId, date: dateStr, userId: req.user.id },
        });
        return sendSuccess(res, 200, { habitId, date: dateStr, completed: false }, 'Complétion retirée');
      }
    } catch (err) {
      console.error('❌ setCompletion:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de l\'enregistrement');
    }
  },
};

module.exports = habitsController;
