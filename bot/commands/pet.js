import path from "node:path";
import { fileURLToPath } from "node:url";
import { BaseCommand } from "../core/BaseCommand.js";
import { SubcommandRouter } from "../core/SubcommandRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Router command for Pet module.
 * @extends BaseCommand
 */
class PetRouter extends BaseCommand {
    constructor() {
        super({
            name: "pet",
            description: "Módulo de mascotas. Compra huevos de gacha, ábrelos y equipa compañeros mágicos.",
        });
    }

    /**
     * @param {import('../core/BotContext.js').BotContext} context 
     */
    async run(context) {
        const subcommandsPath = path.join(__dirname, "./pet");
        await SubcommandRouter.route(context, subcommandsPath, this.name);
    }
}

export default new PetRouter();