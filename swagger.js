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
      // Dùng URL tương đối, Swagger sẽ tự xác định URL base
      servers: [{ url: "/" }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
    },
    apis: ["./routes/*.js"], // đường dẫn tới file routes
  };

  const swaggerDocs = swaggerJsDoc(swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

module.exports = setupSwagger;
