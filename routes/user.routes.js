const express = require("express")
const authMiddleware = require("../middlewares/authmiddleware")
const userController = require("../controllers/user.controller")
const upload = require("../middlewares/upload")
const { passwordResetLimiter, otpVerificationLimiter, passwordResetSubmitLimiter, authLimiter } = require("../middlewares/rateLimiter")
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
router.post("/login", authLimiter, userController.login);             // Connexion

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

/**
 * @swagger
 * /users/forgot-password:
 *   post:
 *     summary: Demander la réinitialisation de mot de passe
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
 *                 format: email
 *                 description: Adresse email de l'utilisateur
 *     responses:
 *       200:
 *         description: Code OTP envoyé par email (si l'email existe)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 expiresIn:
 *                   type: string
 *       400:
 *         description: Email manquant
 *       429:
 *         description: Trop de demandes
 *       500:
 *         description: Erreur serveur
 */
router.post("/forgot-password", passwordResetLimiter, userController.forgotPassword); // Demander la réinitialisation

/**
 * @swagger
 * /users/verify-otp:
 *   post:
 *     summary: Vérifier le code OTP
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
 *                 format: email
 *               otp:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 description: Code OTP de 6 chiffres
 *     responses:
 *       200:
 *         description: Code OTP vérifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reset_token:
 *                   type: string
 *                 expiresIn:
 *                   type: string
 *       400:
 *         description: Code OTP invalide ou expiré
 *       429:
 *         description: Trop de tentatives
 *       500:
 *         description: Erreur serveur
 */
router.post("/verify-otp", otpVerificationLimiter, userController.verifyOTP); // Vérifier le code OTP

/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reset_token:
 *                 type: string
 *                 description: Token de réinitialisation obtenu après vérification OTP
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *                 description: Nouveau mot de passe (minimum 6 caractères)
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Token invalide ou mot de passe invalide
 *       404:
 *         description: Utilisateur non trouvé
 *       429:
 *         description: Trop de tentatives
 *       500:
 *         description: Erreur serveur
 */
router.post("/reset-password", passwordResetSubmitLimiter, userController.resetPassword); // Réinitialiser le mot de passe

module.exports = router;