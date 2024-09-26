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
    res.sendFile(path.join(__dirname, "../public/views/login.html"))
})

export default router;