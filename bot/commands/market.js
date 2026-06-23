import path from "node:path";
import { fileURLToPath } from "node:url";
import { SubcommandRouter } from "../core/SubcommandRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const subcommandsPath = path.join(__dirname, "./market");

export const description = "Mercado global. Compra y vende materiales con otros jugadores.";

export async function execute(context) {
    await SubcommandRouter.route(context, subcommandsPath, "market");
}