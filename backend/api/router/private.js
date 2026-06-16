import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

export default function(io) {
    router.get("/reload", (req, res) => {
        if (req.ip === "::1" || req.ip === "::ffff:127.0.0.1") {
            io.emit("reload");
            res.sendFile(path.join(__dirname, "../../../public/views/reload.html"));
        } else {
            res.status(403).send("Forbidden");
        }
    });

    router.get("/testing", (req, res) => {
        if (req.ip === "::1" || req.ip === "::ffff:127.0.0.1") {
            res.sendFile(path.join(__dirname, "../public/views/testing.html"));
        }
    });

    router.get("/md", (req, res) => {
        if (req.ip === "::1" || req.ip === "::ffff:127.0.0.1") {
            res.sendFile(path.join(__dirname, "../public/views/testing-md.html"));
        }
    });

    return router;
}