import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { isAuthenticated } from "./middlewares/isAuthenticated.js";
import { isUserDonate } from "./middlewares/isUserDonate.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, "../backend/json/users.json");


const router = express.Router();


router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../../../public/views/index.html"));
});

router.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../../../public/views/login.html"));
});

router.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../../../public/views/register.html"));
});

router.get("/md/:user", (req, res) => {
    const username = req.params.user;

    if(!req.isAuthenticated()) return res.redirect("/login");

    res.sendFile(path.join(__dirname, "./public/views/testing-md.html"))
});

router.get("/perfil", isAuthenticated, async (req, res) => {
    const isDonor = await isUserDonate(req);
    if (isDonor) {
        res.sendFile(path.join(__dirname, "../../../public/views/perfil.html"));
    } else {
        res.redirect("/donar");
    }
});

router.get("/donar", (req, res) => {
    res.sendFile(path.join(__dirname, "../../../public/views/donar.html"));
});

export default router;