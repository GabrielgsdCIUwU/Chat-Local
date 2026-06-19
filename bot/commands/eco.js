import path from "node:path";
import { fileURLToPath } from "node:url";
import { SubcommandRouter } from "../core/SubcommandRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const subcommandsPath = path.join(__dirname, "./eco");

export const description = "Módulo principal de economía. Usa subcomandos para gestionar tu dinero.";

export async function execute(context) {
    await SubcommandRouter.route(context, subcommandsPath, "eco");
}