import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/views/index.html"));
});

router.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/views/login.html"));
});

router.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/views/register.html"));
});

router.get("/md/:user", (req, res) => {
    const username = req.params.user;

    if(!req.isAuthenticated()) return res.redirect("/login");

    res.sendFile(path.join(__dirname, "./public/views/testing-md.html"))
});

export default router;