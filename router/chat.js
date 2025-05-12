import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { isAuthenticated } from "./middlewares/isAuthenticated.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/msg", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "../public/views/messages.html"));
});


export default router;