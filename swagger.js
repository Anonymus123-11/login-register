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
      servers: [
        {
          url: "http://localhost:5000",
          description: "Local server"
        },
        {
          url: "https://login-register-dtsi.onrender.com",
          description: "Production server (Render)"
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
    },
    apis: ["./routes/*.js"],
  };

  const swaggerDocs = swaggerJsDoc(swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

module.exports = setupSwagger;
