const crypto = require('crypto');
const {
  Household,
  HouseholdMember,
  HouseholdInvite,
  User,
} = require('../models');
const { sendSuccess, HTTP_ERRORS } = require('../utils/responseHandler');
const { logAudit } = require('../services/auditLog.service');

const householdController = {
  async getMine(req, res) {
    try {
      const member = await HouseholdMember.findOne({
        where: { userId: req.user.id },
        include: [{ model: Household, as: 'household' }],
      });
      if (!member || !member.household) {
        return sendSuccess(res, 200, null, 'Aucun foyer');
      }
      const h = member.household;
      const members = await HouseholdMember.findAll({
        where: { householdId: h.id },
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      });
      return sendSuccess(
        res,
        200,
        {
          household: { id: h.id, name: h.name, ownerUserId: h.ownerUserId },
          myRole: member.role,
          members: members.map((m) => ({
            userId: m.userId,
            role: m.role,
            name: m.user?.name,
            email: m.user?.email,
          })),
        },
        'Foyer récupéré'
      );
    } catch (err) {
      console.error('❌ getMine household:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur foyer');
    }
  },

  async create(req, res) {
    try {
      const { name } = req.body;
      if (!name || !String(name).trim()) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'name requis');
      }
      const existing = await HouseholdMember.findOne({ where: { userId: req.user.id } });
      if (existing) {
        return HTTP_ERRORS.CONFLICT(res, 'Vous appartenez déjà à un foyer');
      }
      const household = await Household.create({
        name: String(name).trim(),
        ownerUserId: req.user.id,
      });
      await HouseholdMember.create({
        householdId: household.id,
        userId: req.user.id,
        role: 'owner',
      });
      await logAudit(req.user.id, 'create', 'Household', household.id, { name: household.name });
      return sendSuccess(
        res,
        201,
        { id: household.id, name: household.name },
        'Foyer créé'
      );
    } catch (err) {
      console.error('❌ create household:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur création foyer');
    }
  },

  async createInvite(req, res) {
    try {
      const member = await HouseholdMember.findOne({
        where: { userId: req.user.id },
        include: [{ model: Household, as: 'household' }],
      });
      if (!member || member.role !== 'owner') {
        return HTTP_ERRORS.FORBIDDEN(res, 'Seul le propriétaire peut inviter');
      }
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const expiresAt = new Date(Date.now() + 7 * 86400000);
      await HouseholdInvite.destroy({ where: { householdId: member.householdId } });
      const inv = await HouseholdInvite.create({
        householdId: member.householdId,
        code,
        expiresAt,
      });
      await logAudit(req.user.id, 'create', 'HouseholdInvite', inv.id, { householdId: member.householdId });
      return sendSuccess(
        res,
        201,
        { code: inv.code, expiresAt: inv.expiresAt.toISOString() },
        'Code d’invitation créé (valide 7 jours)'
      );
    } catch (err) {
      console.error('❌ createInvite:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur invitation');
    }
  },

  async join(req, res) {
    try {
      const { code } = req.body;
      if (!code || !String(code).trim()) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'code requis');
      }
      const existing = await HouseholdMember.findOne({ where: { userId: req.user.id } });
      if (existing) {
        return HTTP_ERRORS.CONFLICT(res, 'Vous appartenez déjà à un foyer');
      }
      const inv = await HouseholdInvite.findOne({
        where: { code: String(code).trim().toUpperCase() },
      });
      if (!inv || new Date(inv.expiresAt) < new Date()) {
        return HTTP_ERRORS.BAD_REQUEST(res, 'Code invalide ou expiré');
      }
      await HouseholdMember.create({
        householdId: inv.householdId,
        userId: req.user.id,
        role: 'member',
      });
      await inv.destroy();
      await logAudit(req.user.id, 'create', 'HouseholdMember', inv.householdId, { joined: true });
      return sendSuccess(res, 200, { householdId: inv.householdId }, 'Vous avez rejoint le foyer');
    } catch (err) {
      console.error('❌ join household:', err);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur adhésion');
    }
  },
};

module.exports = householdController;
