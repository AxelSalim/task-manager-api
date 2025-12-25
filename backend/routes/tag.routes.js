const express = require("express");
const authMiddleware = require("../middlewares/authmiddleware");
const tagController = require("../controllers/tag.controller");
const router = express.Router();

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: Récupérer tous les tags de l'utilisateur connecté
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des tags récupérée avec succès
 */
router.get("/", authMiddleware, tagController.getTags);

/**
 * @swagger
 * /tags/{id}:
 *   get:
 *     summary: Récupérer un tag par son ID
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tag récupéré avec succès
 *       404:
 *         description: Tag introuvable
 */
router.get("/:id", authMiddleware, tagController.getTagById);

/**
 * @swagger
 * /tags:
 *   post:
 *     summary: Créer un nouveau tag
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *                 format: hex
 *                 default: "#3b82f6"
 *     responses:
 *       201:
 *         description: Tag créé avec succès
 *       400:
 *         description: Requête invalide
 *       409:
 *         description: Un tag avec ce nom existe déjà
 */
router.post("/", authMiddleware, tagController.createTag);

/**
 * @swagger
 * /tags/{id}:
 *   put:
 *     summary: Mettre à jour un tag
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *                 format: hex
 *     responses:
 *       200:
 *         description: Tag modifié avec succès
 *       404:
 *         description: Tag introuvable
 *       409:
 *         description: Un tag avec ce nom existe déjà
 */
router.put("/:id", authMiddleware, tagController.updateTag);

/**
 * @swagger
 * /tags/{id}:
 *   delete:
 *     summary: Supprimer un tag
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tag supprimé avec succès
 *       404:
 *         description: Tag introuvable
 */
router.delete("/:id", authMiddleware, tagController.deleteTag);

module.exports = router;



