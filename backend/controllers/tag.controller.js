// Modèles Sequelize
const { Tag, Task } = require('../models');
const { sendSuccess, sendError, HTTP_ERRORS } = require('../utils/responseHandler');

const TagController = {

  // Récupérer tous les tags de l'utilisateur connecté
  async getTags(req, res) {
    try {
      const tags = await Tag.findAll({
        where: { userId: req.user.id },
        order: [['name', 'ASC']]
      });

      const formattedTags = tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        userId: tag.userId,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt
      }));

      return sendSuccess(res, 200, formattedTags, 'Tags récupérés avec succès');
    } catch (error) {
      console.error('❌ Erreur getTags:', error);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la récupération des tags');
    }
  },

  // Récupérer un tag par son ID
  async getTagById(req, res) {
    try {
      const tag = await Tag.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });

      if (!tag) {
        return HTTP_ERRORS.NOT_FOUND(res, "Tag introuvable");
      }

      const formattedTag = {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        userId: tag.userId,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt
      };

      return sendSuccess(res, 200, formattedTag, 'Tag récupéré avec succès');
    } catch (error) {
      console.error('❌ Erreur getTagById:', error);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la récupération du tag');
    }
  },

  // Créer un nouveau tag
  async createTag(req, res) {
    try {
      const { name, color } = req.body;

      if (!name) {
        return HTTP_ERRORS.BAD_REQUEST(res, "Le nom est obligatoire");
      }

      // Vérifier si un tag avec le même nom existe déjà pour cet utilisateur
      const existingTag = await Tag.findOne({
        where: {
          userId: req.user.id,
          name: name.trim()
        }
      });

      if (existingTag) {
        return HTTP_ERRORS.CONFLICT(res, "Un tag avec ce nom existe déjà");
      }

      // Valider la couleur si fournie
      const tagColor = color || '#3b82f6';
      if (!/^#[0-9A-F]{6}$/i.test(tagColor)) {
        return HTTP_ERRORS.BAD_REQUEST(res, "La couleur doit être au format hexadécimal (#RRGGBB)");
      }

      // Créer le tag
      const tag = await Tag.create({
        name: name.trim(),
        color: tagColor,
        userId: req.user.id
      });

      const formattedTag = {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        userId: tag.userId,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt
      };

      return sendSuccess(res, 201, formattedTag, 'Tag créé avec succès');
    } catch (error) {
      console.error('❌ Erreur createTag:', error);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la création du tag');
    }
  },

  // Mettre à jour un tag
  async updateTag(req, res) {
    try {
      const { name, color } = req.body;

      // Vérifier que le tag existe et appartient à l'utilisateur
      const tag = await Tag.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });

      if (!tag) {
        return HTTP_ERRORS.NOT_FOUND(res, "Tag introuvable");
      }

      // Vérifier si un autre tag avec le même nom existe déjà (si le nom change)
      if (name && name.trim() !== tag.name) {
        const existingTag = await Tag.findOne({
          where: {
            userId: req.user.id,
            name: name.trim(),
            id: { [require('sequelize').Op.ne]: tag.id }
          }
        });

        if (existingTag) {
          return HTTP_ERRORS.CONFLICT(res, "Un tag avec ce nom existe déjà");
        }
      }

      // Valider la couleur si fournie
      if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
        return HTTP_ERRORS.BAD_REQUEST(res, "La couleur doit être au format hexadécimal (#RRGGBB)");
      }

      // Mettre à jour le tag
      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (color !== undefined) updateData.color = color;

      await tag.update(updateData);

      const formattedTag = {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        userId: tag.userId,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt
      };

      return sendSuccess(res, 200, formattedTag, 'Tag modifié avec succès');
    } catch (error) {
      console.error('❌ Erreur updateTag:', error);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la mise à jour du tag');
    }
  },

  // Supprimer un tag
  async deleteTag(req, res) {
    try {
      // Vérifier que le tag existe et appartient à l'utilisateur
      const tag = await Tag.findOne({
        where: {
          id: req.params.id,
          userId: req.user.id
        }
      });

      if (!tag) {
        return HTTP_ERRORS.NOT_FOUND(res, "Tag introuvable");
      }

      // Supprimer le tag (les relations dans TaskTags seront supprimées automatiquement grâce à CASCADE)
      await tag.destroy();

      return sendSuccess(res, 200, null, 'Tag supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur deleteTag:', error);
      return HTTP_ERRORS.INTERNAL_SERVER_ERROR(res, 'Erreur lors de la suppression du tag');
    }
  }
};

module.exports = TagController;



