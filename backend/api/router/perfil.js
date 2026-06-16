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

router.get('/datos', container.profileController.getProfileData);
router.post('/color', container.profileController.updateColor);
router.post('/img', upload.single('img'), container.profileController.updateProfileImage);
router.post('/nombre', container.profileController.updateUsername);

export default router;