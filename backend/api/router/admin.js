import express from "express";
import { container } from "../../core/DIContainer.js";
import { isAuthenticated } from "./middlewares/isAuthenticated.js";
import { isAdmin } from "./middlewares/isAdmin.js";

const router = express.Router();

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Authenticate user credentials and open session
 *     tags:
 *       - Authentication
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - passwd
 *             properties:
 *               name:
 *                 type: string
 *                 description: Registered username.
 *                 example: "Gabriel"
 *               passwd:
 *                 type: string
 *                 description: Plain text user credentials password.
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login operation completed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login exitoso!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     color:
 *                       type: string
 *       400:
 *         description: Missing fields or unable to locate local IP reference.
 *       401:
 *         description: Invalid username or password credentials mismatch.
 *       403:
 *         description: Access forbidden due to active client IP blacklist parameters.
 */
router.post("/login", container.authController.login);

/**
 * @openapi
 * /register:
 *   post:
 *     summary: Create and persist a new user identity
 *     tags:
 *       - Authentication
 *       - Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - passwd
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 16
 *                 example: "Alex"
 *               passwd:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 64
 *                 example: "securePass"
 *     responses:
 *       200:
 *         description: Identity successfully created.
 *       400:
 *         description: Username already exists, validation constraints failed, or bad payload.
 */
router.post("/register", container.authController.register);

/**
 * @openapi
 * /list/users:
 *   get:
 *     summary: Retrieve a plain array of all registered usernames
 *     tags:
 *       - Authentication
 *       - Admin
 *     responses:
 *       200:
 *         description: Plain list of usernames.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: "Gabriel"
 *       500:
 *         description: Database error or internal failure.
 */
router.get("/list/users", container.authController.listUsers);

/**
 * @openapi
 * /list/users/roles:
 *   post:
 *     summary: Update target user authorization roles (Admin Only)
 *     tags:
 *       - Admin
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetUser
 *               - roles
 *             properties:
 *               targetUser:
 *                 type: string
 *                 example: "Alex"
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Donador", "Admin"]
 *     responses:
 *       200:
 *         description: Security roles updated successfully.
 *       400:
 *         description: Missing properties, forbidden self-demotion, or invalid roles provided.
 *       401:
 *         description: Unauthenticated session.
 *       403:
 *         description: Unauthorized. Missing Admin privileges.
 */
router.post("/list/users/roles", isAuthenticated, isAdmin, container.authController.assignRoles);

export default router;
