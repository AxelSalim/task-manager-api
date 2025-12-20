require("dotenv").config();
const path = require("path");

// Chemin vers le dossier data (à la racine du projet)
const dataDir = path.join(__dirname, "..", "..", "data");
const dbPath = path.join(dataDir, "task-manager.db");
const dbTestPath = path.join(dataDir, "task-manager-test.db");

module.exports = {
  development: {
    dialect: "sqlite",
    storage: dbPath,
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
    },
  },
  test: {
    dialect: "sqlite",
    storage: dbTestPath,
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
    },
  },
  production: {
    dialect: "sqlite",
    storage: dbPath,
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
    },
  },
};

