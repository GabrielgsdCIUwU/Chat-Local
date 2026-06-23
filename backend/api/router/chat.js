import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isAuthenticated } from "./middlewares/isAuthenticated.js";
import { container } from "../../core/DIContainer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get("/msg", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "../../../public/views/messages.html"));
});

router.get("/commands", container.chatController.getCommands);
router.get("/users", container.chatController.getUsers);


export default router;