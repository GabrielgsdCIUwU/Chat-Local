import path from "node:path";
import { fileURLToPath } from "node:url";
import { BaseCommand } from "../core/BaseCommand.js";
import { SubcommandRouter } from "../core/SubcommandRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Router command for Market module.
 * @extends BaseCommand
 */
class MarketRouter extends BaseCommand {
    constructor() {
        super({
            name: "market",
            description: "Mercado global. Compra y vende materiales con otros jugadores.",
        });
    }

    /**
     * @param {import('../core/BotContext.js').BotContext} context 
     */
    async run(context) {
        const subcommandsPath = path.join(__dirname, "./market");
        await SubcommandRouter.route(context, subcommandsPath, this.name);
    }
}

export default new MarketRouter();