const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");
const { swaggerUi, swaggerSpec } = require('./swagger');
require("dotenv").config();

var corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://192.168.1.3:3000",
    "http://192.168.1.14:3000",
    "http://127.0.0.1:5500"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, "uploads")));


// Routes
const userRoutes = require("./routes/user.routes");
const taskRoutes = require("./routes/task.routes");


app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

module.exports = app;