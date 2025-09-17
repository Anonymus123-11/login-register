// config/swagger.js
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

function setupSwagger(app) {
  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Login-Register API",
        version: "1.0.0",
        description: "API for user authentication with JWT",
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
      servers: [
        { url: process.env.LOCAL_PUBLIC_BASE_URL, description: "Local server" },
        { url: process.env.RENDER_PUBLIC_BASE_URL, description: "Render server" },
      ],
    },
    apis: ["./routes/*.js"],
  };

  const swaggerDocs = swaggerJsDoc(swaggerOptions);

  // Không cần middleware để set servers nữa
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

module.exports = setupSwagger;
