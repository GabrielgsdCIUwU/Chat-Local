import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();


router.post("/login", (req, res) => {
    const { name, passwd, location } = req.body

    if(!name || !passwd) return res.status(400).json({message: "Debes poner usuario y contraseña!"})

    if(!location) return res.status(400).json({message: "Se ha producido un error al obtener tu ip local"})

    const usersFilePath = path.join(__dirname, "../public/json/users.json");

    fs.readFile(usersFilePath, "utf-8", (err, data) => {
        let currenData = [];
        currenData = JSON.parse(fs.readFileSync(usersFilePath, "utf-8"));

        const userIndex = currenData.findIndex((user) => user.name === name)
        if (userIndex == -1) return res.status(400).json({message: "Usuario no encontrado"})
        if (currenData[userIndex].name === name && currenData[userIndex].passwd === passwd) {
            
        }

    });

    return res.status(200).json({message: "Login exitoso!"})
});

router.post("/register", (req, res) => {
    try{
        const { location, name, passwd } = req.body
        const usersFilePath = path.join(__dirname, "../public/json/users.json");
        if(!name || !passwd) return res.status(400).json({message: "Debes poner usuario y contraseña!"})

        fs.readFile(usersFilePath, "utf-8", (err, data) => {
            if (err) {
                console.log(err)
                res.status(500).json({ message: "Error al cargar los usuarios"});
            } 
            let usersData = [];
            try {
                usersData = JSON.parse(data);
                console.log("userdsdata: " + usersData)
            } catch (error) {
                return res.status(500).json({ message: "Error al pasar los usuarios"});
            }
            const newUser = {
                name: name,
                passwd: passwd,
            }
            usersData.push(newUser)
            fs.writeFile(usersFilePath, JSON.stringify(usersData, null, 2), "utf-8", (err) => {
                if(err) {
                    console.error("Error writting users", err)
                    return res.status(500).json({ message: "Error al escribir el usuario"})
                }
                
                res.status(200).json({ message: "Usuario creado exitosamente"})
            });
    
            
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Unexpected error occurred" });
    }
    
});

export default router;