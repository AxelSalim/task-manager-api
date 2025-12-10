const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Utiliser HTTPS
});

// Vérifier la configuration
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  console.log('✅ Cloudinary configuré avec succès');
  console.log(`📸 Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
} else {
  console.warn('⚠️  Configuration Cloudinary incomplète. Vérifiez vos variables d\'environnement.');
}

module.exports = cloudinary;
