import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import sizeOf from "image-size";
import { url } from "inspector";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const router = express.Router();

function isAuthenticated(req, res, next) {
    if(req.session && req.session.user) {
        return next();
    } else {
        return res.redirect("/login")
    }
}


const storageEmoji = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = path.join(__dirname, "../resources/emojis");
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storageEmoji });



router.get("/emoji", isAuthenticated, (req, res) => {
    const images = [];
    const imgDir = path.join(__dirname, "../resources/emojis");
    
    const files = fs.readdirSync(imgDir);
    files.forEach((file) => {
        const fullPath = path.join(imgDir, file);
        
        const dimensions = sizeOf(fullPath);
        images.push({
            name: path.parse(file).name,
            width: dimensions.width,
            height: dimensions.height,
            url: `/resources/emojis/${file}`
        });
    });

    res.json(images)
});

router.post(
    "/emoji",
    upload.single("image"),
    (req, res) => {
        if (!req.file) return res.status(400).send("No se ha subido una imagen.");

        const file = req.file
        const targetPath = path.join(__dirname, "../resources/emojis", file.originalname)

        fs.mkdirSync(path.dirname(targetPath), {recursive: true});

        res.redirect("/msg")
    }
);

export default router;