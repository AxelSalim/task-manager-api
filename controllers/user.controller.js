const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require("path");
const fs = require('fs');

const UserController = {

  // S'inscrire
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: "Email déjà utilisé" });
      }

      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
      const avatarUrl = req.file
      ? `/uploads/images/users/${req.file.filename}`
      : null;

      // Création user
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        avatar: avatarUrl
      });

      res.status(200).json({code: 200, data:user, message: "Utilisateur créé avec succès" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },

  // Se connecter
  async login(req, res) {
    try {
      const { email, password } = req.body;
  
      // je vérifie si l'email existe
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
  
      // je vérifie le mot de passe
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
        user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },

  // Récupérer les informations User
  async getMe(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ["id", "username", "email", "avatar"],
      });
  
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
  
      res.status(200).json({ code:200, data: user, message: ""});
    } catch (error) {
      console.error(error);
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
        const oldAvatarPath = path.join(__dirname, '..', 'public', user.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      const avatarUrl = `/uploads/images/users/${req.file.filename}`;
      
      // Mise à jour de l'avatar
      await user.update({ avatar: avatarUrl });

      res.status(200).json({ 
        code: 200, 
        data: { avatar: avatarUrl }, 
        message: "Avatar mis à jour avec succès" 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'avatar" });
    }
  }
};

module.exports = UserController;