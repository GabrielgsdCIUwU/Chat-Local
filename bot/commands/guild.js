import path from "node:path";
import { fileURLToPath } from "node:url";
import { SubcommandRouter } from "../core/SubcommandRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const subcommandsPath = path.join(__dirname, "./guild");

export const description = "Módulo de gremios. Funda o revisa clanes del servidor.";

export async function execute(context) {
    await SubcommandRouter.route(context, subcommandsPath, "guild");
}