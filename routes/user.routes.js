const express = require("express")
const authMiddleware = require("../middlewares/authmiddleware")
const userController = require("../controllers/user.controller")
const upload = require("../middlewares/upload")
const router = express.Router();


/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Photo de profil (optionnel)
 *     responses:
 *       200:
 *         description: Utilisateur créé avec succès
 */
router.post("/register", upload.single('avatar'), userController.register);       // Inscription

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie, retourne un token JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Identifiants invalides
 */
router.post("/login", userController.login);             // Connexion

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obtenir les informations de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations de l'utilisateur récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 avatar:
 *                   type: string
 *       401:
 *         description: Non autorisé, token manquant ou invalide
 */
router.get("/me", authMiddleware, userController.getMe); // Obtenir les infos de l'utilisateur connecté

/**
 * @swagger
 * /users/updateavatar:
 *   put:
 *     summary: Mettre à jour l'avatar de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatar:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Requête invalide
 *       401:
 *         description: Non autorisé, token manquant ou invalide
 */
router.put("/updateavatar", authMiddleware, upload.single('avatar'), userController.updateAvatar); // Mettre à jour l'avatar

module.exports = router;