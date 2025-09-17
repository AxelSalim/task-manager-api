const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configuration pour différents fournisseurs d'email
    const emailConfig = {
      // Gmail
      gmail: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS // Mot de passe d'application pour Gmail
        }
      },
      // Outlook/Hotmail
      outlook: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      },
      // SMTP personnalisé
      custom: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      }
    };

    const provider = process.env.EMAIL_PROVIDER || 'gmail';
    this.transporter = nodemailer.createTransporter(emailConfig[provider]);
  }

  // Vérifier la configuration email
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Configuration email vérifiée avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur de configuration email:', error.message);
      return false;
    }
  }

  // Envoyer un email de réinitialisation de mot de passe
  async sendPasswordResetEmail(email, otpCode, userName = 'Utilisateur') {
    const mailOptions = {
      from: {
        name: 'Task Manager',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe',
      html: this.generatePasswordResetTemplate(userName, otpCode)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email de réinitialisation envoyé à ${email}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
      throw new Error('Impossible d\'envoyer l\'email de réinitialisation');
    }
  }

  // Template HTML pour l'email de réinitialisation
  generatePasswordResetTemplate(userName, otpCode) {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 10px;
            }
            .otp-code {
                background: #f8f9fa;
                border: 2px dashed #007bff;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 25px 0;
            }
            .otp-number {
                font-size: 32px;
                font-weight: bold;
                color: #007bff;
                letter-spacing: 5px;
                font-family: 'Courier New', monospace;
            }
            .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
            .button {
                display: inline-block;
                background: #007bff;
                color: white;
                padding: 12px 25px;
                text-decoration: none;
                border-radius: 5px;
                margin: 15px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📋 Task Manager</div>
                <h1>Réinitialisation de mot de passe</h1>
            </div>
            
            <p>Bonjour <strong>${userName}</strong>,</p>
            
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code de vérification ci-dessous pour continuer :</p>
            
            <div class="otp-code">
                <p style="margin: 0 0 10px 0; font-weight: bold;">Votre code de vérification :</p>
                <div class="otp-number">${otpCode}</div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Important :</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Ce code est valide pendant <strong>15 minutes</strong> seulement</li>
                    <li>Ne partagez jamais ce code avec d'autres personnes</li>
                    <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                </ul>
            </div>
            
            <p>Si vous rencontrez des problèmes, contactez notre support technique.</p>
            
            <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                <p>&copy; ${new Date().getFullYear()} Task Manager. Tous droits réservés.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Envoyer un email de confirmation de changement de mot de passe
  async sendPasswordChangedConfirmation(email, userName = 'Utilisateur') {
    const mailOptions = {
      from: {
        name: 'Task Manager',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '✅ Mot de passe modifié avec succès',
      html: this.generatePasswordChangedTemplate(userName)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email de confirmation envoyé à ${email}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de confirmation:', error);
      // Ne pas faire échouer le processus pour l'email de confirmation
      return { success: false, error: error.message };
    }
  }

  // Template HTML pour l'email de confirmation
  generatePasswordChangedTemplate(userName) {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mot de passe modifié</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #28a745;
                margin-bottom: 10px;
            }
            .success-icon {
                font-size: 48px;
                color: #28a745;
                margin: 20px 0;
            }
            .info-box {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #155724;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📋 Task Manager</div>
                <div class="success-icon">✅</div>
                <h1>Mot de passe modifié avec succès</h1>
            </div>
            
            <p>Bonjour <strong>${userName}</strong>,</p>
            
            <p>Votre mot de passe a été modifié avec succès le <strong>${new Date().toLocaleString('fr-FR')}</strong>.</p>
            
            <div class="info-box">
                <strong>🔒 Sécurité :</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Votre compte est maintenant protégé par votre nouveau mot de passe</li>
                    <li>Si vous n'avez pas effectué cette modification, contactez immédiatement notre support</li>
                    <li>Nous vous recommandons d'utiliser un mot de passe unique et fort</li>
                </ul>
            </div>
            
            <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
            
            <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                <p>&copy; ${new Date().getFullYear()} Task Manager. Tous droits réservés.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

module.exports = new EmailService();
