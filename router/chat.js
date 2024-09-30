import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/msg", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/views/messages.html"));
});


export default router;