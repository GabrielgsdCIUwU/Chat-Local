import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { BaseCommand } from "../core/BaseCommand.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = resolve(__dirname, "../../backend/data/chistes.json");
const data = await readFile(filePath, "utf-8");
const chistes = JSON.parse(data);

/**
 * Chiste command.
 * @extends BaseCommand
 */
class ChisteCommand extends BaseCommand {
    constructor() {
        super({
            name: "chiste",
            description: "Cuenta un chiste aleatorio para animar el chat.",
        });
    }

    async run(context, args) {
        const randomIndex = Math.floor(Math.random() * chistes.length);
        const chiste = chistes[randomIndex].contenido;
        context.reply(`✅ He aquí tu chiste:\n${chiste}`)
    }
}

export default new ChisteCommand();