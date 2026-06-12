import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import multer from "multer";

import { JsonDatabaseClient } from "../backend/database/JsonDatabaseClient.js";
import { UserRepository } from "../backend/repositories/UserRepository.js";
import { UserService } from "../backend/services/UserService.js";
import { ApiResponse } from "../backend/core/ApiResponse.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);   
const profileDir = path.join(__dirname, "../resources/profiles");     

const router = express.Router();

const userDbClient = new JsonDatabaseClient(path.join(__dirname, "../backend/json/users.json"));
const userRepository = new UserRepository(userDbClient);
const userService = new UserService(userRepository, profileDir);

let extensionFile;
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

//region datos
router.get('/datos', async (req, res) => {
    try {
        const data = await userService.getUserData(req.session.user.name);
        res.json(data);
    } catch (error) {
        ApiResponse.error(res, error.message, 500);
    }
});

//region color
router.post('/color', async (req, res) => {
    const { color } = req.body;
    try {
        await userService.changeColor(req.session.user.name, color);
        ApiResponse.success(res, "Color actualizado correctamente", { color: color});
    } catch (error) {
        ApiResponse.error(res, error.message, error.message.includes("permisos") ? 403 : 500);
    }
});

//region imagen
router.post('/img', upload.single('img'), async (req, res) => {
    if (!req.file) return ApiResponse.error(res, "No se ha subido ninguna imágen válida", 400);

    try {
        await userService.changeProfileImage(req.session.user.name, extensionFile);
        ApiResponse.success(res, "Imagen de perfil subida correctamente", {filename: req.file.filename});
    } catch (error) {
        ApiResponse.error(res, error.message, 403);
    }
});


//region nombre
router.post('/nombre', async (req, res) => {
    const { nombre: newName } = req.body;
    try {
        await userService.changename(req.session.user.name, newName);
        req.session.user.name = newName;
        ApiResponse.success(res, "Nombre actualizado correctamente", { nombre: newName});
    } catch (error) {
        const status = error.message.includes("utilizado") ? 409 : (error.message.includes("permisos") ? 403 : 500);
        ApiResponse.error(res, error.message, status);
    }
});

export default router;