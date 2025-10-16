import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = resolve(__dirname, "../../public/json/chistes.json");
const data = await readFile(filePath, "utf-8");
const chistes = JSON.parse(data);


export function execute({ args, socket, io }) {
    const timestamp = new Date().getTime();

    const randomIndex = Math.floor(Math.random() * chistes.length);
    const chiste = chistes[randomIndex].contenido;

    const response = `✅ He aquí tu chiste:\n${chiste}`;

    io.emit("sendmsg", { user: "🤖 Bot", message: response, timestamp });
}