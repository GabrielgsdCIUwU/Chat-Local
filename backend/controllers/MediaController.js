import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ApiResponse } from "../core/ApiResponse.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MediaController {
    /**
     * @param {import('../services/EmojiService.js').EmojiService} emojiService 
     */
    constructor(emojiService) {
        this.emojiService = emojiService;
    }


    getEmojis = (req, res) => {
        try {
            const emojis = this.emojiService.getEmojiMetada();
            return res.json(emojis);
        } catch (error) {
            console.error("Error fecthing emojis:", error);
            ApiResponse.error(res, "Error al cargar emojis", 500);
        }
    };

    uploadEmoji = (req, res) => {
        if (!req.file) {
            ApiResponse.error(res, "No se ha subido una imagen", 400);
        }

        const targetPath = path.join(__dirname, "../../resources/waitlist", req.file.originalname);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });

        ApiResponse.success(res, "Se ha subido la imagen correctamente", 200);
    }
}