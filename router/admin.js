import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.post("/login", (req, res) => {
    const { name, passwd } = req.body;

    if (!name || !passwd) {
        return res.status(400).json({ message: "Debes poner usuario y contraseña!" });
    }
    const location = req.ip
    if (!location) {
        return res.status(400).json({ message: "Se ha producido un error al obtener tu IP local" });
    }
    const bannedIPs = JSON.parse(fs.readFileSync('./backend/json/usersban.json'));
    const blockedIP = bannedIPs.find(banned => banned.ip === location);
    if (blockedIP) return res.status(403).json({ message: `Lo siento pero has sido baneado por: ${blockedIP.motivo}`})

    const usersFilePath = path.join(__dirname, "../backend/json/users.json");

    fs.readFile(usersFilePath, "utf-8", (err, data) => {
        if (err) {
            return res.status(500).json({ message: "Error al leer los usuarios" });
        }

        let currenData = JSON.parse(data);
        const userIndex = currenData.findIndex((user) => user.name === name);

        if (userIndex === -1) {
            return res.status(400).json({ message: "Usuario no encontrado" });
        }

        if (currenData[userIndex].passwd === passwd) {
            if (currenData[userIndex].location !== location) return res.status(400).json({message: "Tienes que iniciar sesión en el mismo sitio que has creado la cuenta!!"})
            req.session.user = { name: currenData[userIndex].name };
            return res.status(200).json({ message: "Login exitoso!" });
        } else {
            return res.status(401).json({ message: "Usuario o contraseña incorrecta!" });
        }
    });
});

router.post("/register", (req, res) => {
    try {
        const {name, passwd } = req.body;
        const usersFilePath = path.join(__dirname, "../backend/json/users.json");
        if (!name || !passwd) {
            return res.status(400).json({ message: "Debes poner usuario y contraseña!" });
        }

        fs.readFile(usersFilePath, "utf-8", (err, data) => {
            if (err) {
                return res.status(500).json({ message: "Error al cargar los usuarios" });
            }

            let usersData = JSON.parse(data);

            const userExists = usersData.find((user) => user.name === name);

            if (userExists) {
                return res.status(400).json({ message: "El usuario ya existe" });
            }

            const newUser = { name, passwd, location: req.ip };
            usersData.push(newUser);

            fs.writeFile(usersFilePath, JSON.stringify(usersData, null, 2), "utf-8", (err) => {
                if (err) {
                    return res.status(500).json({ message: "Error al escribir el usuario" });
                }

                res.status(200).json({ message: "Usuario creado exitosamente" });
            });
        });
    } catch (error) {
        res.status(500).json({ error: "Unexpected error occurred" });
    }
});

export default router;
