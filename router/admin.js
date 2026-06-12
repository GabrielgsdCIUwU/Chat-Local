import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import isAdmin from "./middlewares/isAdmin.js";

import { JsonDatabaseClient } from "../backend/database/JsonDatabaseClient.js";
import { UserRepository } from "../backend/repositories/UserRepository.js";
import { BannedIpRepository } from "../backend/repositories/BannedIpRepository.js";
import { AuthService } from "../backend/services/AuthService.js";
import { ApiResponse } from "../backend/core/ApiResponse.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const userDbClient = new JsonDatabaseClient(path.join(__dirname, "../backend/json/users.json"));
const bannedDbClient = new JsonDatabaseClient(path.join(__dirname, "../backend/json/usersban.json"));

const userRepository = new UserRepository(userDbClient);
const bannedIpRepository = new BannedIpRepository(bannedDbClient);
const authService = new AuthService(userRepository, bannedIpRepository);

router.post("/login", async (req, res) => {
    try {
        const { name, passwd } = req.body;

        if (!name || !passwd) {
            return ApiResponse.error(res, "Debes poner usuario y contraseña!", 400);
        }
        const location = req.ip
        if (!location) {
            return ApiResponse.error(res, "Se ha producido un error al obtener tu IP local", 400);
        }

        const userDTO = await authService.login(name, passwd, location);

        req.session.user = { name: userDTO.name };
        return ApiResponse.success(res, "Login exitoso!", userDTO);
    } catch (error) {
        const statusCode = error.message.includes('baneado') ? 403 : 401;
        return ApiResponse.error(res, error.message, statusCode);
    }
});

router.post("/register", async (req, res) => {
    try {
        const { name, passwd } = req.body;
        if (!name || !passwd) return ApiResponse.error(res, "Debes poner usuario y contraseña!", 400);

        await authService.register(name, passwd, ip);
        return ApiResponse.success(res, "Usuario creado exitosamente");
    } catch (error) {
        return ApiResponse.error(res, error.message, 400);
    }
});


router.get("/role", (req, res) => {
    if (isAdmin) {
        res.sendFile(path.join(__dirname, "../public/views/roles.html"));
    }
});

router.get("/list/users", async (req, res) => {
    try {
        const users = await userRepository.findAll();
        const names = users.map(user => user.name);
        return res.json(names);
    } catch (error) {
        console.error(error);
        return ApiResponse.error(res, "Se ha producido un error en el servidor.", 500)
    }
});

export default router;
