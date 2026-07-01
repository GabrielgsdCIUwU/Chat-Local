import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import multer from "multer";

import { container } from "../../core/DIContainer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);   
const profileDir = path.join(__dirname, "../../../resources/profiles");     

const router = express.Router();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(profileDir)) {
            fs.mkdirSync(profileDir, { recursive: true });
        }
        cb(null, profileDir);
    },
    filename: (req, file, cb) => {
        const extensionFile = path.extname(file.originalname);
        cb(null, `${req.session.user.name}_profile${extensionFile}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Formato de imagen no válido"), false);
    }
};

const upload = multer({ storage, fileFilter });

/**
 * @openapi
 * /perfil/datos:
 *   get:
 *     summary: Retrieve profile visual customization data for the session user
 *     tags:
 *       - Profile
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile attributes returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nombre:
 *                   type: string
 *                   example: "Gabriel"
 *                 color:
 *                   type: string
 *                   example: "#00FFFF"
 *                 img:
 *                   type: string
 *                   nullable: true
 *                   example: ".png"
 *       401:
 *         description: Missing or invalid authentication session.
 *       500:
 *         description: Database retrieval error.
 */
router.get('/datos', container.profileController.getProfileData);

/**
 * @openapi
 * /perfil/color:
 *   post:
 *     summary: Update hex color styling parameters for the user's name
 *     tags:
 *       - Profile
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - color
 *             properties:
 *               color:
 *                 type: string
 *                 example: "#FF0000"
 *     responses:
 *       200:
 *         description: Profile text color updated successfully.
 *       403:
 *         description: Forbidden. Donator or Admin status required.
 *       500:
 *         description: Internal operational error.
 */
router.post('/color', container.profileController.updateColor);

/**
 * @openapi
 * /perfil/img:
 *   post:
 *     summary: Upload and update the profile avatar image format
 *     tags:
 *       - Profile
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - img
 *             properties:
 *               img:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file.
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully.
 *       400:
 *         description: Bad request. File not provided or validation failed.
 *       403:
 *         description: Forbidden. Donator or Admin status required.
 */
router.post('/img', upload.single('img'), container.profileController.updateProfileImage);

/**
 * @openapi
 * /perfil/nombre:
 *   post:
 *     summary: Change username across logs, profile systems, and files
 *     tags:
 *       - Profile
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "NewGabriel"
 *     responses:
 *       200:
 *         description: Username changed successfully.
 *       403:
 *         description: Forbidden. Donator or Admin status required.
 *       409:
 *         description: Username conflict. Requested name is already taken.
 *       500:
 *         description: File system or database transactional error.
 */
router.post('/nombre', container.profileController.updateUsername);

export default router;