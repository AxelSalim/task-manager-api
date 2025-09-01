const express = require("express")
const authMiddleware = require("../middlewares/authmiddleware")
const taskController = require("../controllers/task.controller")
const router = express.Router();


/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Récupérer toutes les tâches de l'utilisateur connecté
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des tâches récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   dueDate:
 *                     type: string
 *                     format: date
 *                   userId:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Non autorisé, token manquant ou invalide
 */
router.get("/", authMiddleware, taskController.getTasks);          // Récupérer toutes les tâches de l'utilisateur

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Récupérer une tâche précise
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tâche à récupérer
 *     responses:
 *       200:
 *         description: Tâche récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 dueDate:
 *                   type: string
 *                   format: date
 *                 userId:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Requête invalide
 *       401:
 *         description: Non autorisé, token manquant ou invalide
 *       404:
 *         description: Tâche non trouvée
 */
router.get("/:id", authMiddleware, taskController.getTaskById);    // Récupérer une tâche précise

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Mettre à jour une tâche
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tâche à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Tâche mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 dueDate:
 *                   type: string
 *                   format: date
 *                 userId:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Requête invalide
 *       401:
 *         description: Non autorisé, token manquant ou invalide
 *       404:
 *         description: Tâche non trouvée
 */
router.put("/:id", authMiddleware, taskController.updateTask);     // Mettre à jour une tâche

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Créer une nouvelle tâche
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Tâche créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 dueDate:
 *                   type: string
 *                   format: date
 *                 userId:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Requête invalide
 *       401:
 *         description: Non autorisé, token manquant ou invalide
 */
router.post("/", authMiddleware, taskController.createTask);       // Créer une tâche

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Supprimer une tâche
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la tâche à supprimer
 *     responses:
 *       200:
 *         description: Tâche supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tâche supprimée avec succès
 *       400:
 *         description: Requête invalide
 *       401:
 *         description: Non autorisé, token manquant ou invalide
 *       404:
 *         description: Tâche non trouvée
 */
router.delete("/:id", authMiddleware, taskController.deleteTask);  // Supprimer une tâche

module.exports = router;