import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect("/login");
    }
}


router.get("/msg", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "../public/views/messages.html"));
});


export default router;