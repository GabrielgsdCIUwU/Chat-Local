import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersFilePath = path.join(__dirname, "../backend/json/users.json");
const profileDir = path.join(__dirname, "../resources/profiles")

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../resources/profiles/");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {recursive: true});
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const username = req.session.user.name;
        const filename = `${username}_profile${ext}`;
        cb(null, filename);
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
router.get('/datos', (req, res) => {
    fs.readFile(usersFilePath, (err, data) => {
        if (err) {
            console.error("Error al leer los usuarios:", err);
            return res.status(500).json({ message: "Error al leer los usuarios" });
        }
        let usersData = [];
        try {
            usersData = JSON.parse(data);
            const user = usersData.find(user => user.name === req.session.user.name);
            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }
            let datos = {
                nombre: user.name,
                color: user.color || "#FFFFFF",
            };
            res.json(datos);
        } catch (error) {
            console.error("Error al parsear los usuarios:", error);
            return res.status(500).json({ message: "Error al parsear los usuarios" });
        }
    });
});

//region color
router.post('/color', (req, res) => {
    const { color } = req.body;
    fs.readFile(usersFilePath, (err, data) => {
        if (err) {
            console.error("Error al leer los usuarios:", err);
            return res.status(500).json({ message: "Error al leer los usuarios" });
        }

        let usersData = [];
        try {
            usersData = JSON.parse(data);
            console.log(req.session.user.name)
            const user = usersData.find(user => user.name === req.session.user.name);
            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }
            if (user.role != "Donador" && user.role != "Admin") {
                return res.status(403).json({ message: "No tienes permisos para cambiar el color" });
            }
            user.color = color;

            fs.writeFile(usersFilePath, JSON.stringify(usersData, null, 2), (err) => {
                if (err) {
                    console.error("Error al escribir los usuarios:", err);
                    return res.status(500).json({ message: "Error al escribir los usuarios" });
                }
                return res.json({message: "Color actualizado correctamente", color});
            });
        } catch (error) {
            console.error("Error al parsear los usuarios:", error);
            return res.status(500).json({ message: "Error al parsear los usuarios" });
        }
    });
});

//region imagen
router.post('/img', upload.single('img'), (req, res) => {
    if(!req.file) {
        return res.status(400).json({message: "No se ha subido ninguna imágen válida"});
    }
    return res.json({message: "Imagen de perfil subida correctamente", filename: req.file.filename});
});


//region nombre
router.post('/nombre', (req, res) => {
    const { nombre } = req.body;
    fs.readFile(usersFilePath, (err, data) => {
        if (err) {
            console.error("Error al leer los usuarios:", err);
            return res.status(500).json({ message: "Error al leer los usuarios" });
        }

        let usersData = [];
        try {
            usersData = JSON.parse(data);
            const user = usersData.find(user => user.name === req.session.user.name);
            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }
            if (user.role != "Donador" && user.role != "Admin") {
                return res.status(403).json({ message: "No tienes permisos para cambiar el nombre" });
            }
            const searchName = usersData.find(user => user.name === nombre);
            if (searchName && searchName.name !== user.name) {
                return res.status(409).json({ message: "Nombre de usuario ya utilizado" });
            }
            user.name = nombre;

            fs.writeFile(usersFilePath, JSON.stringify(usersData, null, 2), (err) => {
                if (err) {
                    console.error("Error al escribir los usuarios:", err);
                    return res.status(500).json({ message: "Error al escribir los usuarios" });
                }

                const profileFiles = fs.readdirSync(profileDir);
                const profileFile = profileFiles.find(file => file.startsWith(`${req.session.user.name}_profile.`));

                if (profileFile) {
                    const oldProfilePath = path.join(profileDir, profileFile);
                    const ext = path.extname(profileFile)
                    const newProfilePath = path.join(profileDir, `${nombre}_profile${ext}`);

                    fs.renameSync(oldProfilePath, newProfilePath);
                }
                req.session.user.name = nombre;
                return res.json({message: "Nombre actualizado correctamente", nombre});
            });
        } catch (error) {
            console.error("Error al parsear los usuarios:", error);
            return res.status(500).json({ message: "Error al parsear los usuarios" });
        }
    });
});

export default router;