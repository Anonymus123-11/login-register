const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
    res.send("Welcome");
});

// Routes
app.use("/api/users", userRoutes);

// Swagger Docs (placed here) ---------------------- NEW
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Login-Register API",
      version: "1.0.0",
      description: "API for user authentication with JWT (no annotation)",
    },
    servers: [{ url: "http://localhost:5000" }],
    paths: {
      "/api/users/register": {
        post: {
          summary: "Register a new user",
          responses: { 201: { description: "User registered successfully" } },
        },
      },
      "/api/users/login": {
        post: {
          summary: "Login with username and password",
          responses: { 200: { description: "JWT token returned" } },
        },
      },
      "/api/users/protected": {
        get: {
          summary: "Access protected route",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Access granted" } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [],
};


// MongoDB Atlas connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
