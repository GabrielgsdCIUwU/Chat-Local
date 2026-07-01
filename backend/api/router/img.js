import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import sizeOf from "image-size";
import { isAuthenticated } from "./middlewares/isAuthenticated.js";
import { container } from "../../core/DIContainer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storageEmoji = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = path.join(__dirname, "../../../resources/waitlist");
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storageEmoji });

/**
 * @openapi
 * /img/emoji:
 *   get:
 *     summary: Retrieve a detailed array list of all available system emoji files
 *     tags:
 *       - Media
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of registered emoji items with computed layout sizes and URLs.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "trout-trout-gang"
 *                   width:
 *                     type: integer
 *                     example: 50
 *                   height:
 *                     type: integer
 *                     example: 50
 *                   url:
 *                     type: string
 *                     example: "/resources/emojis/trout-trout-gang.gif"
 *       500:
 *         description: System directory read failure.
 */
router.get("/emoji", isAuthenticated, container.mediaController.getEmojis);

/**
 * @openapi
 * /img/emoji:
 *   post:
 *     summary: Upload a new emoji asset to the review waitlist directory
 *     tags:
 *       - Media
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *                 format: binary
 *                 description: The image file binary to upload as an emoji.
 *     responses:
 *       200:
 *         description: Emoji successfully queued in the waitlist directory.
 *       400:
 *         description: No valid files received.
 *       401:
 *         description: Unauthenticated session.
 */
router.post("/emoji", upload.single("emoji"), container.mediaController.uploadEmoji);

export default router;