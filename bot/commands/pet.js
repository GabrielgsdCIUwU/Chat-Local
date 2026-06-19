import path from "node:path";
import { fileURLToPath } from "node:url";
import { SubcommandRouter } from "../core/SubcommandRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const subcommandsPath = path.join(__dirname, "./pet");

export const description = "Módulo de mascotas. Compra huevos de gacha, ábrelos y equipa compañeros mágicos.";

/**
 * @param {import('../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    await SubcommandRouter.route(context, subcommandsPath, "pet");
}