import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();


router.post("/login", (req, res) => {
    const { nombre, passwd, location } = req.body
    console.log(location)

    if(!nombre || !passwd) return res.status(400).json({message: "Debes poner usuario y contraseña!"})

    if(!location) return res.status(400).json({message: "Se ha producido un error al obtener tu ip local"})


    const usuario = {
        location: location,
        name: nombre,
        passwd: passwd,
    }
    print(usuario)
});

export default router;