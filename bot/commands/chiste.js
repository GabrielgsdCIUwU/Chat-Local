import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = resolve(__dirname, "../../backend/data/chistes.json");
const data = await readFile(filePath, "utf-8");
const chistes = JSON.parse(data);

export const description = "Cuenta un chiste aleatorio para animar el chat.";

/**
 * 
 * @param {import('../core/BotContext.js').BotContext} context 
 */
export function execute(context) {

    const randomIndex = Math.floor(Math.random() * chistes.length);
    const chiste = chistes[randomIndex].contenido;
    context.reply(`✅ He aquí tu chiste:\n${chiste}`)
}