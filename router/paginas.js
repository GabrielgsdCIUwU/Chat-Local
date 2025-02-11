import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, "../backend/json/users.json");


const router = express.Router();

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect("/login");
    }
}
function isUserDonate(req, callback) {
    return new Promise((resolve, reject) => {
        fs.readFile(usersFilePath, "utf8", (err, data) => {
            if (err) {
                console.error("Error al leer los usuarios:", err);
                return resolve(false);
            }
            
            let usersData = [];
            try {
                usersData = JSON.parse(data);
                const user = usersData.find(user => user.name === req.session.user.name && (user.role === "Donador" || user.role === "Admin"));
                resolve(!!user);
            } catch (error) {
                console.error("Error al parsear los usuarios:", error);
                resolve(false);
            }
        });
    });
}

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

router.get("/perfil", isAuthenticated, async (req, res) => {
    const isDonor = await isUserDonate(req);
    if (isDonor) {
        res.sendFile(path.join(__dirname, "../public/views/perfil.html"));
    } else {
        res.redirect("/donar");
    }
});

router.get("/donar", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/views/donar.html"));
});

export default router;