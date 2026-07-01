import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isAuthenticated } from "./middlewares/isAuthenticated.js";
import { container } from "../../core/DIContainer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/msg", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "../../../public/views/messages.html"));
});

/**
 * @openapi
 * /commands:
 *   get:
 *     summary: Retrieve current command hierarchy trees filtered by session privileges
 *     tags:
 *       - Chat
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Returns a nested object structure representing available bot commands.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *       500:
 *         description: Failed to read commands path structure or serialize.
 */
router.get("/commands", container.chatController.getCommands);

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Retrieve active connected WS client username list
 *     tags:
 *       - Chat
 *     responses:
 *       200:
 *         description: Array of currently connected usernames.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: "Gabriel"
 *       500:
 *         description: Internal operational error.
 */
router.get("/users", container.chatController.getUsers);

export default router;