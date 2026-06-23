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



router.get("/emoji", isAuthenticated, container.mediaController.getEmojis);
router.post("/emoji", upload.single("emoji"), container.mediaController.uploadEmoji);

export default router;