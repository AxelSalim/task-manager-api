// Modèles Sequelize
const { User, PasswordReset, Task } = require('../models');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require("path");
const fs = require('fs');
const emailService = require('../services/emailService');
const otpGenerator = require('../utils/otpGenerator');
const storageService = require('../services/storageService');

const UserController = {

  // S'inscrire
  async register(req, res) {
    try {
      const { name, email, password, consentPrivacyPolicy, consentTermsOfService } = req.body;

      // Validation des champs requis
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Tous les champs sont obligatoires" });
      }

      // Validation du consentement RGPD (obligatoire)
      if (!consentPrivacyPolicy || !consentTermsOfService) {
        return res.status(400).json({ 
          message: "Vous devez accepter la politique de confidentialité et les conditions d'utilisation" 
        });
      }

      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "Email déjà utilisé" });
      }

      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Version actuelle des politiques
      const CONSENT_VERSION = '1.0';

      // Création user avec Sequelize (sans avatar d'abord)
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        avatar: null,
        // Champs RGPD (à ajouter dans une migration plus tard si nécessaire)
        // consentPrivacyPolicy: consentPrivacyPolicy === true || consentPrivacyPolicy === 'true',
        // consentTermsOfService: consentTermsOfService === true || consentTermsOfService === 'true',
        // consentVersion: CONSENT_VERSION
      });

      // Gérer l'avatar avec stockage local (après création de l'utilisateur pour avoir l'ID)
      let avatarUrl = null;

      if (req.file) {
        try {
          // Uploader l'avatar avec l'ID de l'utilisateur
          const uploadResult = await storageService.uploadAvatar(req.file, user.id);
          avatarUrl = uploadResult.url;

          // Mettre à jour l'utilisateur avec l'URL de l'avatar
          await user.update({ avatar: avatarUrl });
        } catch (uploadError) {
          console.error('❌ Erreur upload avatar:', uploadError);
          // Ne pas bloquer l'inscription si l'upload échoue
          console.warn('⚠️  Inscription continuée sans avatar');
        }
      }

      res.status(201).json({
        code: 201, 
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }, 
        message: "Utilisateur créé avec succès" 
      });
    } catch (error) {
      console.error('❌ Erreur register:', error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  },

  // Se connecter
  async login(req, res) {
    try {
      const { email, password } = req.body;
  
      // Vérifier si l'email existe
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
  
      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Mot de passe incorrect" });
      }
  
      // Génération du token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(200).json({
        code: 200,
        message: "Connexion réussie",
        token,
        user: { 
          id: user.id,
          name: user.name, 
          email: user.email, 
          avatar: user.avatar 
        },
      });
    } catch (error) {
      console.error('❌ Erreur login:', error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },

  // Récupérer les informations User
  async getMe(req, res) {
    try {
      const user = await User.findByPk(req.user.id);
  
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      };
  
      res.status(200).json({ code: 200, data: userData, message: "" });
    } catch (error) {
      console.error('❌ Erreur getMe:', error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },

  // Mettre à jour l'avatar de l'utilisateur
  async updateAvatar(req, res) {
    try {
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Aucune image fournie" });
      }

      // Supprimer l'ancien avatar s'il existe
      if (user.avatar) {
        try {
          await storageService.deleteAvatar(user.avatar);
        } catch (deleteError) {
          console.warn('⚠️  Erreur suppression ancien avatar:', deleteError.message);
          // Continuer même si la suppression échoue
        }
      }

      // Uploader le nouvel avatar vers le stockage local
      let avatarUrl;
      try {
        const uploadResult = await storageService.uploadAvatar(req.file, req.user.id);
        avatarUrl = uploadResult.url;
      } catch (uploadError) {
        console.error('❌ Erreur upload avatar:', uploadError);
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ 
          message: "Erreur lors de l'upload de l'avatar", 
          error: uploadError.message 
        });
      }
      
      // Mise à jour de l'avatar
      await user.update({ avatar: avatarUrl });

      res.status(200).json({ 
        code: 200, 
        data: { avatar: avatarUrl }, 
        message: "Avatar mis à jour avec succès" 
      });
    } catch (error) {
      console.error('❌ Erreur updateAvatar:', error);
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'avatar" });
    }
  },

  // Demander la réinitialisation de mot de passe
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      // Validation de l'email
      if (!email) {
        return res.status(400).json({ message: "L'email est obligatoire" });
      }

      // Vérifier si l'utilisateur existe
      const user = await User.findOne({ where: { email } });
      if (!user) {
        // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
        return res.status(200).json({ 
          message: "Si cet email existe dans notre système, vous recevrez un code de vérification" 
        });
      }

      // Supprimer les anciens codes OTP pour cet email
      await PasswordReset.destroy({ where: { email } });

      // Générer un nouveau code OTP
      const otpCode = otpGenerator.generateValidOTP();
      const hashedOTP = await otpGenerator.hashOTP(otpCode);
      const expiresAt = otpGenerator.getExpiryDate();

      // Sauvegarder le code OTP en base
      await PasswordReset.create({
        email,
        otp_code: hashedOTP,
        expires_at: expiresAt
      });

      // Envoyer l'email avec le code OTP
      try {
        await emailService.sendPasswordResetEmail(email, otpCode, user.name);
        console.log(`📧 Code OTP envoyé à ${email}: ${otpCode}`);
      } catch (emailError) {
        console.error('❌ Erreur envoi email:', emailError);
        // Supprimer le code OTP si l'email n'a pas pu être envoyé
        await PasswordReset.destroy({ where: { email } });
        return res.status(500).json({ 
          message: "Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard." 
        });
      }

      res.status(200).json({ 
        message: "Si cet email existe dans notre système, vous recevrez un code de vérification",
        expiresIn: "15 minutes"
      });

    } catch (error) {
      console.error('❌ Erreur forgotPassword:', error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  },

  // Vérifier le code OTP
  async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;

      // Validation des champs
      if (!email || !otp) {
        return res.status(400).json({ message: "L'email et le code OTP sont obligatoires" });
      }

      // Vérifier le format du code OTP
      if (!otpGenerator.validateOTPFormat(otp)) {
        return res.status(400).json({ message: "Le code OTP doit contenir exactement 6 chiffres" });
      }

      // Trouver le code OTP le plus récent pour cet email
      const passwordReset = await PasswordReset.findOne({
        where: { email },
        order: [['createdAt', 'DESC']]
      });

      if (!passwordReset) {
        return res.status(400).json({ message: "Code OTP invalide ou expiré" });
      }

      // Vérifier si le code est expiré
      if (passwordReset.isExpired()) {
        // Supprimer le code expiré
        await passwordReset.destroy();
        return res.status(400).json({ message: "Code OTP expiré. Veuillez en demander un nouveau." });
      }

      // Vérifier le code OTP
      const isOTPValid = await otpGenerator.verifyOTP(otp, passwordReset.otp_code);
      if (!isOTPValid) {
        return res.status(400).json({ message: "Code OTP incorrect" });
      }

      // Marquer le code comme utilisé
      await passwordReset.markAsUsed();

      // Générer un token de réinitialisation temporaire
      const resetToken = otpGenerator.generateResetToken(email);

      res.status(200).json({
        message: "Code OTP vérifié avec succès",
        reset_token: resetToken,
        expiresIn: "30 minutes"
      });

    } catch (error) {
      console.error('❌ Erreur verifyOTP:', error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  },

  // Réinitialiser le mot de passe
  async resetPassword(req, res) {
    try {
      const { reset_token, new_password } = req.body;

      // Validation des champs
      if (!reset_token || !new_password) {
        return res.status(400).json({ message: "Le token et le nouveau mot de passe sont obligatoires" });
      }

      // Vérifier le token de réinitialisation
      const decodedToken = otpGenerator.verifyResetToken(reset_token);
      if (!decodedToken || decodedToken.type !== 'password_reset') {
        return res.status(400).json({ message: "Token de réinitialisation invalide ou expiré" });
      }

      // Vérifier que l'utilisateur existe
      const user = await User.findOne({ where: { email: decodedToken.email } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Valider le nouveau mot de passe
      if (new_password.length < 6) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Mettre à jour le mot de passe
      await user.update({ password: hashedPassword });

      // Supprimer tous les codes OTP pour cet email
      await PasswordReset.destroy({ where: { email: decodedToken.email } });

      // Envoyer un email de confirmation
      try {
        await emailService.sendPasswordChangedConfirmation(decodedToken.email, user.name);
      } catch (emailError) {
        console.error('❌ Erreur envoi email de confirmation:', emailError);
        // Ne pas faire échouer le processus pour l'email de confirmation
      }

      res.status(200).json({
        message: "Mot de passe réinitialisé avec succès"
      });

    } catch (error) {
      console.error('❌ Erreur resetPassword:', error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  },

  // RGPD - Droit d'accès : Exporter toutes les données de l'utilisateur
  async exportMyData(req, res) {
    try {
      const userId = req.user.id;

      // Récupérer l'utilisateur
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Récupérer toutes les tâches de l'utilisateur
      const tasks = await Task.findAll({ where: { userId } });

      // Récupérer les codes OTP
      const passwordResets = await PasswordReset.findAll({ where: { email: user.email } });

      // Formater les données pour l'export
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt
        })),
        passwordResets: passwordResets.map(reset => ({
          id: reset.id,
          createdAt: reset.createdAt,
          expires_at: reset.expires_at,
          used: reset.used
        })),
        metadata: {
          totalTasks: tasks.length,
          totalPasswordResets: passwordResets.length,
          format: 'JSON',
          version: '1.0'
        }
      };

      res.status(200).json({
        code: 200,
        data: exportData,
        message: "Données exportées avec succès"
      });
    } catch (error) {
      console.error('❌ Erreur exportMyData:', error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  },

  // RGPD - Droit à la portabilité : Exporter les données dans un format portable
  async exportMyDataPortable(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const tasks = await Task.findAll({ where: { userId } });

      const exportData = {
        format: 'portable',
        version: '1.0',
        exportDate: new Date().toISOString(),
        user: {
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        tasks: tasks.map(task => ({
          title: task.title,
          status: task.status,
          createdAt: task.createdAt
        }))
      };

      // Retourner en format JSON téléchargeable
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="my-data-${userId}.json"`);
      res.status(200).json(exportData);
    } catch (error) {
      console.error('❌ Erreur exportMyDataPortable:', error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  },

  // RGPD - Droit à l'effacement : Supprimer complètement le compte et toutes les données
  async deleteMyAccount(req, res) {
    try {
      const userId = req.user.id;

      // Récupérer l'utilisateur pour vérifier qu'il existe
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Supprimer toutes les tâches de l'utilisateur
      await Task.destroy({ where: { userId } });

      // Supprimer tous les codes OTP associés
      await PasswordReset.destroy({ where: { email: user.email } });

      // Supprimer l'avatar
      if (user.avatar) {
        try {
          await storageService.deleteAvatar(user.avatar);
        } catch (deleteError) {
          console.warn('⚠️  Erreur suppression avatar:', deleteError.message);
          // Continuer même si la suppression échoue
        }
      }

      // Supprimer l'utilisateur
      await user.destroy();

      res.status(200).json({
        code: 200,
        message: "Compte et toutes les données associées supprimés avec succès"
      });
    } catch (error) {
      console.error('❌ Erreur deleteMyAccount:', error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  }
};

module.exports = UserController;
