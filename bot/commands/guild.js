import path from "node:path";
import { fileURLToPath } from "node:url";
import { BaseCommand } from "../core/BaseCommand.js";
import { SubcommandRouter } from "../core/SubcommandRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Router command for Guild module.
 * @extends BaseCommand
 */
class GuildRouter extends BaseCommand {
    constructor() {
        super({
            name: "guild",
            description: "Módulo de gremios. Funda o revisa clanes del servidor.",
        });
    }

    /**
     * @param {import('../core/BotContext.js').BotContext} context 
     */
    async run(context) {
        const subcommandsPath = path.join(__dirname, "./guild");
        await SubcommandRouter.route(context, subcommandsPath, this.name);
    }
}

export default new GuildRouter();