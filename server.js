require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Default route
app.get("/", (req, res) => res.send("Welcome to Login-Register API 🚀"));

// Routes
app.use("/api/users", userRoutes);

// ✅ Detect baseUrl dựa trên NODE_ENV
let baseUrl;
if (process.env.NODE_ENV === "production") {
  baseUrl = process.env.RENDER_PUBLIC_BASE_URL;
} else {
  baseUrl = process.env.LOCAL_PUBLIC_BASE_URL;
}

// Swagger options
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Login-Register API",
      version: "1.0.0",
      description: "API for user authentication with JWT",
    },
    servers: [{ url: baseUrl }],
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
  apis: ["./routes/*.js"], // 🔑 đọc annotation trong routes
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📖 Swagger Docs: http://localhost:${PORT}/api-docs`);
});
