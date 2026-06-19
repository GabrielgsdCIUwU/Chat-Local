import path from "node:path";
import { fileURLToPath } from "node:url";
import { SubcommandRouter } from "../core/SubcommandRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const subcommandsPath = path.join(__dirname, "./gambling");

export const description = "Módulo del casino y apuestas. ¡Juega bajo tu propio riesgo!";

export async function execute(context) {
    await SubcommandRouter.route(context, subcommandsPath, "gambling");
}