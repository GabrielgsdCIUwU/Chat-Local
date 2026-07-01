import express from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const router = express.Router();

/**
 * Swagger OpenAPI configuration options.
 * @type {import('swagger-jsdoc').Options}
 */
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "ChatGSD Local API Backend",
            version: "1.0.0",
            description: "API specifications and local real-time microservices documentation for the Chat-Local RPG backend platform.",
        },
        servers: [
            {
                url: "/",
                description: "Automatic Active Origin (Default Host)"
            }
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "connect.sid",
                    description: "Express session cookie used for validating user access states."
                }
            }
        }
    },
    apis: [
        "./backend/api/router/admin.js",
        "./backend/api/router/chat.js",
        "./backend/api/router/img.js",
        "./backend/api/router/perfil.js"
    ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;