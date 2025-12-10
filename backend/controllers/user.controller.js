// Modèles Firestore
const { User: UserModel, PasswordReset: PasswordResetModel } = require('../models/firebase');
// Modèles Sequelize (pour transition, à supprimer plus tard)
// const { User, PasswordReset } = require('../models');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require("path");
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const otpGenerator = require('../utils/otpGenerator');
const FirebaseHelpers = require('../utils/firebaseHelpers');
const cloudinaryService = require('../services/cloudinaryService');

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

      // Vérifier si l'email existe déjà (Firestore)
      const emailExists = await UserModel.emailExists(email);
      if (emailExists) {
        return res.status(400).json({ message: "Email déjà utilisé" });
      }

      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Gérer l'avatar avec Cloudinary
      let avatarUrl = null;
      let avatarPublicId = null;

      if (req.file) {
        try {
          // Générer un UUID temporaire pour l'upload (sera remplacé par le vrai userId après création)
          const tempUserId = uuidv4();
          const uploadResult = await cloudinaryService.uploadAvatar(req.file, tempUserId);
          avatarUrl = uploadResult.url;
          avatarPublicId = uploadResult.publicId;

          // Supprimer le fichier local après upload vers Cloudinary
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (uploadError) {
          console.error('❌ Erreur upload avatar Cloudinary:', uploadError);
          // Supprimer le fichier local en cas d'erreur
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          // Ne pas bloquer l'inscription si l'upload échoue
          console.warn('⚠️  Inscription continuée sans avatar');
        }
      }

      // Version actuelle des politiques (à mettre à jour si les politiques changent)
      const CONSENT_VERSION = '1.0';

      // Création user avec Firestore (retourne l'UUID)
      const userId = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        avatar: avatarUrl,
        // Champs RGPD
        consentPrivacyPolicy: consentPrivacyPolicy === true || consentPrivacyPolicy === 'true',
        consentTermsOfService: consentTermsOfService === true || consentTermsOfService === 'true',
        consentVersion: CONSENT_VERSION
      });

      // Si l'avatar a été uploadé avec un tempUserId, le renommer avec le vrai userId
      if (avatarPublicId && avatarPublicId.includes('temp')) {
        // Optionnel : renommer le fichier sur Cloudinary (peut être fait plus tard si nécessaire)
        // Pour l'instant, on garde le public_id généré
      }

      // Récupérer l'utilisateur créé pour la réponse
      const user = await UserModel.findById(userId);
      const formattedUser = FirebaseHelpers.formatDocument(user);

      res.status(201).json({
        code: 201, 
        data: {
          id: formattedUser.id, // UUID
          name: formattedUser.name,
          email: formattedUser.email,
          avatar: formattedUser.avatar
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
  
      // Vérifier si l'email existe (Firestore)
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
  
      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Mot de passe incorrect" });
      }
  
      // Génération du token JWT (avec l'UUID comme id)
      const token = jwt.sign(
        { id: user.id, email: user.email }, // user.id est maintenant un UUID
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
  
      // Formater l'utilisateur pour la réponse
      const formattedUser = FirebaseHelpers.formatDocument(user);

      res.status(200).json({
        code: 200,
        message: "Connexion réussie",
        token,
        user: { 
          id: formattedUser.id, // UUID
          name: formattedUser.name, 
          email: formattedUser.email, 
          avatar: formattedUser.avatar 
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
      // req.user.id contient maintenant l'UUID (depuis le JWT)
      const user = await UserModel.findById(req.user.id);
  
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Formater et ne retourner que les champs nécessaires
      const formattedUser = FirebaseHelpers.formatDocument(user);
      const userData = {
        id: formattedUser.id, // UUID
        name: formattedUser.name,
        email: formattedUser.email,
        avatar: formattedUser.avatar
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
      // Récupérer l'utilisateur avec Firestore (req.user.id est l'UUID)
      const user = await UserModel.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Aucune image fournie" });
      }

      // Supprimer l'ancien avatar s'il existe
      if (user.avatar) {
        if (cloudinaryService.isCloudinaryUrl(user.avatar)) {
          // Supprimer l'ancien avatar de Cloudinary
          try {
            await cloudinaryService.deleteAvatarByUrl(user.avatar);
          } catch (deleteError) {
            console.warn('⚠️  Erreur suppression ancien avatar Cloudinary:', deleteError.message);
            // Continuer même si la suppression échoue
          }
        } else {
          // Ancien système local (migration)
          const oldAvatarPath = path.join(__dirname, '..', 'public', user.avatar);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        }
      }

      // Uploader le nouvel avatar vers Cloudinary
      let avatarUrl;
      try {
        const uploadResult = await cloudinaryService.uploadAvatar(req.file, req.user.id);
        avatarUrl = uploadResult.url;

        // Supprimer le fichier local après upload vers Cloudinary
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadError) {
        console.error('❌ Erreur upload avatar Cloudinary:', uploadError);
        // Supprimer le fichier local en cas d'erreur
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ 
          message: "Erreur lors de l'upload de l'avatar", 
          error: uploadError.message 
        });
      }
      
      // Mise à jour de l'avatar avec Firestore
      await UserModel.update(req.user.id, { avatar: avatarUrl });

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

      // Vérifier si l'utilisateur existe (Firestore)
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
        return res.status(200).json({ 
          message: "Si cet email existe dans notre système, vous recevrez un code de vérification" 
        });
      }

      // Supprimer les anciens codes OTP pour cet email (Firestore)
      await PasswordResetModel.deleteByEmail(email);

      // Générer un nouveau code OTP
      const otpCode = otpGenerator.generateValidOTP();
      const hashedOTP = await otpGenerator.hashOTP(otpCode);
      const expiresAt = otpGenerator.getExpiryDate();

      // Sauvegarder le code OTP en base (Firestore)
      await PasswordResetModel.create({
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
        await PasswordResetModel.deleteByEmail(email);
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

      // Trouver le code OTP en base (Firestore - trouve automatiquement le plus récent)
      const passwordReset = await PasswordResetModel.findLatestByEmail(email);

      if (!passwordReset) {
        return res.status(400).json({ message: "Code OTP invalide ou expiré" });
      }

      // Vérifier si le code est expiré (utilise la méthode du modèle)
      if (PasswordResetModel.isExpired(passwordReset)) {
        // Supprimer le code expiré
        const { db } = require('../config/firebase');
        await db.collection('passwordResets').doc(passwordReset.id).delete();
        return res.status(400).json({ message: "Code OTP expiré. Veuillez en demander un nouveau." });
      }

      // Vérifier le code OTP
      const isOTPValid = await otpGenerator.verifyOTP(otp, passwordReset.otp_code);
      if (!isOTPValid) {
        return res.status(400).json({ message: "Code OTP incorrect" });
      }

      // Marquer le code comme utilisé (Firestore)
      await PasswordResetModel.markAsUsed(passwordReset.id);

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

      // Vérifier que l'utilisateur existe (Firestore)
      const user = await UserModel.findByEmail(decodedToken.email);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Valider le nouveau mot de passe
      if (new_password.length < 6) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Mettre à jour le mot de passe (Firestore)
      await UserModel.update(user.id, { password: hashedPassword });

      // Supprimer tous les codes OTP pour cet email (Firestore)
      await PasswordResetModel.deleteByEmail(decodedToken.email);

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
      const userId = req.user.id; // UUID de l'utilisateur

      // Récupérer l'utilisateur
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Récupérer toutes les tâches de l'utilisateur
      const { Task: TaskModel } = require('../models/firebase');
      const tasks = await TaskModel.findByUserId(userId);

      // Récupérer les codes OTP (si nécessaire)
      const { PasswordReset: PasswordResetModel } = require('../models/firebase');
      const { db } = require('../config/firebase');
      const passwordResetsSnapshot = await db.collection('passwordResets')
        .where('email', '==', user.email)
        .get();
      
      const passwordResets = passwordResetsSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
        createdAt: doc.data().createdAt,
        expires_at: doc.data().expires_at,
        used: doc.data().used
      }));

      // Formater les données pour l'export
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          consentPrivacyPolicy: user.consentPrivacyPolicy,
          consentTermsOfService: user.consentTermsOfService,
          consentDate: FirebaseHelpers.timestampToDate(user.consentDate),
          consentVersion: user.consentVersion,
          createdAt: FirebaseHelpers.timestampToDate(user.createdAt),
          updatedAt: FirebaseHelpers.timestampToDate(user.updatedAt)
        },
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          createdAt: FirebaseHelpers.timestampToDate(task.createdAt),
          updatedAt: FirebaseHelpers.timestampToDate(task.updatedAt)
        })),
        passwordResets: passwordResets.map(reset => ({
          id: reset.id,
          createdAt: FirebaseHelpers.timestampToDate(reset.createdAt),
          expires_at: FirebaseHelpers.timestampToDate(reset.expires_at),
          used: reset.used
        })),
        metadata: {
          totalTasks: tasks.length,
          totalPasswordResets: passwordResets.length,
          format: 'JSON',
          version: '1.0'
        }
      };

      // Marquer la date du dernier export
      await UserModel.updateLastDataExport(userId);

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

      // Utiliser la même méthode que exportMyData
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const { Task: TaskModel } = require('../models/firebase');
      const tasks = await TaskModel.findByUserId(userId);

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
          createdAt: FirebaseHelpers.timestampToDate(task.createdAt)
        }))
      };

      // Marquer la date du dernier export
      await UserModel.updateLastDataExport(userId);

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
      const userId = req.user.id; // UUID de l'utilisateur

      // Récupérer l'utilisateur pour vérifier qu'il existe
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      // Supprimer toutes les tâches de l'utilisateur
      const { Task: TaskModel } = require('../models/firebase');
      await TaskModel.deleteByUserId(userId);

      // Supprimer tous les codes OTP associés
      const { PasswordReset: PasswordResetModel } = require('../models/firebase');
      await PasswordResetModel.deleteByEmail(user.email);

      // Supprimer l'avatar (Cloudinary ou local)
      if (user.avatar) {
        if (cloudinaryService.isCloudinaryUrl(user.avatar)) {
          // Supprimer l'avatar de Cloudinary
          try {
            await cloudinaryService.deleteAvatarByUrl(user.avatar);
          } catch (deleteError) {
            console.warn('⚠️  Erreur suppression avatar Cloudinary:', deleteError.message);
            // Continuer même si la suppression échoue
          }
        } else {
          // Ancien système local (migration)
          const oldAvatarPath = path.join(__dirname, '..', 'public', user.avatar);
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        }
      }

      // Supprimer l'utilisateur
      await UserModel.delete(userId);

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