const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Manager API",
      version: "1.0.0",
      description: "API de gestion des tâches et des utilisateurs",
    },
    // servers: [
    //   {
    //     url: "http://localhost:3000/api", // adapte si ton prefix change
    //   },
    // ],
  },
  apis: ["./routes/*.js"], // Où Swagger va chercher les annotations
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = { swaggerUi, swaggerSpec };
