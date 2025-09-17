const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const baseUrl = process.env.NODE_ENV === "production" 
  ? process.env.RENDER_PUBLIC_BASE_URL 
  : process.env.LOCAL_PUBLIC_BASE_URL;

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
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = {
  swaggerUi,
  swaggerDocs
};