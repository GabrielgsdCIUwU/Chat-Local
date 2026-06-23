import path from "node:path";
import { fileURLToPath } from "node:url";
import { SubcommandRouter } from "../core/SubcommandRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const subcommandsPath = path.join(__dirname, "./rpg");

export const description = "Módulo de rol. Trabaja, craftea y mejora tus herramientas.";

export async function execute(context) {
    await SubcommandRouter.route(context, subcommandsPath, "rpg");
}